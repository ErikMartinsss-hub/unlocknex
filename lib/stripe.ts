import { createHmac, timingSafeEqual } from 'node:crypto';

const BASE_URL = 'https://api.stripe.com';
const SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? '';

export type StripeMethod = 'card' | 'boleto' | 'pix';

type StripeError = { error?: { message?: string } };

async function stripeApi<T>(path: string, form: Record<string, string>): Promise<T> {
  if (!SECRET_KEY) throw new Error('Stripe não configurado (STRIPE_SECRET_KEY ausente).');
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(form)) {
    if (v !== '') body.append(k, v);
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      authorization: `Bearer ${SECRET_KEY}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const json = (await res.json().catch(() => null)) as T | StripeError | null;
  if (!res.ok || !json) {
    const message =
      json && typeof json === 'object' && 'error' in json && typeof json.error?.message === 'string'
        ? json.error.message
        : `Stripe: HTTP ${res.status}`;
    throw new Error(`Stripe: ${message}`);
  }
  return json as T;
}

export type StripeCustomer = { id: string };

export async function createStripeCustomer(email: string): Promise<StripeCustomer> {
  return stripeApi<StripeCustomer>('/v1/customers', {
    email,
    description: 'Cliente UnlockNex (recarga de saldo)',
  });
}

export type StripeSession = {
  id: string;
  url: string | null;
  payment_status?: string;
};

export async function createStripeSession(data: {
  method: StripeMethod;
  amount: number; // em reais
  email: string;
  correlationId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
  customer?: string | null;
}): Promise<StripeSession> {
  const unitAmount = Math.round(data.amount * 100); // centavos
  const form: Record<string, string> = {
    mode: 'payment',
    ui_mode: 'hosted_page',
    locale: 'pt-BR',
    success_url: data.successUrl,
    cancel_url: data.cancelUrl,
    // Parâmetros configurados (Checkout Studio / fixed_by_ui)
    billing_address_collection: 'auto',
    'phone_number_collection[enabled]': 'true',
    'automatic_tax[enabled]': 'false',
    allow_promotion_codes: 'false',
    submit_type: 'auto',
    integration_identifier: 'hosted_web_0001',
    origin_context: 'web',
    // Método de pagamento + rastreio (negócio)
    'payment_method_types[0]': data.method,
    client_reference_id: data.correlationId,
    'metadata[userId]': data.userId,
    'metadata[correlationId]': data.correlationId,
    'metadata[amount]': String(data.amount),
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'brl',
    'line_items[0][price_data][unit_amount]': String(unitAmount),
    'line_items[0][price_data][product_data][name]': 'Recarga de saldo UnlockNex',
  };
  if (data.customer) {
    // customer e customer_email são mutuamente exclusivos na API
    form.customer = data.customer;
    form['saved_payment_method_options[payment_method_save]'] = 'enabled';
  } else {
    form.customer_email = data.email;
  }
  return stripeApi<StripeSession>('/v1/checkout/sessions', form);
}

export function verifyStripeWebhook(payload: string, signature: string, secret: string): boolean {
  if (!payload || !signature || !secret) return false;
  const parts = new Map<string, string>();
  for (const kv of signature.split(',')) {
    const idx = kv.indexOf('=');
    if (idx > 0) parts.set(kv.slice(0, idx).trim(), kv.slice(idx + 1).trim());
  }
  const ts = parts.get('t');
  const v1 = parts.get('v1');
  if (!ts || !v1) return false;

  const tsMs = Number(ts) * 1000;
  if (!Number.isFinite(tsMs) || Math.abs(Date.now() - tsMs) > 5 * 60 * 1000) return false;

  const expected = createHmac('sha256', secret).update(`${ts}.${payload}`).digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(v1, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}