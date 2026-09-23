import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyWooviWebhook } from '@/lib/woovi';

export const runtime = 'nodejs';

const CONFIRM_EVENTS = ['TRANSACTION_RECEIVED', 'CHARGE_COMPLETED'];

type WooviWebhookShape = {
  event?: string | null;
  correlationID?: string | null;
  charge?: { correlationID?: string | null; status?: string | null; value?: number | null } | null;
  pix?: { value?: number | null } | null;
};

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get('x-webhook-signature');
  const testToken = req.headers.get('x-test-token');
  const devToken = process.env.WOOVI_WEBHOOK_TOKEN ?? '';

  let body: WooviWebhookShape | null = null;
  try {
    body = JSON.parse(raw) as WooviWebhookShape;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Teste de registro da plataforma Woovi: não tem assinatura nem charge/correlationID.
  // Resposta exigida pela doc: 200 com corpo vazio.
  if (body?.event && !body?.charge && !body?.correlationID && !body?.pix) {
    return new NextResponse(null, { status: 200 });
  }

  const valid =
    (!!signature && (await verifyWooviWebhook(raw, signature))) ||
    (!!devToken && testToken === devToken);
  if (!valid) return NextResponse.json({ ok: false, message: 'Assinatura inválida.' }, { status: 401 });

  const event = String(body?.event ?? '');
  if (!CONFIRM_EVENTS.some((e) => event.toUpperCase().includes(e))) {
    return NextResponse.json({ ok: true });
  }

  const correlationId = body?.charge?.correlationID ?? body?.correlationID ?? null;
  if (!correlationId) return NextResponse.json({ ok: false }, { status: 400 });

  const db = getAdminDb();
  const payRef = db.doc(`payments/${correlationId}`);
  const paySnap = await payRef.get().catch(() => null);

  let uid: string;
  let amount: number;

  if (paySnap?.exists) {
    const data = paySnap.data() as { userId?: string; amount?: number; status?: string };
    if (data.status === 'confirmed') return NextResponse.json({ ok: true });
    if (!data.userId) return NextResponse.json({ ok: false }, { status: 400 });
    uid = data.userId;
    amount = Number(data.amount ?? 0);
  } else {
    return NextResponse.json({ ok: false, message: 'Cobrança não encontrada.' }, { status: 400 });
  }

  if (!uid || !amount) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(payRef);
      if (snap.exists && snap.data()?.status === 'confirmed') return;
      const userSnap = await tx.get(db.doc(`users/${uid}`));
      if (!userSnap.exists) throw new Error('user-missing');
      const balance = Number(userSnap.data()?.balance ?? 0);
      tx.set(payRef, { status: 'confirmed', confirmedAt: Date.now(), event }, { merge: true });
      tx.update(db.doc(`users/${uid}`), { balance: balance + amount });
      tx.set(db.collection('transactions').doc(), {
        userId: uid,
        type: 'deposit',
        amount,
        paymentMethod: 'pix',
        provider: 'woovi',
        reference: correlationId,
        createdAt: Date.now(),
        by: 'woovi-webhook',
      });
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}