import { createVerify } from 'node:crypto';

const BASE_URL = (process.env.WOOVI_BASE_URL ?? 'https://api.woovi.com/api/v1').replace(/\/+$/, '');
const APP_ID = process.env.WOOVI_APP_ID ?? '';

type WooviError = { message?: string | string[]; errors?: unknown[] };

async function wooviCall<T>(path: string, init?: RequestInit): Promise<T> {
  if (!APP_ID) throw new Error('Woovi não configurado (WOOVI_APP_ID ausente).');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: APP_ID,
      ...(init?.headers ?? {}),
    },
  });
  const json = (await res.json().catch(() => null)) as (T & WooviError) | null;
  if (!res.ok || !json) {
    const detail =
      typeof json?.message === 'string' ? json.message : json?.message?.join('; ') ?? `HTTP ${res.status}`;
    throw new Error(`Woovi: ${detail}`);
  }
  return json;
}

export type WooviCharge = {
  id: string;
  correlationID: string;
  status: string;
  value: number;
  expiresDate: string;
  brCode: string;
  qrCodeImage: string;
};

export async function createWooviCharge(data: {
  correlationID: string;
  valueCents: number;
  comment: string;
  customer?: { name?: string; email?: string; taxID?: string };
}): Promise<WooviCharge> {
  const body: Record<string, unknown> = {
    correlationID: data.correlationID,
    value: data.valueCents,
    comment: data.comment,
  };
  if (data.customer && (data.customer.name || data.customer.email || data.customer.taxID)) {
    const customer: Record<string, string> = {};
    if (data.customer.name) customer.name = data.customer.name;
    if (data.customer.email) customer.email = data.customer.email;
    if (data.customer.taxID) customer.taxID = data.customer.taxID;
    body.customer = customer;
  }
  const res = await wooviCall<{ charge: WooviCharge }>('/charge', { method: 'POST', body: JSON.stringify(body) });
  if (!res.charge?.brCode && !res.charge?.qrCodeImage) throw new Error('Woovi: resposta sem QR code.');
  return res.charge;
}

let cachedKeys: string[] | null = null;

function publicKeysUrl(): string {
  return `${BASE_URL}/webhook/public-keys`;
}

export async function fetchWooviPublicKeys(): Promise<string[]> {
  if (cachedKeys) return cachedKeys;
  let res: Response;
  try {
    res = await fetch(publicKeysUrl(), { cache: 'no-store' });
  } catch {
    return cachedKeys ?? [];
  }
  const json = (await res.json().catch(() => null)) as { public_keys?: { key: string }[] } | null;
  const keys = (json?.public_keys ?? []).map((u) => u.key).filter(Boolean);
  if (keys.length) cachedKeys = keys;
  return cachedKeys ?? [];
}

export async function verifyWooviWebhook(rawBody: string, signature: string | null): Promise<boolean> {
  if (!signature) return false;
  try {
    const keys = await fetchWooviPublicKeys();
    if (!keys.length) return false;
    return keys.some((key) => {
      const verifier = createVerify('sha256');
      verifier.update(Buffer.from(rawBody, 'utf8'));
      verifier.end();
      return verifier.verify(key, signature, 'base64');
    });
  } catch {
    return false;
  }
}