# unlocknex

Plataforma de desbloqueios de celulares — Next.js + Firebase + Stripe.

## Pagamentos (Stripe)

### Métodos disponíveis

- **Cartão**, **Boleto** e **PIX** — Checkout hospedado da Stripe (rota `POST /api/stripe/checkout`).
  O usuário é redirecionado para a página de pagamento da Stripe e o saldo é creditado
  automaticamente quando o pagamento é confirmado (webhook).

> **Modo de teste:** com chaves `sk_test_`/`pk_test_`, nada é cobrado de verdade.
> Para receber reais, use as chaves `sk_live_`/`pk_live_` com a conta Stripe **ativada**.
>
> **PIX na Stripe (Brasil):** funciona em modo de teste; em produção é liberado **por convite**
> (conta em boa reputação + ~60 dias de pagamentos processados, via EBANX). Enquanto não for
> liberado, o PIX fica indisponível no checkout em produção.

### Variáveis de ambiente

Crie um arquivo `.env.local` (já ignorado no git):

| Variável | Descrição |
| --- | --- |
| `STRIPE_SECRET_KEY` | Chave secreta (teste: `sk_test_…`, produção: `sk_live_…`) — só no servidor |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Chave publicável (opcional no Checkout hospedado) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret do webhook (Stripe Dashboard → Developers → Webhooks) |
| `SITE_URL` | URL pública do site (usada em notificações e retorno do checkout) |

No **Vercel**, configure as mesmas variáveis (Project → Settings → Environment Variables).

> **⚠️ Dicas importantes (Vercel):**
> 1. **Variáveis só valem para builds novos** — depois de salvar, faça um **push novo** para
>    `main` (dispara o build automaticamente) ou um Redeploy manual.
> 2. **Jamais use placeholders** — o valor de `STRIPE_SECRET_KEY` deve ser a chave real
>    (`sk_test_…` ou `sk_live_…`). Placeholder deixa a variável com status "Needs Attention".

### Webhook (crédito automático de saldo)

1. No painel da Stripe (Developers → Webhooks → **Add endpoint**), cadastre:
   `https://www.unlocknex.com.br/api/stripe/webhook`
2. Selecione os eventos `checkout.session.completed` e `checkout.session.async_payment_succeeded`.
3. Copie o **signing secret** (começa com `whsec_`) e coloque em `STRIPE_WEBHOOK_SECRET`.
4. O webhook valida a assinatura (`stripe-signature`), confere `payment_status = paid` e credita
   o saldo na conta do usuário via transação no Firestore (idempotente).

O webhook é único para todos os meios (cartão, boleto e PIX) — o método de pagamento é
registrado na transação (`paymentMethod: 'pix' | 'card' | 'boleto'`).

### Fluxo

1. Usuário escolhe o valor e o método (PIX / Cartão / Boleto) em **Perfil → Adicionar créditos**.
2. O checkout cria uma sessão (`/v1/checkout/sessions`) e redireciona para a página de pagamento da Stripe.
3. Pagamento confirmado → webhook credita saldo e grava a transação de depósito (`provider: 'stripe'`).

### Legado (Mercado Pago)

As rotas `api/mp/checkout`, `api/pix/charge` e `api/pix/webhook` continuam existindo e podem ser
reativadas configurando as variáveis `MERCADO_PAGO_*` (veja o `.env.example`), mas o fluxo atual
do site usa **Stripe**.