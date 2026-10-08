import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { huGetProducts } from '@/lib/heartunlocks';
import { categoriesSeed } from '@/lib/seed-data';

export const runtime = 'nodejs';

// Páginas do site (categorias do seed) para onde os serviços podem ir.
const DESTINOS = new Set(categoriesSeed.map((c) => c.id));

/**
 * Move serviços que JÁ ESTÃO no site para outra página, agrupando por tipo
 * e/ou categoria da API HeartUnlocks. Sem remover e puxar de novo.
 * POST /api/admin/services/mover — restrito a role 'admin'.
 * Body: { tipo?, cid?, destino, price?, deliveryTime? } — price/deliveryTime
 * opcionais: se enviados, são aplicados em todos os movidos.
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
    return NextResponse.json({ ok: false, message: 'Envie os dados do movimento.' }, { status: 400 });
  }

  const tipo = String(body.tipo ?? '').trim();
  const cid = String(body.cid ?? '').trim();
  const destino = String(body.destino ?? '').trim();
  if (!DESTINOS.has(destino)) {
    return NextResponse.json({ ok: false, message: 'Página de destino inválida.' }, { status: 400 });
  }
  if (!tipo && !cid) {
    return NextResponse.json(
      { ok: false, message: 'Escolha um tipo ou uma categoria da API para mover.' },
      { status: 400 }
    );
  }

  const rawPrice = body.price;
  const price =
    rawPrice == null || rawPrice === '' ? null : Number(rawPrice);
  if (price != null && (!Number.isFinite(price) || price <= 0 || price > 10000)) {
    return NextResponse.json(
      { ok: false, message: 'Preço inválido (use um valor entre R$ 0,01 e R$ 10.000).' },
      { status: 400 }
    );
  }
  const deliveryTime = String(body.deliveryTime ?? '').trim();

  // Quais produtos da API fazem parte do grupo (tipo/categoria) escolhido.
  const data = await huGetProducts();
  const alvos = new Set<string>();
  for (const p of Object.values(data.products ?? {})) {
    if (tipo && p.type !== tipo) continue;
    if (cid && p.cid !== cid) continue;
    alvos.add(p.uuid);
  }
  if (alvos.size === 0) {
    return NextResponse.json(
      { ok: false, message: 'Nenhum produto da API encontrado com esse filtro.' },
      { status: 404 }
    );
  }

  // Serviços do site cujo productUuid pertence ao grupo.
  const col = db.collection('services');
  const achados: { id: string; name: string }[] = [];
  try {
    const snap = await col.get();
    snap.forEach((d) => {
      const v = d.data() as { productUuid?: unknown; name?: string } | undefined;
      if (v?.productUuid && alvos.has(String(v.productUuid))) {
        achados.push({ id: d.id, name: v.name ?? '' });
      }
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : 'Falha ao ler os serviços.' },
      { status: 500 }
    );
  }

  if (achados.length === 0) {
    return NextResponse.json(
      { ok: false, message: 'Nenhum serviço do site pertence a esse grupo da API.' },
      { status: 404 }
    );
  }

  // Atualiza em lotes (lotes de 200 escritas em paralelo).
  const writes: Promise<unknown>[] = [];
  for (const r of achados) {
    const patch: Record<string, unknown> = { categoryId: destino };
    if (price != null) patch.price = Math.round(price * 100) / 100;
    if (deliveryTime) patch.deliveryTime = deliveryTime;
    writes.push(col.doc(r.id).update(patch));
  }
  for (let i = 0; i < writes.length; i += 200) {
    await Promise.all(writes.slice(i, i + 200));
  }

  return NextResponse.json({
    ok: true,
    moved: achados.length,
    names: achados.slice(0, 50).map((r) => r.name),
    message: `${achados.length} serviço(s) movido(s) para a página.`,
  });
}