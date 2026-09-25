import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { createMpPixPayment } from '@/lib/mercadopago';

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

  const db = getAdminDb();
  const userSnap = await db.doc(`users/${claims.uid}`).get().catch(() => null);
  if (!userSnap?.exists) return NextResponse.json({ ok: false, message: 'Usuário não encontrado.' }, { status: 404 });
  const user = userSnap.data() as { name?: string; email?: string };

  const correlationId = `unl-${claims.uid.slice(0, 8)}-${randomUUID()}`;
  const siteUrl = (process.env.SITE_URL ?? 'https://unlocknex.vercel.app').replace(/\/+$/, '');

  try {
    const payment = await createMpPixPayment({
      transactionAmount: value,
      description: 'Recarga de saldo UnlockNex',
      payerEmail: user.email ?? claims.email ?? 'cliente@unlocknex.app',
      externalReference: correlationId,
      notificationUrl: `${siteUrl}/api/pix/webhook`,
      idempotencyKey: randomUUID(),
    });
    const expiresAt = payment.date_of_expiration ? new Date(payment.date_of_expiration).getTime() : Date.now() + 24 * 3600 * 1000;
    const qrBase64 = payment.point_of_interaction?.transaction_data?.qr_code_base64;
    await db.doc(`payments/${correlationId}`).set({
      userId: claims.uid,
      amount: value,
      status: 'pending',
      provider: 'mercadopago',
      correlationId,
      mpPaymentId: payment.id,
      qrCode: qrBase64 ? `data:image/png;base64,${qrBase64}` : undefined,
      copiaECola: payment.point_of_interaction?.transaction_data?.qr_code,
      expiresAt,
      createdAt: Date.now(),
    });
    return NextResponse.json({
      ok: true,
      paymentId: correlationId,
      qrCode: qrBase64 ? `data:image/png;base64,${qrBase64}` : undefined,
      copiaECola: payment.point_of_interaction?.transaction_data?.qr_code,
      amount: value,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, message }, { status: 502 });
  }
}