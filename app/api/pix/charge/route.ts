import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { createWooviCharge } from '@/lib/woovi';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ ok: false, message: 'Não autenticado.' }, { status: 401 });

  let claims;
  try {
    claims = await getAdminAuth().verifyIdToken(token);
  } catch {
    return NextResponse.json({ ok: false, message: 'Sessão inválida.' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { amount?: number } | null;
  const amount = Number(body?.amount);
  if (!Number.isFinite(amount) || amount < 5 || amount > 5000) {
    return NextResponse.json({ ok: false, message: 'Valor inválido (mínimo R$ 5,00).' }, { status: 400 });
  }
  const value = Math.round(amount * 100) / 100;
  const valueCents = Math.round(value * 100);

  const db = getAdminDb();
  const userSnap = await db.doc(`users/${claims.uid}`).get().catch(() => null);
  if (!userSnap?.exists) return NextResponse.json({ ok: false, message: 'Usuário não encontrado.' }, { status: 404 });
  const user = userSnap.data() as { name?: string; email?: string; cpf?: string };

  const correlationId = `unl-${claims.uid.slice(0, 8)}-${randomUUID()}`;

  try {
    const charge = await createWooviCharge({
      correlationID: correlationId,
      valueCents,
      comment: 'Recarga de saldo UnlockNex',
      customer: {
        name: user.name ?? 'Cliente UnlockNex',
        email: user.email ?? claims.email ?? 'cliente@unlocknex.app',
      },
    });
    const expiresAt = new Date(charge.expiresDate).getTime();
    await db.doc(`payments/${correlationId}`).set({
      userId: claims.uid,
      amount: value,
      status: 'pending',
      provider: 'woovi',
      correlationId,
      brCode: charge.brCode,
      qrCodeImage: charge.qrCodeImage,
      expiresAt,
      createdAt: Date.now(),
    });
    return NextResponse.json({
      ok: true,
      paymentId: correlationId,
      qrCode: charge.qrCodeImage,
      copiaECola: charge.brCode,
      amount: value,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, message }, { status: 502 });
  }
}