import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyStripeWebhook } from '@/lib/stripe';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    return await handleWebhook(req);
  } catch (err) {
    console.error('webhook stripe erro:', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

async function handleWebhook(req: NextRequest) {
  const raw = await req.text().catch(() => '');
  const signature = req.headers.get('stripe-signature') ?? '';
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? '';

  if (!secret) {
    return NextResponse.json({ ok: false, message: 'Webhook não configurado.' }, { status: 503 });
  }
  if (!verifyStripeWebhook(raw, signature, secret)) {
    return NextResponse.json({ ok: false, message: 'Assinatura inválida.' }, { status: 401 });
  }

  const event = JSON.parse(raw || '{}') as {
    type?: string;
    data?: {
      object?: {
        id?: string;
        payment_status?: string;
        metadata?: Record<string, string>;
      };
    };
  };

  const type = event.type ?? '';
  if (type !== 'checkout.session.completed' && type !== 'checkout.session.async_payment_succeeded') {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const obj = event.data?.object;
  if (!obj) return NextResponse.json({ ok: false }, { status: 400 });
  if (obj.payment_status !== 'paid') return NextResponse.json({ ok: true });

  const meta = obj.metadata ?? {};
  const correlationId = meta.correlationId;
  const userId = meta.userId;
  const amount = Number(meta.amount);
  if (!correlationId || !userId || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const db = getAdminDb();
  const payRef = db.doc(`payments/${correlationId}`);
  const paySnap = await payRef.get().catch(() => null);
  if (!paySnap?.exists) {
    return NextResponse.json({ ok: false, message: 'Cobrança não encontrada.' }, { status: 400 });
  }

  const payData = paySnap.data() as { status?: string; method?: string };
  if (payData.status === 'confirmed') return NextResponse.json({ ok: true });

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(payRef);
      if (snap.exists && snap.data()?.status === 'confirmed') return;
      const userSnap = await tx.get(db.doc(`users/${userId}`));
      if (!userSnap.exists) throw new Error('user-missing');
      const balance = Number(userSnap.data()?.balance ?? 0);
      tx.set(payRef, { status: 'confirmed', confirmedAt: Date.now() }, { merge: true });
      tx.update(db.doc(`users/${userId}`), { balance: balance + amount });
      tx.set(db.collection('transactions').doc(), {
        userId,
        type: 'deposit',
        amount,
        paymentMethod:
          payData.method === 'card' || payData.method === 'boleto' ? payData.method : 'pix',
        provider: 'stripe',
        reference: correlationId,
        stripeSessionId: obj.id,
        createdAt: Date.now(),
        by: 'stripe-webhook',
      });
    });
  } catch (err) {
    console.error('webhook stripe transação:', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}