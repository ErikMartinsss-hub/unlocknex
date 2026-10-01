import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

/**
 * Cancela um pedido que ainda NÃO chegou ao provedor (sem apiOrderId)
 * e devolve o valor ao saldo. O cliente não pode alterar `balance`
 * (firestore.rules), então o reembolso acontece aqui (Admin SDK).
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

  const body = (await req.json().catch(() => null)) as { orderId?: string } | null;
  const orderId = String(body?.orderId ?? '');
  if (!/^[A-Za-z0-9_-]{16,40}$/.test(orderId)) {
    return NextResponse.json({ ok: false, message: 'Pedido inválido.' }, { status: 400 });
  }

  const db = getAdminDb();
  const orderRef = db.doc(`orders/${orderId}`);

  try {
    const refunded = await db.runTransaction(async (tx) => {
      const snap = await tx.get(orderRef);
      if (!snap.exists) throw new Error('NOT_FOUND');
      const o = snap.data() as {
        userId?: string;
        status?: string;
        apiOrderId?: string;
        cost?: number;
      };
      if (o.userId !== claims.uid) throw new Error('FORBIDDEN');
      if (o.apiOrderId || o.status === 'concluido' || o.status === 'cancelado') throw new Error('LOCKED');
      if (o.status !== 'pendente' && o.status !== 'processando') throw new Error('LOCKED');
      const cost = Number(o.cost ?? 0);
      tx.update(orderRef, { status: 'cancelado', cancelledAt: Date.now(), updatedAt: Date.now() });
      if (o.userId && cost > 0) {
        tx.update(db.doc(`users/${o.userId}`), { balance: FieldValue.increment(cost) });
        tx.set(db.collection('transactions').doc(), {
          userId: o.userId,
          amount: cost,
          type: 'refund',
          status: 'concluido',
          paymentMethod: 'saldo',
          reference: orderId,
          createdAt: Date.now(),
        });
      }
      return cost;
    });
    return NextResponse.json({ ok: true, refunded });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'NOT_FOUND') return NextResponse.json({ ok: false, message: 'Pedido não encontrado.' }, { status: 404 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ ok: false, message: 'Sem permissão.' }, { status: 403 });
    if (msg === 'LOCKED') {
      return NextResponse.json(
        { ok: false, message: 'Pedido já está em processamento ou entregue — fale com o suporte.' },
        { status: 409 }
      );
    }
    console.error('[orders/cancel] erro:', msg);
    return NextResponse.json({ ok: false, message: 'Não foi possível cancelar.' }, { status: 500 });
  }
}
