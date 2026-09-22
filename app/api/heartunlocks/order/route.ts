import { NextRequest, NextResponse } from 'next/server';
import { huPlaceOrders, HEARTUNLOCKS_PRODUCTS } from '@/lib/heartunlocks';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

function isValidOrderId(value: string): boolean {
  return /^[A-Za-z0-9_-]{16,40}$/.test(value);
}

function buildFeedbackUrl(req: NextRequest): string {
  const protocol = req.headers.get('x-forwarded-proto') ?? 'https';
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:3000';
  return `${protocol}://${host}/api/heartunlocks/webhook`;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { orderId?: string; productUuid?: string; identifier?: string } | null;
  if (!body || typeof body.orderId !== 'string' || typeof body.productUuid !== 'string' || typeof body.identifier !== 'string') {
    return NextResponse.json({ ok: false, message: 'Requisição inválida.' }, { status: 400 });
  }
  const { orderId, productUuid, identifier } = body;
  if (!isValidOrderId(orderId) || !identifier.trim()) {
    return NextResponse.json({ ok: false, message: 'Parâmetros inválidos.' }, { status: 400 });
  }
  const product = HEARTUNLOCKS_PRODUCTS[productUuid];
  if (!product) {
    return NextResponse.json({ ok: false, message: 'Serviço não integrado à HeartUnlocks.' }, { status: 400 });
  }

  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ ok: false, message: 'Não autenticado.' }, { status: 401 });

  let claims;
  try {
    claims = await getAdminAuth().verifyIdToken(token);
  } catch {
    return NextResponse.json({ ok: false, message: 'Sessão inválida.' }, { status: 401 });
  }

  const db = getAdminDb();
  const orderRef = db.doc(`orders/${orderId}`);
  const orderSnap = await orderRef.get().catch(() => null);
  if (!orderSnap?.exists) return NextResponse.json({ ok: false, message: 'Pedido não encontrado.' }, { status: 404 });
  const order = orderSnap.data() as { userId?: string; apiOrderId?: string; status?: string };
  if (order.userId !== claims.uid) return NextResponse.json({ ok: false, message: 'Pedido não pertence a este usuário.' }, { status: 403 });
  if (order.apiOrderId || order.status === 'concluido' || order.status === 'cancelado') {
    return NextResponse.json({ ok: false, message: 'Pedido já foi submetido ao provedor.' }, { status: 409 });
  }

  try {
    const [result] = await huPlaceOrders([
      { productUuid, fields: { [product.field]: identifier.trim() }, referenceId: orderId, feedbackUrl: buildFeedbackUrl(req) },
    ]);
    await orderRef.update({
      apiOrderId: result.orderUuid,
      apiStatus: 'submetido',
      updatedAt: Date.now(),
    });
    return NextResponse.json({ ok: true, orderUuid: result.orderUuid });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await orderRef
      .update({
        status: 'pendente',
        providerError: message,
        updatedAt: Date.now(),
      })
      .catch(() => {});
    return NextResponse.json({ ok: false, message }, { status: 502 });
  }
}