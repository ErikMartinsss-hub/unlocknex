const BASE_URL = (process.env.HEARTUNLOCKS_BASE_URL ?? 'https://api.heartunlocks.com').replace(/\/+$/, '');
const TOKEN = process.env.HEARTUNLOCKS_TOKEN ?? '';

export const HEARTUNLOCKS_PRODUCTS: Record<string, { name: string; field: string }> = {
  '4697': { name: 'Motorola FRP + Unlock Bootloader (Window Tool, One Click)', field: 'SERIAL NUMBER' },
  '1360': { name: 'LG Worldwide Unlock Code (Premium)', field: 'IMEI' },
  '3128': { name: 'FRPFILE ACTIVATOR A12+ (Bypass Hello)', field: 'Serial' },
  '226': { name: 'FRPFILE MDM Bypass Tool', field: 'Serial' },
};

type HuEnvelope<T> = { status: string; code: number; message?: string; data: T };

export async function huRequest<T>(path: string, init?: RequestInit): Promise<HuEnvelope<T>> {
  if (!TOKEN) throw new Error('HeartUnlocks não configurado (HEARTUNLOCKS_TOKEN ausente).');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const json = (await res.json().catch(() => null)) as HuEnvelope<T> | null;
  if (!res.ok || !json || json.status !== 'success') {
    const msg = typeof json?.message === 'string' ? json.message : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

export async function huGetAccount(): Promise<{ currency: string; balance: string; name: string; email: string }> {
  const json = await huRequest<{ currency: string; balance: string; name: string; email: string }>('/api/reseller/v1/account');
  return json.data;
}

export type HuProduct = {
  uuid: string;
  name: string;
  price: number | string;
  fields: { type: string; name: string; required: boolean; min?: number; max?: number }[];
};

export async function huGetProducts(): Promise<{ currency: string; categories: Record<string, { name: string }>; products: Record<string, HuProduct> }> {
  const json = await huRequest<{ currency: string; categories: Record<string, { name: string }>; products: Record<string, HuProduct> }>(
    '/api/reseller/v1/products'
  );
  return json.data;
}

export type HuOrderRequest = {
  productUuid: string;
  fields: Record<string, string | number>;
  referenceId: string;
  feedbackUrl: string;
};

export type HuOrderResult = {
  orderUuid: string;
  amount: number;
  currencyCode: string;
  referenceId: string;
};

type HuRawOrderResult = {
  order_uuid: string;
  amount: number;
  currency_code: string;
  reference_id: string;
};

export async function huPlaceOrders(requests: HuOrderRequest[]): Promise<HuOrderResult[]> {
  const body = requests.map((r) => ({
    // A API aceita product_id (numérico) OU product_uuid — sem misturar os
    // dois estilos na mesma requisição. Valores só-numéricos (ex.: '4697')
    // vão como product_id, conforme a doc oficial.
    ...(/^\d+$/.test(r.productUuid) ? { product_id: Number(r.productUuid) } : { product_uuid: r.productUuid }),
    fields: [{ ...r.fields, reference_id: r.referenceId, feedback_url: r.feedbackUrl }],
  }));
  // Resposta oficial: `data` é um array de GRUPOS (um por produto),
  // ex.: data: [[{ order_uuid, amount, ... }]] — por isso o achatamento.
  const json = await huRequest<HuRawOrderResult[] | HuRawOrderResult[][]>('/api/reseller/v1/order', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const groups = (Array.isArray(json.data) ? json.data : []) as (HuRawOrderResult | HuRawOrderResult[])[];
  const items = groups.flatMap((g) => (Array.isArray(g) ? g : [g])).filter((d) => d?.order_uuid);
  if (items.length === 0) throw new Error('Resposta sem pedidos.');
  return items.map((d) => ({
    orderUuid: d.order_uuid,
    amount: d.amount,
    currencyCode: d.currency_code,
    referenceId: d.reference_id,
  }));
}