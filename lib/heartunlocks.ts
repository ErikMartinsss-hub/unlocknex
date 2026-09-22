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
    product_uuid: r.productUuid,
    fields: [{ ...r.fields, reference_id: r.referenceId, feedback_url: r.feedbackUrl }],
  }));
  const json = await huRequest<HuRawOrderResult[]>('/api/reseller/v1/order', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return json.data.map((d) => ({
    orderUuid: d.order_uuid,
    amount: d.amount,
    currencyCode: d.currency_code,
    referenceId: d.reference_id,
  }));
}