import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

const TERMINAL_SUCCESS = new Set(['success', 'completed', 'done']);
const TERMINAL_FAILURE = new Set(['rejected', 'failed', 'refunded', 'cancelled', 'canceled', 'error']);

function sanitizeId(value: string): boolean {
  return /^[A-Za-z0-9_-]{16,40}$/.test(value);
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    reference_id?: string;
    order_id?: string;
    status?: string;
    replay?: string;
  } | null;

  if (!body || typeof body.reference_id !== 'string' || !sanitizeId(body.reference_id)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const referenceId = body.reference_id;

  const db = getAdminDb();
  const orderRef = db.doc(`orders/${referenceId}`);

  let snap;
  try {
    snap = await orderRef.get();
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  if (!snap.exists) return NextResponse.json({ ok: false }, { status: 404 });

  const order = snap.data() as {
    provider?: string;
    status?: string;
    cost?: number;
    userId?: string;
    apiOrderId?: string;
  };

  if (order.provider !== 'auto') return NextResponse.json({ ok: true });

  const remoteId = typeof body.order_id === 'string' ? body.order_id : null;
  if (remoteId && order.apiOrderId && order.apiOrderId !== remoteId) {
    return NextResponse.json({ ok: true });
  }
  if (order.status === 'concluido' || order.status === 'cancelado') {
    return NextResponse.json({ ok: true });
  }

  const rawStatus = String(body.status ?? '');
  const patch: Record<string, unknown> = { apiStatus: rawStatus, updatedAt: Date.now() };
  if (remoteId) patch.apiOrderId = remoteId;

  if (TERMINAL_SUCCESS.has(rawStatus.toLowerCase())) {
    await orderRef.update({ ...patch, status: 'concluido' });
    return NextResponse.json({ ok: true });
  }

  if (TERMINAL_FAILURE.has(rawStatus.toLowerCase())) {
    const cost = Number(order.cost ?? 0);
    const userId = order.userId;
    await db.runTransaction(async (tx) => {
      const current = await tx.get(orderRef);
      const data = current.data() as { status?: string; cost?: number } | undefined;
      if (!data || data.status === 'concluido' || data.status === 'cancelado') return;
      tx.update(orderRef, { ...patch, status: 'cancelado' });
      if (userId) {
        tx.update(db.doc(`users/${userId}`), { balance: FieldValue.increment(cost) });
        tx.set(db.collection('transactions').doc(), {
          userId,
          amount: cost,
          type: 'refund',
          status: 'concluido',
          paymentMethod: 'saldo',
          reference: referenceId,
          createdAt: Date.now(),
        });
      }
    });
    return NextResponse.json({ ok: true });
  }

  await orderRef.update(patch);
  return NextResponse.json({ ok: true });
}