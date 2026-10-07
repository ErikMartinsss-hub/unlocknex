import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { categoriesSeed } from '@/lib/seed-data';

export const runtime = 'nodejs';

const CATEGORY_IDS = new Set(categoriesSeed.map((c) => c.id));

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'servico';

/**
 * Adiciona UM serviço da API ao catálogo (Firestore), na categoria escolhida.
 * POST /api/admin/services/add — restrito a role 'admin'.
 * Ex.: categoria 'cat-remote' → aparece na página de Aluguel de Ferramentas.
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
    return NextResponse.json({ ok: false, message: 'Envie os dados do serviço.' }, { status: 400 });
  }

  const uuid = String(body.uuid ?? '').trim();
  const name = String(body.name ?? '').trim();
  const price = Number(body.price);
  const categoryId = String(body.categoryId ?? '').trim();
  const apiField = String(body.apiField ?? '').trim() || 'Serial';
  const deliveryTime = String(body.deliveryTime ?? '').trim() || 'Instantâneo';
  const imageUrl = String(body.imageUrl ?? '').trim();

  if (!uuid || uuid.length > 64) {
    return NextResponse.json({ ok: false, message: 'Produto da API inválido.' }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ ok: false, message: 'Nome do serviço em branco.' }, { status: 400 });
  }
  if (!Number.isFinite(price) || price <= 0 || price > 10000) {
    return NextResponse.json({ ok: false, message: 'Preço inválido (use um valor entre R$ 0,01 e R$ 10.000).' }, { status: 400 });
  }
  if (!CATEGORY_IDS.has(categoryId)) {
    return NextResponse.json({ ok: false, message: 'Categoria inválida.' }, { status: 400 });
  }
  if (imageUrl && !/^https?:\/\/.+/.test(imageUrl)) {
    return NextResponse.json({ ok: false, message: 'URL da imagem inválida.' }, { status: 400 });
  }

  const id = `api-${categoryId.replace('cat-', '')}-${uuid}`;
  const rec = {
    id,
    categoryId,
    slug: `${slugify(name)}-${uuid}`,
    name,
    description: name,
    price: Math.round(price * 100) / 100,
    deliveryTime,
    provider: 'auto',
    productUuid: uuid,
    apiField,
    apiExtra: null,
    imageUrl: imageUrl || null,
    isActive: true,
  };

  await db.doc(`services/${id}`).set(rec, { merge: true });
  return NextResponse.json({ ok: true, message: `Adicionado ao catálogo: ${name}`, id });
}