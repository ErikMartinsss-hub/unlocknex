import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

/**
 * Atualiza preço / disponibilidade de um serviço.
 * POST /api/admin/services/update { serviceId, price?, isActive? }
 * Restrito a usuários com role 'admin'. Usa merge (não apaga nada).
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

  const body = (await req.json().catch(() => null)) as {
    serviceId?: string;
    price?: number;
    isActive?: boolean;
  } | null;
  const serviceId = String(body?.serviceId ?? '').trim();
  if (!serviceId || serviceId.length > 60) {
    return NextResponse.json({ ok: false, message: 'Serviço inválido.' }, { status: 400 });
  }

  const patch: Record<string, number | boolean> = {};
  if (body?.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0 || price > 100000) {
      return NextResponse.json({ ok: false, message: 'Preço inválido.' }, { status: 400 });
    }
    patch.price = Math.round(price * 100) / 100;
  }
  if (body?.isActive !== undefined) {
    if (typeof body.isActive !== 'boolean') {
      return NextResponse.json({ ok: false, message: 'Disponibilidade inválida.' }, { status: 400 });
    }
    patch.isActive = body.isActive;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: false, message: 'Nada para atualizar.' }, { status: 400 });
  }

  const ref = db.doc(`services/${serviceId}`);
  const snap = await ref.get().catch(() => null);
  if (!snap?.exists) return NextResponse.json({ ok: false, message: 'Serviço não encontrado.' }, { status: 404 });
  await ref.set(patch, { merge: true });
  return NextResponse.json({ ok: true, serviceId, ...patch });
}
