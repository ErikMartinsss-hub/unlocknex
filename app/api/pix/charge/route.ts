import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { createAsaasCustomer, createAsaasPixCharge, getAsaasPixQr } from '@/lib/asaas';

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
  const userRef = db.doc(`users/${claims.uid}`);
  const userSnap = await userRef.get().catch(() => null);
  if (!userSnap?.exists) return NextResponse.json({ ok: false, message: 'Usuário não encontrado.' }, { status: 404 });
  const user = userSnap.data() as {
    name?: string;
    email?: string;
    cpf?: string;
    asaasCustomerId?: string;
  };

  let customerId = user.asaasCustomerId ?? null;
  if (!customerId) {
    customerId = await createAsaasCustomer({
      name: user.name ?? 'Cliente UnlockNex',
      email: user.email ?? claims.email ?? 'cliente@unlocknex.app',
      cpfCnpj: user.cpf ?? process.env.ASAAS_TEST_CPF ?? '00000000000',
    });
    await userRef.set({ ...user, asaasCustomerId: customerId }, { merge: true });
  }

  try {
    const payment = await createAsaasPixCharge({
      customerId,
      value,
      externalReference: `unlocknex|${claims.uid}`,
      description: 'Recarga de saldo UnlockNex',
    });
    const qr = await getAsaasPixQr(payment.id);
    const expiresAt = new Date(qr.expirationDate).getTime();
    await db.doc(`payments/${payment.id}`).set({
      userId: claims.uid,
      amount: value,
      status: 'pending',
      asaasId: payment.id,
      invoiceUrl: payment.invoiceUrl,
      qrCode: qr.encodedImage,
      copiaECola: qr.payload,
      expiresAt,
      createdAt: Date.now(),
    });
    return NextResponse.json({
      ok: true,
      paymentId: payment.id,
      qrCode: qr.encodedImage,
      copiaECola: qr.payload,
      invoiceUrl: payment.invoiceUrl,
      amount: value,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, message }, { status: 502 });
  }
}