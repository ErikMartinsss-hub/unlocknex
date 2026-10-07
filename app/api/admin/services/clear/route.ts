import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

/**
 * Apaga TODOS os serviços do catálogo (coleção 'services').
 * POST /api/admin/services/clear — restrito a role 'admin'.
 * As páginas de Serviços e Aluguel ficam vazias até o admin adicionar
 * produtos um a um pelo painel ("Adicionar serviços da API").
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

  const col = db.collection('services');
  let removed = 0;
  // Deleta em lotes de até 400 (limite de uma escrita em lote).
  while (true) {
    const snap = await col.limit(400).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    removed += snap.size;
    if (snap.size < 400) break;
  }

  return NextResponse.json({ ok: true, removed });
}