import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getMpPayment, verifyMpWebhook } from '@/lib/mercadopago';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    return await handleWebhook(req);
  } catch (err) {
    console.error('webhook mp erro:', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

async function handleWebhook(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    type?: string | null;
    data?: { id?: string | number } | null;
  } | null;

  const isPayment = String(body?.type ?? '') === 'payment' || req.nextUrl.searchParams.get('type') === 'payment';
  if (!isPayment) return NextResponse.json({ ok: true });

  const dataId =
    req.nextUrl.searchParams.get('data.id') ??
    String(body?.data?.id ?? '');

  const devToken = process.env.MERCADO_PAGO_WEBHOOK_TOKEN ?? '';
  const testToken = req.headers.get('x-test-token');

  if (!dataId) return NextResponse.json({ ok: false }, { status: 400 });

  const valid =
    (!!devToken && testToken === devToken) || validateSignature(req, dataId);
  if (!valid) return NextResponse.json({ ok: false, message: 'Assinatura inválida.' }, { status: 401 });

  let payment;
  try {
    payment = await getMpPayment(dataId);
  } catch (err) {
    console.warn('webhook mp: pagamento não consultável, ignorando.', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: true, ignored: true });
  }
  const approved = payment.status === 'approved' && payment.status_detail === 'accredited';
  if (!approved) return NextResponse.json({ ok: true });

  const correlationId = payment.external_reference ?? null;
  if (!correlationId) return NextResponse.json({ ok: false }, { status: 400 });

  const db = getAdminDb();
  const payRef = db.doc(`payments/${correlationId}`);
  const paySnap = await payRef.get().catch(() => null);
  if (!paySnap?.exists) return NextResponse.json({ ok: false, message: 'Cobrança não encontrada.' }, { status: 400 });

  const data = paySnap.data() as { userId?: string; amount?: number; status?: string; method?: string };
  if (data.status === 'confirmed') return NextResponse.json({ ok: true });
  if (!data.userId || !data.amount) return NextResponse.json({ ok: false }, { status: 400 });
  const method = data.method === 'card' || data.method === 'boleto' ? data.method : 'pix';

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(payRef);
      if (snap.exists && snap.data()?.status === 'confirmed') return;
      const userSnap = await tx.get(db.doc(`users/${data.userId!}`));
      if (!userSnap.exists) throw new Error('user-missing');
      const balance = Number(userSnap.data()?.balance ?? 0);
      tx.set(payRef, { status: 'confirmed', confirmedAt: Date.now() }, { merge: true });
      tx.update(db.doc(`users/${data.userId!}`), { balance: balance + data.amount! });
      tx.set(db.collection('transactions').doc(), {
        userId: data.userId,
        type: 'deposit',
        amount: data.amount,
        paymentMethod: method,
        provider: 'mercadopago',
        reference: correlationId,
        mpPaymentId: payment.id,
        createdAt: Date.now(),
        by: 'mp-webhook',
      });
    });
  } catch (err) {
    console.error('webhook mp transação:', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

function validateSignature(req: NextRequest, dataId: string): boolean {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET ?? '';
  if (!secret) return false;
  const sig = req.headers.get('x-signature') ?? '';
  const ts = /(?:^|,)ts=([0-9]+)/.exec(sig)?.[1] ?? '';
  const v1 = /(?:^|,)v1=([0-9a-fA-F]+)/.exec(sig)?.[1] ?? '';
  const requestId = req.headers.get('x-request-id');
  if (!v1) return false;
  return verifyMpWebhook({ secret, ts, hash: v1, requestId, dataId });
}