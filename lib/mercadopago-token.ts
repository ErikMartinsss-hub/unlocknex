import { getAdminDb } from '@/lib/firebase-admin';

const BASE_URL = (process.env.MERCADO_PAGO_BASE_URL ?? 'https://api.mercadopago.com').replace(/\/+$/, '');
const CLIENT_ID = process.env.MERCADO_PAGO_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.MERCADO_PAGO_CLIENT_SECRET ?? '';
const STATIC_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN ?? '';

// Renova 5 minutos antes de expirar (evita corrida com o limite de validade).
const SKEW_MS = 5 * 60 * 1000;

type StoredToken = { accessToken: string; expiresAt: number };

// Cache por instância do servidor (evita chamadas de rede a cada requisição).
let cached: StoredToken | null = null;

function credentialsConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

async function requestToken(): Promise<StoredToken> {
  const res = await fetch(`${BASE_URL}/oauth/token`, {
    method: 'POST',
    cache: 'no-store',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok || !json) {
    const detail = json ? JSON.stringify(json).slice(0, 300) : `HTTP ${res.status}`;
    throw new Error(`Mercado Pago oauth: ${detail}`);
  }
  const token = (json as { access_token?: string }).access_token;
  if (!token) throw new Error('Mercado Pago oauth: resposta sem access_token.');
  const expiresIn = Number((json as { expires_in?: number }).expires_in ?? 21600);
  const expiresAt = Date.now() + Math.max(60, expiresIn - 60) * 1000 - SKEW_MS;
  return { accessToken: token, expiresAt };
}

async function readShared(): Promise<StoredToken | null> {
  try {
    const snap = await getAdminDb().doc('config/mp-token').get();
    const d = snap.data();
    if (!d?.accessToken || !d?.expiresAt) return null;
    // Invalida cache gerado por OUTRA aplicação/conta (ex.: troca de credenciais MP).
    // Passa a usar o token novo imediatamente após trocar CLIENT_ID no ambiente.
    if (CLIENT_ID && d.clientId !== CLIENT_ID) return null;
    return { accessToken: String(d.accessToken), expiresAt: Number(d.expiresAt) };
  } catch {
    // Firestore indisponível (ex.: sem service account) — segue com o cache do processo.
    return null;
  }
}

async function writeShared(token: StoredToken): Promise<void> {
  try {
    await getAdminDb()
      .doc('config/mp-token')
      .set({
        accessToken: token.accessToken,
        expiresAt: token.expiresAt,
        clientId: CLIENT_ID || null,
        updatedAt: Date.now(),
      });
  } catch {
    // Ignora — o cache da instância ainda protege esta execução.
  }
}

/**
 * Testa se as credenciais client_credentials realmente geram um token.
 * Não expõe o token gerado — apenas ok/erro (para diagnóstico).
 */
export async function testMpOauth(): Promise<{ ok: boolean; error?: string }> {
  if (!CLIENT_ID || !CLIENT_SECRET) return { ok: false, error: 'CLIENT_ID/CLIENT_SECRET ausentes' };
  try {
    await requestToken();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Retorna um Access Token válido do Mercado Pago.
 *
 * Ordem de preferência:
 * 1. `client_credentials` (MERCADO_PAGO_CLIENT_ID + MERCADO_PAGO_CLIENT_SECRET):
 *    token renovado automaticamente (~6h), cacheado na instância e no Firestore
 *    (doc `config/mp-token`, inacessível aos clientes pelas regras).
 * 2. Fallback: `MERCADO_PAGO_ACCESS_TOKEN` estático (token manual/longo).
 */
export async function getMpAccessToken(): Promise<string> {
  const now = Date.now();

  if (cached && cached.expiresAt > now) return cached.accessToken;

  if (credentialsConfigured()) {
    const shared = await readShared();
    if (shared && shared.expiresAt > now) {
      cached = shared;
      return shared.accessToken;
    }
    try {
      const fresh = await requestToken();
      cached = fresh;
      await writeShared(fresh);
      return fresh.accessToken;
    } catch (err) {
      if (STATIC_TOKEN) {
        console.warn('mercadopago: falha ao renovar token via oauth, usando token estático.', err);
        return STATIC_TOKEN;
      }
      throw err;
    }
  }

  if (STATIC_TOKEN) return STATIC_TOKEN;
  throw new Error(
    'Mercado Pago não configurado (MERCADO_PAGO_ACCESS_TOKEN, ou MERCADO_PAGO_CLIENT_ID + MERCADO_PAGO_CLIENT_SECRET).'
  );
}