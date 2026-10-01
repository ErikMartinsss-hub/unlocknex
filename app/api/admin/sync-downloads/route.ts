import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { downloadsSeed } from '@/lib/seed-data';

export const runtime = 'nodejs';

/**
 * Sincroniza a Central de Downloads do código (seed) com o Firestore.
 * POST /api/admin/sync-downloads — restrito a usuários com role 'admin'.
 * Preserva url e isActive ajustados no painel (não sobrescreve).
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

  const chunked = async <T,>(items: T[], size: number, fn: (item: T) => Promise<unknown>) => {
    for (let i = 0; i < items.length; i += size) {
      await Promise.all(items.slice(i, i + size).map(fn));
    }
  };

  await chunked(downloadsSeed, 10, async (d) => {
    const rec = d as unknown as Record<string, unknown>;
    const ref = db.doc(`downloads/${String(rec.id)}`);
    const snap = await ref.get().catch(() => null);
    if (snap?.exists) {
      // Documento existente: preserva link, capa e disponibilidade ajustados no painel.
      const rest = { ...rec };
      delete rest.url;
      delete rest.imageUrl;
      delete rest.isActive;
      await ref.set(rest, { merge: true });
    } else {
      await ref.set(rec, { merge: true });
    }
  });

  return NextResponse.json({ ok: true, downloads: downloadsSeed.length });
}