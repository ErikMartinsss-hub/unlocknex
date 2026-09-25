import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { createStripeCustomer, createStripeSession, type StripeMethod, type StripeSession } from '@/lib/stripe';

export const runtime = 'nodejs';

const METHODS: StripeMethod[] = ['card', 'boleto', 'pix'];

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) {
    return NextResponse.json({ ok: false, message: 'Não autenticado.' }, { status: 401 });
  }

  let uid: string;
  try {
    uid = (await getAdminAuth().verifyIdToken(token)).uid;
  } catch {
    return NextResponse.json({ ok: false, message: 'Sessão inválida.' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { amount?: number; method?: string } | null;
  const amount = Number(body?.amount ?? NaN);
  const method = METHODS.find((m) => m === body?.method);
  if (!method) {
    return NextResponse.json({ ok: false, message: 'Método de pagamento inválido.' }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount < 5 || amount > 5000) {
    return NextResponse.json({ ok: false, message: 'Valor inválido (mínimo R$ 5,00).' }, { status: 400 });
  }
  const value = Math.round(amount * 100) / 100;

  const db = getAdminDb();
  const userSnap = await db.doc(`users/${uid}`).get().catch(() => null);
  if (!userSnap?.exists) {
    return NextResponse.json({ ok: false, message: 'Usuário não encontrado.' }, { status: 404 });
  }
  const userData = userSnap.data() as { email?: string; stripeCustomerId?: string };
  const email = userData.email ?? 'cliente@unlocknex.com.br';

  const correlationId = `unl-${uid.slice(0, 8)}-${randomUUID()}`;
  const siteUrl = (process.env.SITE_URL ?? 'https://www.unlocknex.com.br').replace(/\/+$/, '');

  try {
    let customer = userData.stripeCustomerId ?? null;

    // Uma tentativa extra: se o customer salvo não existir na conta Stripe
    // (ex.: criado em modo teste e a chave virou live), recria e tenta de novo.
    for (let attempt = 0; attempt < 2; attempt++) {
      if (!customer) {
        customer = (await createStripeCustomer(email)).id;
        await db.doc(`users/${uid}`).set({ stripeCustomerId: customer }, { merge: true });
      }

      let session: StripeSession;
      try {
        session = await createStripeSession({
          method,
          amount: value,
          email,
          correlationId,
          userId: uid,
          successUrl: `${siteUrl}/perfil?status=approved&method=${method}`,
          cancelUrl: `${siteUrl}/perfil?status=canceled&method=${method}`,
          customer,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (attempt === 0 && /No such customer/i.test(msg)) {
          customer = null;
          continue;
        }
        throw err;
      }

      if (!session.url) {
        throw new Error('Stripe: resposta sem URL de checkout.');
      }

      await db.doc(`payments/${correlationId}`).set({
        userId: uid,
        amount: value,
        status: 'pending',
        provider: 'stripe',
        method,
        correlationId,
        stripeSessionId: session.id,
        createdAt: Date.now(),
      });

      return NextResponse.json({ ok: true, url: session.url, method });
    }

    return NextResponse.json({ ok: false, message: 'Não foi possível criar o checkout.' }, { status: 502 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('stripe checkout erro:', message);
    const friendly = /(pix is invalid|pix.*invalid|payment method type.*pix)/i.test(message)
      ? 'PIX ainda não liberado na sua conta Stripe. Ative o método em Developers → Payment methods ou use Cartão/Boleto.'
      : message;
    return NextResponse.json({ ok: false, message: friendly }, { status: 502 });
  }
}