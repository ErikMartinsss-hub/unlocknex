import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { huGetProducts } from '@/lib/heartunlocks';
import { categoriesSeed } from '@/lib/seed-data';

export const runtime = 'nodejs';

// Páginas do site (categorias do seed) para onde os serviços podem ir.
const DESTINOS = new Set(categoriesSeed.map((c) => c.id));

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'servico';

// Regras de organização (a mesma lógica da tabela sugerida):
//  - C501 (Factory SIM Network Unlock Code By IMEI) e C22 (iPhone Check
//    Imei) → Desbloqueio de Operadora
//  - Categorias da API com FRP no nome → FRP
//  - Tipo IMEI Service → Reparo de IMEI
//  - Tipo Server Service → Ativação de Licença
//  - Qualquer outro (Remote, sem tipo) → página "default" escolhida no painel
const CID_UNLOCK = new Set(['C501', 'C22']);
const FRP_RE = /frp|frpfile|frptool/i;

/**
 * "Puxar TUDO e organizar": cria os serviços que faltam e move os já
 * existentes para a página correta, em UM clique.
 * POST /api/admin/services/organizar — restrito a role 'admin'.
 * Body: { price (obrigatório, R$), deliveryTime?, defaultCat? } — price é o
 * preço padrão usado só nos serviços NOVOS (os existentes mantêm o preço).
 * defaultCat é a página para Remote e produtos sem grupo ('cat-imei').
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
    return NextResponse.json({ ok: false, message: 'Envie o preço padrão.' }, { status: 400 });
  }

  const price = Number(body.price);
  if (!Number.isFinite(price) || price <= 0 || price > 10000) {
    return NextResponse.json(
      { ok: false, message: 'Preço inválido (use um valor entre R$ 0,01 e R$ 10.000).' },
      { status: 400 }
    );
  }
  const deliveryTime = String(body.deliveryTime ?? '').trim() || 'Instantâneo';
  const defaultCat = String(body.defaultCat ?? '').trim() || 'cat-imei';
  if (!DESTINOS.has(defaultCat)) {
    return NextResponse.json({ ok: false, message: 'Página padrão inválida.' }, { status: 400 });
  }

  const data = await huGetProducts();
  const products = Object.values(data.products ?? {});
  const cats = (data.categories ?? {}) as Record<string, { name?: string }>;

  // Mapa uuid → página do site.
  const mapa = new Map<string, string>();
  for (const p of products) {
    const catName = (p.cid && cats[p.cid]?.name) || '';
    let alvo: string;
    if (p.cid && CID_UNLOCK.has(p.cid)) alvo = 'cat-unlock';
    else if (FRP_RE.test(catName)) alvo = 'cat-frp';
    else if (p.type === 'imei') alvo = 'cat-imei';
    else if (p.type === 'server') alvo = 'cat-licenca';
    else alvo = defaultCat;
    mapa.set(p.uuid, alvo);
  }

  const col = db.collection('services');
  // Dedup em UMA busca: productUuid + categoria atual (para só mover os que mudaram).
  const existing = new Map<string, { docId: string; cat: string }>();
  try {
    const snap = await col.select('productUuid', 'categoryId').get();
    snap.forEach((d) => {
      const v = d.data() as { productUuid?: unknown; categoryId?: unknown };
      if (v?.productUuid) existing.set(String(v.productUuid), { docId: d.id, cat: String(v.categoryId ?? '') });
    });
  } catch {
    // Se a leitura falhar, segue tratando tudo como novo (set com merge é idempotente por id).
  }

  let added = 0;
  const porPagina: Record<string, number> = {};
  const escrever = (alvo: string) => {
    porPagina[alvo] = (porPagina[alvo] ?? 0) + 1;
  };

  const writes: Promise<unknown>[] = [];
  const flushar = async () => {
    if (writes.length === 0) return;
    await Promise.all(writes);
    writes.length = 0;
  };

  for (const p of products) {
    const alvo = mapa.get(p.uuid)!;
    const e = existing.get(p.uuid);
    if (e) {
      if (e.cat !== alvo) {
        escrever(alvo);
        writes.push(col.doc(e.docId).update({ categoryId: alvo }));
      }
    } else {
      added++;
      escrever(alvo);
      const tag = alvo.replace('cat-', '');
      const field =
        (p.fields ?? []).find((f) => f.required)?.name ?? p.fields?.[0]?.name ?? 'Serial';
      writes.push(
        col.doc(`api-${tag}-${p.uuid}`).set(
          {
            id: `api-${tag}-${p.uuid}`,
            categoryId: alvo,
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
        )
      );
    }
    if (writes.length >= 200) await flushar();
  }
  await flushar();

  const porPaginaNomes = Object.entries(porPagina)
    .map(([id, count]) => ({
      id,
      name: categoriesSeed.find((c) => c.id === id)?.name ?? id,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    ok: true,
    added,
    porPagina: porPaginaNomes,
    total: products.length,
    message: `Organizado: ${added} novo(s) e o restante movido para a página certa.`,
  });
}