import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { categoriesSeed, servicesSeed, remoteServicesSeed } from '@/lib/seed-data';
import { huGetProducts } from '@/lib/heartunlocks';

export const runtime = 'nodejs';

/**
 * Sincroniza o catálogo do código (seed) com o Firestore.
 * POST /api/admin/sync-services — restrito a usuários com role 'admin'.
 * Usa merge para não apagar campos ajustados direto no console.
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

  const dry = req.nextUrl.searchParams.get('dry') === '1';
  const services = [...servicesSeed, ...remoteServicesSeed];
  if (dry) {
    return NextResponse.json({
      ok: true,
      dry: true,
      categories: categoriesSeed.length,
      services: services.length,
    });
  }

  const chunked = async <T,>(items: T[], size: number, fn: (item: T) => Promise<unknown>) => {
    for (let i = 0; i < items.length; i += size) {
      await Promise.all(items.slice(i, i + size).map(fn));
    }
  };

  await chunked(categoriesSeed, 10, (c) => db.doc(`categories/${c.id}`).set(c, { merge: true }));
  await chunked(services, 10, async (s) => {
    const rec = s as unknown as Record<string, unknown>;
    const ref = db.doc(`services/${String(rec.id)}`);
    const snap = await ref.get().catch(() => null);
    if (snap?.exists) {
      // Documento existente: preserva preço e disponibilidade ajustados no painel.
      const rest = { ...rec };
      delete rest.price;
      delete rest.isActive;
      await ref.set(rest, { merge: true });
    } else {
      await ref.set(rec, { merge: true });
    }
  });

  // Imagens: puxa image_url do catálogo HeartUnlocks para os serviços
  // automáticos (mapeados por product_id numérico). Falha aqui não
  // quebra o sync do catálogo.
  let images = 0;
  try {
    const catalog = await huGetProducts();
    const byId = catalog.products ?? {};
    const auto = services.filter((s) => {
      const r = s as unknown as { provider?: string; productUuid?: string | null };
      return r.provider === 'auto' && !!r.productUuid && /^\d+$/.test(r.productUuid);
    });
    await chunked(auto, 10, async (s) => {
      const r = s as unknown as { id: string; productUuid: string };
      const img = byId[r.productUuid]?.image_url;
      if (img) {
        await db.doc(`services/${r.id}`).set({ imageUrl: img }, { merge: true });
        images++;
      }
    });
  } catch (e) {
    console.warn('[sync] imagens HeartUnlocks falharam:', e instanceof Error ? e.message : e);
  }

  return NextResponse.json({ ok: true, categories: categoriesSeed.length, services: services.length, images });
}
