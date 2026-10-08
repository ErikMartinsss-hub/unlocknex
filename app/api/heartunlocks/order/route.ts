import { NextRequest, NextResponse } from 'next/server';
import { huPlaceOrders } from '@/lib/heartunlocks';
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

type ServiceDoc = {
  provider?: string;
  productUuid?: string | null;
  apiField?: string | null;
  apiFields?: { name: string; type?: string; required?: boolean }[] | null;
  apiExtra?: { key: string; label: string; required?: boolean }[] | null;
};

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ ok: false, message: 'Não autenticado.' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { orderId?: string; fields?: Record<string, string | number> } | null;
  if (!body || typeof body.orderId !== 'string' || typeof body.fields !== 'object' || body.fields === null) {
    return NextResponse.json({ ok: false, message: 'Requisição inválida.' }, { status: 400 });
  }
  const { orderId, fields } = body;
  if (!isValidOrderId(orderId)) {
    return NextResponse.json({ ok: false, message: 'Parâmetros inválidos.' }, { status: 400 });
  }

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
  const order = orderSnap.data() as { userId?: string; apiOrderId?: string; status?: string; serviceId?: string };
  if (order.userId !== claims.uid) return NextResponse.json({ ok: false, message: 'Pedido não pertence a este usuário.' }, { status: 403 });
  if (order.apiOrderId || order.status === 'concluido' || order.status === 'cancelado') {
    return NextResponse.json({ ok: false, message: 'Pedido já foi submetido ao provedor.' }, { status: 409 });
  }
  if (!order.serviceId) return NextResponse.json({ ok: false, message: 'Pedido sem serviço associado.' }, { status: 400 });

  const serviceSnap = await db.doc(`services/${order.serviceId}`).get().catch(() => null);
  if (!serviceSnap?.exists) return NextResponse.json({ ok: false, message: 'Serviço não encontrado.' }, { status: 400 });
  const service = serviceSnap.data() as ServiceDoc;
  if (service.provider !== 'auto' || !service.productUuid) {
    return NextResponse.json({ ok: false, message: 'Serviço ainda não integrado ao sistema automático.' }, { status: 400 });
  }

  // Campos esperados pela API (Email, Username, Serial, Quantity…). Serviços
  // antigos (sem apiFields) usam o apiField único como lista de um item.
  const apiCampos: { name: string; type?: string; required?: boolean }[] =
    Array.isArray(service.apiFields) && service.apiFields.length > 0
      ? service.apiFields
      : service.apiField
        ? [{ name: service.apiField, type: service.apiField === 'Quantity' ? 'number' : 'text', required: true }]
        : [];
  if (apiCampos.length === 0) {
    return NextResponse.json({ ok: false, message: 'Serviço sem campos configurados.' }, { status: 400 });
  }

  const productUuid = service.productUuid;
  const apiFields: Record<string, string | number> = {};
  for (const c of apiCampos) {
    const v = fields[c.name];
    const isQty = c.name === 'Quantity' || c.type === 'number';
    if (isQty) {
      const raw = v === undefined ? '' : String(v).trim();
      const n = Number(raw);
      if (c.required && (!Number.isFinite(n) || n < 1)) {
        return NextResponse.json({ ok: false, message: `Campo ${c.name} inválido.` }, { status: 400 });
      }
      if (raw !== '' && Number.isFinite(n)) apiFields[c.name] = Math.floor(n);
    } else {
      const raw = v === undefined ? '' : String(v).trim();
      if (c.required && raw === '') {
        return NextResponse.json({ ok: false, message: `Preencha ${c.name}.` }, { status: 400 });
      }
      if (raw !== '') apiFields[c.name] = raw;
    }
  }
  for (const extra of service.apiExtra ?? []) {
    const v = fields[extra.key];
    if (v === undefined || String(v).trim() === '') {
      if (extra.required) return NextResponse.json({ ok: false, message: `Preencha ${extra.label}.` }, { status: 400 });
      continue;
    }
    apiFields[extra.key] = String(v).trim();
  }

  try {
    const [result] = await huPlaceOrders([
      { productUuid, fields: apiFields, referenceId: orderId, feedbackUrl: buildFeedbackUrl(req) },
    ]);
    const apiKey = apiCampos[0]?.name ?? '';
    const shown =
      apiCampos[0] && (apiCampos[0].name === 'Quantity' || apiCampos[0].type === 'number')
        ? `Aluguel de ferramenta (x${apiFields[apiKey] ?? 0})`
        : String(apiFields[apiKey] ?? '');
    await orderRef.update({
      apiOrderId: result.orderUuid,
      apiStatus: 'submetido',
      updatedAt: Date.now(),
      deviceIdentifier: shown,
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