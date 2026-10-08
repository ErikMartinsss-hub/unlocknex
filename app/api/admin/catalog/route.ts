import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { huGetProducts } from '@/lib/heartunlocks';

export const runtime = 'nodejs';

/**
 * Lista o catálogo inteiro da API (HeartUnlocks) para o admin escolher
 * serviço por serviço e adicionar ao Aluguel ou aos Serviços.
 * GET /api/admin/catalog — restrito a role 'admin'.
 */
export async function GET(req: NextRequest) {
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

  try {
    const data = await huGetProducts();
    const rawProducts = Object.values(data.products ?? {});
    const apiCategoryCounts: Record<string, number> = {};
    for (const p of rawProducts) {
      if (p.cid) apiCategoryCounts[p.cid] = (apiCategoryCounts[p.cid] ?? 0) + 1;
    }
    const products = rawProducts.map((p) => ({
      uuid: p.uuid,
      name: p.name,
      price: Number(p.price) || 0,
      imageUrl: p.image_url ?? '',
      // Campo que o cliente vai preencher (IMEI, Serial, Quantity…) — o
      // primeiro campo obrigatório do produto, com fallback 'Serial'.
      field: (p.fields ?? []).find((f) => f.required)?.name ?? p.fields?.[0]?.name ?? 'Serial',
    }));
    return NextResponse.json({
      ok: true,
      currency: data.currency ?? 'USD',
      apiCategories: data.categories ?? {},
      apiCategoryCounts,
      products,
    });
  } catch (e) {
    console.error('[catalog] falha ao buscar catálogo:', e);
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : 'Falha ao buscar o catálogo da API.' },
      { status: 500 }
    );
  }
}