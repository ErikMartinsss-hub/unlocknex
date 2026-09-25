import { NextResponse } from 'next/server';
import { getMpAccessToken, testMpOauth } from '@/lib/mercadopago-token';

export const runtime = 'nodejs';

const CHECK_VARS = [
  'MERCADO_PAGO_ACCESS_TOKEN',
  'MERCADO_PAGO_CLIENT_ID',
  'MERCADO_PAGO_CLIENT_SECRET',
  'MERCADO_PAGO_WEBHOOK_SECRET',
  'MERCADO_PAGO_WEBHOOK_TOKEN',
  'SITE_URL',
  'FIREBASE_SERVICE_ACCOUNT_B64',
  'HEARTUNLOCKS_TOKEN',
] as const;

export async function GET() {
  // Presença das variáveis (nunca os valores — apenas se estão definidas).
  const env: Record<string, boolean> = {};
  for (const name of CHECK_VARS) env[name] = Boolean(process.env[name]);

  // Testa de VERDADE se o oauth (client_credentials) gera token — não só se a env existe.
  const oauthConfigured = Boolean(process.env.MERCADO_PAGO_CLIENT_SECRET);
  let oauth: { configured: boolean; ok: boolean; error?: string | null } = {
    configured: oauthConfigured,
    ok: false,
    error: 'não configurado',
  };
  if (oauthConfigured) {
    const test = await testMpOauth();
    oauth = { configured: true, ok: test.ok, error: test.ok ? null : (test.error ?? 'oauth falhou') };
  }

  // Consegue obter/renovar o Access Token?
  let token: { ok: boolean; source?: string; error?: string; masked?: string } = { ok: false };
  try {
    const accessToken = await getMpAccessToken();
    token = {
      ok: Boolean(accessToken),
      source: oauth.ok
        ? 'client_credentials (oauth/cache)'
        : oauthConfigured
          ? 'estático (fallback após falha do oauth)'
          : 'estático (ACCESS_TOKEN)',
      masked: accessToken ? `${accessToken.slice(0, 8)}…${accessToken.slice(-4)}` : undefined,
    };
  } catch (err) {
    token.error = err instanceof Error ? err.message : String(err);
  }

  // O token realmente funciona contra a API do Mercado Pago?
  let mp: { ok: boolean; accountId?: number | null; error?: string } | null = null;
  if (token.ok) {
    try {
      const accessToken = await getMpAccessToken();
      const baseUrl = (process.env.MERCADO_PAGO_BASE_URL ?? 'https://api.mercadopago.com').replace(/\/+$/, '');
      const res = await fetch(`${baseUrl}/users/me`, {
        cache: 'no-store',
        headers: { accept: 'application/json', authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const json = (await res.json().catch(() => null)) as { id?: number } | null;
        mp = { ok: true, accountId: json?.id ?? null };
      } else {
        const body = (await res.text().catch(() => '')).slice(0, 200);
        mp = { ok: false, error: `HTTP ${res.status} — ${body}` };
      }
    } catch (err) {
      mp = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  return NextResponse.json({ ok: true, env, token, oauth, mp });
}