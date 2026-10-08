import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { huGetProducts } from '@/lib/heartunlocks';

export const runtime = 'nodejs';

// Produtos de ATIVAÇÃO DE LICENÇA (ex.: UnlockTool Renew / Activation /
// Renew 3 months License). Filtra pelo nome do produto na API.
const KEYWORDS = /unlocktool|renew|activation|license|licen/i;

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'servico';

/**
 * Puxa da API HeartUnlocks os produtos de ativação de licença e cria UM
 * serviço para cada um na categoria 'cat-licenca' (página Ativação de Licença).
 * POST /api/admin/services/pull-licenca — restrito a role 'admin'.
 * Body: { price } — preço padrão em R$ usado para todos os que forem puxados.
 */
export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ ok: false, message: 'Não autenticado.' }, { status: 401 });

  let claims;
  try {
    claims = await getAdminAuth().verifyIdToken(token);
  } catch {
    return NextResponse.json({ ok: false, message: 'Sessão inválida.' }, { status: 401 });
  }

  const db = getAdminDb();
  const adminSnap = await db.doc(`users/${claims.uid}`).get().catch(() => null);
  if ((adminSnap?.data() as { role?: string } | undefined)?.role !== 'admin') {
    return NextResponse.json({ ok: false, message: 'Acesso restrito ao administrador.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, message: 'Envie o preço padrão das licenças.' }, { status: 400 });
  }

  const price = Number(body.price);
  if (!Number.isFinite(price) || price <= 0 || price > 10000) {
    return NextResponse.json(
      { ok: false, message: 'Preço inválido (use um valor entre R$ 0,01 e R$ 10.000).' },
      { status: 400 }
    );
  }
  const deliveryTime = String(body.deliveryTime ?? '').trim() || 'Instantâneo';

  const data = await huGetProducts();
  const products = Object.values(data.products ?? {});
  const matches = products.filter((p) => KEYWORDS.test(p.name ?? ''));

  if (matches.length === 0) {
    return NextResponse.json({
      ok: true,
      added: [],
      skipped: 0,
      message: 'Nenhum produto de licença encontrado no catálogo da API.',
    });
  }

  const col = db.collection('services');
  const added: string[] = [];
  let skipped = 0;

  for (const p of matches) {
    const existing = await col.where('productUuid', '==', p.uuid).limit(1).get().catch(() => null);
    if (existing && !existing.empty) {
      skipped++;
      continue;
    }
    const field =
      (p.fields ?? []).find((f) => f.required)?.name ?? p.fields?.[0]?.name ?? 'Serial';
    const id = `api-licenca-${p.uuid}`;
    await col.doc(id).set(
      {
        id,
        categoryId: 'cat-licenca',
        slug: `${slugify(p.name)}-${p.uuid}`,
        name: p.name,
        description: p.name,
        price: Math.round(price * 100) / 100,
        deliveryTime,
        provider: 'auto',
        productUuid: p.uuid,
        apiField: field,
        apiExtra: null,
        imageUrl: p.image_url ?? null,
        isActive: true,
      },
      { merge: true }
    );
    added.push(p.name);
  }

  return NextResponse.json({ ok: true, added, skipped, total: matches.length });
}