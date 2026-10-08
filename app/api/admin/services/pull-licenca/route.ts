import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { huGetProducts } from '@/lib/heartunlocks';
import { categoriesSeed } from '@/lib/seed-data';

export const runtime = 'nodejs';

// Hobby: o padrão é 10s e o máximo 60s. Com gravação em lote do Firestore
// o puxar inteiro cabe folgado nesse limite.
export const maxDuration = 60;

// Páginas do site onde os produtos puxados podem cair (categorias do seed).
const DESTINOS = new Set(categoriesSeed.map((c) => c.id));

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
 * Puxa produtos da API HeartUnlocks (por categoria da API e/ou termo no
 * nome) e cria um serviço para cada um na página de destino escolhida.
 * POST /api/admin/services/pull-licenca — restrito a role 'admin'.
 * Body: { price, deliveryTime?, term?, cid?, destino? } — price é o preço
 * padrão em R$ usado para todos os puxados; destino é uma categoria do site
 * (padrão 'cat-licenca', página Ativação de Licença).
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
  // Termo opcional digitado pelo admin; sem termo, usa as palavras de licença.
  const term = String(body.term ?? '').trim().toLowerCase();
  // Tipo na API (imei | server | remote — igual ao filtro "Types" do site
  // da Heart), categoria da API (cid) e página de destino (categoria do site).
  const tipo = String(body.tipo ?? '').trim();
  const cid = String(body.cid ?? '').trim();
  const destino = String(body.destino ?? '').trim() || 'cat-licenca';
  if (!DESTINOS.has(destino)) {
    return NextResponse.json({ ok: false, message: 'Página de destino inválida.' }, { status: 400 });
  }
  const destinoTag = destino.replace('cat-', '');

  const data = await huGetProducts();
  const products = Object.values(data.products ?? {});
  const matches = products.filter((p) => {
    if (tipo && p.type !== tipo) return false;
    if (cid && cid !== '__all__' && p.cid !== cid) return false;
    const nome = p.name ?? '';
    if (cid === '__all__') return true;
    // Com termo digitado, busca literal; com categoria, traz a categoria
    // inteira; sem nenhum dos dois, usa palavras-chave de licença.
    if (term) return nome.toLowerCase().includes(term);
    return cid ? true : KEYWORDS.test(nome);
  });
  const matchedNames = matches.map((p) => p.name ?? '');

  if (matches.length === 0) {
    const alvo = cid
      ? 'a categoria selecionada da API'
      : tipo
        ? 'esse tipo da API'
        : term
          ? `"${term}"`
          : 'as palavras de licença';
    return NextResponse.json({
      ok: true,
      added: [],
      skipped: 0,
      matched: [],
      total: products.length,
      sample: products
        .map((p) => p.name ?? '')
        .filter(Boolean)
        .slice(0, 24),
      message: `Nenhum produto encontrado com ${alvo} (o catálogo tem ${products.length} produtos).`,
    });
  }

  const col = db.collection('services');
  // Dedup em UMA busca (evita uma query por produto — "puxar tudo" tem ~1906).
  const existingUuids = new Set<string>();
  try {
    const snap = await col.select('productUuid').get();
    snap.forEach((d) => {
      const v = d.data()?.productUuid;
      if (v) existingUuids.add(String(v));
    });
  } catch {
    // Se a leitura falhar, segue sem dedup (set com merge é idempotente por id).
  }

  const added: string[] = [];
  let skipped = 0;
  // Gravação em LOTE ATÔMICO do Firestore (máx. 500 ops por commit) — bem
  // mais rápido que 1 documento por vez e cabe nos 60s da Vercel Hobby.
  const LOTE = 400;
  let batch = db.batch();
  let batchSize = 0;
  const flushar = async () => {
    if (batchSize === 0) return;
    await batch.commit();
    batch = db.batch();
    batchSize = 0;
  };

  for (const p of matches) {
    if (existingUuids.has(p.uuid)) {
      skipped++;
      continue;
    }
    const field =
      (p.fields ?? []).find((f) => f.required)?.name ?? p.fields?.[0]?.name ?? 'Serial';
    const id = `api-${destinoTag}-${p.uuid}`;
    batch.set(
      col.doc(id),
      {
        id,
        categoryId: destino,
        slug: `${slugify(p.name)}-${p.uuid}`,
        name: p.name,
        description: p.name,
        price: Math.round(price * 100) / 100,
        deliveryTime,
        provider: 'auto',
        productUuid: p.uuid,
        apiField: field,
        apiExtra: null,
        apiFields: p.fields ?? null,
        imageUrl: p.image_url ?? null,
        isActive: true,
      },
      { merge: true }
    );
    added.push(p.name);
    batchSize++;
    if (batchSize >= LOTE) await flushar();
  }
  await flushar();

  return NextResponse.json({
    ok: true,
    added,
    skipped,
    matched: matchedNames,
    total: products.length,
    sample: [],
  });
}