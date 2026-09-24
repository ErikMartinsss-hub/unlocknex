import { createHmac, timingSafeEqual } from 'node:crypto';

const BASE_URL = (process.env.MERCADO_PAGO_BASE_URL ?? 'https://api.mercadopago.com').replace(/\/+$/, '');
const ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN ?? '';

async function mpCall<T>(path: string, init?: { method?: string; body?: string; headers?: Record<string, string> }): Promise<T> {
  if (!ACCESS_TOKEN) throw new Error('Mercado Pago não configurado (MERCADO_PAGO_ACCESS_TOKEN ausente).');
  const res = await fetch(`${BASE_URL}${path}`, {
    method: init?.method ?? 'GET',
    ...(init?.body ? { body: init.body } : {}),
    cache: 'no-store',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${ACCESS_TOKEN}`,
      ...(init?.headers ?? {}),
    },
  });
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok || !json) {
    const detail = json ? JSON.stringify(json).slice(0, 300) : `HTTP ${res.status}`;
    throw new Error(`Mercado Pago: ${detail}`);
  }
  return json as T;
}

export type MpPayment = {
  id: number;
  status: string;
  status_detail?: string;
  date_of_expiration?: string;
  external_reference?: string;
  payer?: { email?: string };
  point_of_interaction?: {
    type?: string;
    transaction_data?: { qr_code?: string; qr_code_base64?: string; ticket_url?: string };
  };
};

export async function createMpPixPayment(data: {
  transactionAmount: number;
  description: string;
  payerEmail: string;
  externalReference: string;
  notificationUrl: string;
  idempotencyKey: string;
}): Promise<MpPayment> {
  const body = {
    transaction_amount: data.transactionAmount,
    description: data.description,
    payment_method_id: 'pix',
    payer: { email: data.payerEmail },
    external_reference: data.externalReference,
    notification_url: `${data.notificationUrl}?source_news=webhooks`,
    point_of_interaction: { type: 'PIX' },
  };
  const res = await mpCall<MpPayment>('/v1/payments', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'x-idempotency-key': data.idempotencyKey },
  });
  if (!res?.point_of_interaction?.transaction_data?.qr_code) {
    throw new Error('Mercado Pago: resposta sem QR code.');
  }
  return res;
}

export async function getMpPayment(id: string | number): Promise<MpPayment> {
  const res = await mpCall<MpPayment>(`/v1/payments/${id}`, {});
  if (!res.id) throw new Error('Mercado Pago: pagamento não encontrado.');
  return res;
}

export function verifyMpWebhook(deps: {
  secret: string;
  ts: string;
  hash: string;
  requestId: string | null;
  dataId: string;
}): boolean {
  if (!deps.ts || !deps.hash) return false;
  const manifestParts = [
    `id:${deps.dataId.toLowerCase()}`,
    ...(deps.requestId ? [`request-id:${deps.requestId}`] : []),
    `ts:${deps.ts}`,
  ];
  const manifest = `${manifestParts.join(';')};`;
  const expected = createHmac('sha256', deps.secret).update(manifest).digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(deps.hash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}