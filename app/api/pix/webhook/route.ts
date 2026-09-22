import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAsaasSignature } from '@/lib/asaas';

export const runtime = 'nodejs';

const CONFIRM_EVENTS = new Set([
  'PAYMENT_RECEIVED',
  'PAYMENT_CONFIRMED',
  'payment_confirmed',
  'payment_received',
]);

export async function POST(req: NextRequest) {
  const raw = await req.text().catch(() => '');
  if (!raw) return NextResponse.json({ ok: false }, { status: 400 });

  const hasSecret = !!process.env.ASAAS_WEBHOOK_SECRET;
  const signature = req.headers.get('x-asaas-signature');
  const testToken = req.headers.get('x-test-token');
  const tokenOk = !hasSecret && !!testToken && testToken === process.env.ASAAS_WEBHOOK_TOKEN;

  if (hasSecret ? !verifyAsaasSignature(raw, signature) : !tokenOk) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  type AsaasWebhookShape = {
  event?: string;
  payment?: { id?: string; value?: number; externalReference?: string | null };
};

let body: AsaasWebhookShape | null = null;
try {
  body = JSON.parse(raw) as AsaasWebhookShape;
} catch {
  return NextResponse.json({ ok: false }, { status: 400 });
}
const event = String(body?.event ?? '');
  const payment = body?.payment;
  if (!payment?.id) return NextResponse.json({ ok: false }, { status: 400 });
  if (!CONFIRM_EVENTS.has(event)) return NextResponse.json({ ok: true });

  const db = getAdminDb();
  const paymentRef = db.doc(`payments/${payment.id}`);
  const value = Number(payment.value ?? 0);
  const ext = typeof payment.externalReference === 'string' ? payment.externalReference : '';
  const extUserId = ext.startsWith('unlocknex|') ? ext.split('|')[1] : null;

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(paymentRef);
      if (snap.exists) {
        const d = snap.data() as { status?: string; userId?: string };
        if (d.status === 'confirmed') return;
        const userId = d.userId ?? extUserId;
        if (!userId || !Number.isFinite(value) || value <= 0) throw new Error('PAYMENT_INVALID');
        tx.update(paymentRef, { status: 'confirmed', confirmedAt: Date.now() });
        tx.update(db.doc(`users/${userId}`), { balance: FieldValue.increment(value) });
        tx.set(db.collection('transactions').doc(), {
          userId,
          amount: value,
          type: 'deposit',
          status: 'concluido',
          paymentMethod: 'pix',
          reference: payment.id,
          createdAt: Date.now(),
        });
      } else {
        const userId = extUserId;
        if (!userId || !Number.isFinite(value) || value <= 0) throw new Error('PAYMENT_INVALID');
        tx.set(paymentRef, {
          userId,
          amount: value,
          status: 'confirmed',
          asaasId: payment.id,
          confirmedAt: Date.now(),
        });
        tx.update(db.doc(`users/${userId}`), { balance: FieldValue.increment(value) });
        tx.set(db.collection('transactions').doc(), {
          userId,
          amount: value,
          type: 'deposit',
          status: 'concluido',
          paymentMethod: 'pix',
          reference: payment.id,
          createdAt: Date.now(),
        });
      }
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === 'PAYMENT_INVALID') return NextResponse.json({ ok: false }, { status: 400 });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}