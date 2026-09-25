import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

/**
 * Cria um pedido descontando o saldo no servidor (Admin SDK).
 * O cliente não tem permissão para alterar `users/{uid}.balance`
 * (firestore.rules), então a dedução precisa acontecer aqui.
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

  const body = (await req.json().catch(() => null)) as {
    serviceId?: string;
    deviceIdentifier?: string;
    deviceModel?: string | null;
  } | null;
  const serviceId = String(body?.serviceId ?? '').trim();
  if (!serviceId) return NextResponse.json({ ok: false, message: 'Selecione um serviço.' }, { status: 400 });

  const db = getAdminDb();
  const serviceSnap = await db.doc(`services/${serviceId}`).get().catch(() => null);
  if (!serviceSnap?.exists) return NextResponse.json({ ok: false, message: 'Serviço não encontrado.' }, { status: 404 });
  const svc = serviceSnap.data() as {
    slug?: string;
    price?: number;
    isActive?: boolean;
    provider?: string;
    productUuid?: string | null;
  };
  const price = Number(svc.price);
  if (svc.isActive === false) return NextResponse.json({ ok: false, message: 'Serviço indisponível.' }, { status: 400 });
  if (!Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ ok: false, message: 'Serviço com preço inválido.' }, { status: 400 });
  }

  const deviceIdentifier = String(body?.deviceIdentifier ?? '').trim();
  const deviceModel = body?.deviceModel ? String(body.deviceModel).trim() || null : null;

  try {
    const orderId = await db.runTransaction(async (tx) => {
      const userRef = db.doc(`users/${claims.uid}`);
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) throw new Error('USER_MISSING');
      const current = Number(userSnap.data()?.balance ?? 0);
      if (current < price) throw new Error('INSUFFICIENT');
      const orderRef = db.collection('orders').doc();
      tx.update(userRef, { balance: current - price });
      tx.set(orderRef, {
        userId: claims.uid,
        serviceId,
        deviceIdentifier,
        deviceModel,
        status: 'processando',
        cost: price,
        provider: svc.provider ?? 'manual',
        createdAt: Date.now(),
      });
      tx.set(db.collection('transactions').doc(), {
        userId: claims.uid,
        amount: -price,
        type: 'charge',
        status: 'concluido',
        paymentMethod: 'saldo',
        reference: svc.slug ?? serviceId,
        createdAt: Date.now(),
      });
      return orderRef.id;
    });
    return NextResponse.json({
      ok: true,
      orderId,
      provider: svc.provider ?? 'manual',
      productUuid: svc.productUuid ?? null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'INSUFFICIENT') {
      return NextResponse.json({ ok: false, message: 'Saldo insuficiente para este serviço.' }, { status: 402 });
    }
    if (msg === 'USER_MISSING') {
      return NextResponse.json({ ok: false, message: 'Usuário não encontrado.' }, { status: 404 });
    }
    console.error('[orders/create] erro:', msg);
    return NextResponse.json({ ok: false, message: 'Não foi possível criar o pedido. Tente novamente.' }, { status: 500 });
  }
}
