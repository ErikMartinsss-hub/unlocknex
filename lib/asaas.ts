import { createHmac, timingSafeEqual } from 'node:crypto';

const BASE_URL = (process.env.ASAAS_BASE_URL ?? 'https://sandbox.asaas.com/api/v3').replace(/\/+$/, '');
const API_KEY = process.env.ASAAS_API_KEY ?? '';

type AsaasError = { errors?: { description: string }[] };

async function asaasCall<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_KEY) throw new Error('ASAAS não configurado (ASAAS_API_KEY ausente).');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      access_token: API_KEY,
      ...(init?.headers ?? {}),
    },
  });
  const json = (await res.json().catch(() => null)) as (T & AsaasError) | null;
  if (!res.ok || !json) {
    const detail = json?.errors?.map((e) => e.description).join('; ') ?? `HTTP ${res.status}`;
    throw new Error(`ASAAS: ${detail}`);
  }
  return json;
}

export type AsaasCustomer = { id: string; name: string; email: string; cpfCnpj: string };

export async function createAsaasCustomer(data: { name: string; email: string; cpfCnpj: string }): Promise<string> {
  const res = await asaasCall<AsaasCustomer>('/customers', { method: 'POST', body: JSON.stringify(data) });
  return res.id;
}

export type AsaasPayment = {
  id: string;
  value: number;
  status: string;
  invoiceUrl: string;
  externalReference: string | null;
  billingType: string;
};

export async function createAsaasPixCharge(data: {
  customerId: string;
  value: number;
  externalReference: string;
  description: string;
}): Promise<AsaasPayment> {
  const due = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const res = await asaasCall<AsaasPayment>('/payments', {
    method: 'POST',
    body: JSON.stringify({
      customer: data.customerId,
      billingType: 'PIX',
      value: data.value,
      dueDate: due,
      description: data.description,
      externalReference: data.externalReference,
    }),
  });
  return res;
}

export type AsaasPixQr = { encodedImage: string; payload: string; expirationDate: string };

export async function getAsaasPixQr(paymentId: string): Promise<AsaasPixQr> {
  return asaasCall<AsaasPixQr>(`/payments/${paymentId}/pixQrCode`);
}

export function verifyAsaasSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.ASAAS_WEBHOOK_SECRET ?? '';
  if (!secret || !signature) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}