# STRIPE_INTEGRATION_TODO

Integração **Hosted Stripe Checkout** (redireciona o cliente para a página de pagamento da Stripe)
para recarga de saldo UnlockNex — cartão, boleto e PIX.

> Cenário A: a chamada de criação de Checkout Session já existia em [lib/stripe.ts](lib/stripe.ts).
> Foi atualizada **somente nos parâmetros** da chamada, preservando os valores reais já existentes
> (`mode`, `success_url`, `cancel_url`, `line_items`) e os parâmetros de negócio necessários
> (`payment_method_types`, `metadata`, `client_reference_id`, `customer_email`, `locale`, `customer`).

## Values to Replace

Nenhum valor é placeholder. Os parâmetros `sample_only` já estão com valores **reais e funcionais**:

**Arquivos relevantes:**
- [lib/stripe.ts](lib/stripe.ts) — `createStripeSession()`
- [app/api/stripe/checkout/route.ts](app/api/stripe/checkout/route.ts) — chama a sessão
- [app/api/stripe/webhook/route.ts](app/api/stripe/webhook/route.ts) — credita saldo

| Field | Current Value | What to Set |
|-------|--------------|-------------|
| mode | `payment` | ✅ Correto — recarga única (não é assinatura). |
| success_url | `https://www.unlocknex.com.br/perfil?status=approved&method={m}` | ✅ Real (sem placeholder). |
| cancel_url | `https://www.unlocknex.com.br/perfil?status=canceled&method={m}` | ✅ Real (sem placeholder). |
| line_items[].price_data | `currency=brl`, `unit_amount={centavos}` | ✅ Real — valor dinâmico vindo do formulário do usuário (Price interno, sem `price_...`). |

> Para criar **produtos/Preços** reais no Dashboard: https://dashboard.stripe.com/prices (opcional —
> o fluxo atual usa `price_data` inline, dispensando cadastro).

## Configured Parameters

**Arquivos contendo os parâmetros configurados:**
- [lib/stripe.ts](lib/stripe.ts)

| Parameter | Value | Observação |
|-----------|-------|------------|
| ui_mode | `hosted_page` | Sem SDK — REST direto; `hosted_page` validado contra a API. |
| billing_address_collection | `auto` | |
| phone_number_collection[enabled] | `true` | Coleta telefone no checkout. |
| automatic_tax[enabled] | `false` | Impostos não aplicados. |
| allow_promotion_codes | `false` | Sem cupons. |
| submit_type | `auto` | |
| integration_identifier | `hosted_web_0001` | |
| origin_context | `web` | |
| saved_payment_method_options[payment_method_save] | `enabled` | Requer `customer` — a rota de checkout cria e salva o customer (`users/{uid}.stripeCustomerId`) na 1ª recarga. |
| mode | `payment` | `payment_method_collection` **não** aplicado (só para `mode=subscription`). |

## Setup

| Variável | Valor | Status |
|----------|-------|--------|
| `STRIPE_SECRET_KEY` | `rk_live_…` (restrita: Checkout + Webhooks) | ✅ Chave live obtida e **validada** (sessões card/boleto criadas em livemode) — falta trocar na Vercel |
| `STRIPE_WEBHOOK_SECRET` | `whsec_kMKHAxwloY95zpnfyLUOTeuxjbCluBWF` | ✅ Webhook **live** já criado via API — falta trocar na Vercel |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_…` | Opcional (Checkout hospedado não usa) |

Chaves em: https://dashboard.stripe.com/apikeys · Webhooks: https://dashboard.stripe.com/workbench/webhooks

## Setup e próximos passos

1. ~~Ativar conta Stripe (produção)~~ ✅ Feito — sessões live criadas sem erro (conta ativa).
2. ~~Chaves live~~ ✅ `rk_live_…` validada; webhook live `whsec_kMKHAxwloY95zpnfyLUOTeuxjbCluBWF` criado.
3. **Na Vercel** (Production → Settings → Environment Variables): trocar
   `STRIPE_SECRET_KEY` → `rk_live_…` e `STRIPE_WEBHOOK_SECRET` → `whsec_kMKHAxwloY95zpnfyLUOTeuxjbCluBWF`.
   Depois: Redeploy (ou push). Conferir em `GET /api/stripe/status` → `mode: "live"`.
4. **Cartões de teste** (modo teste): `4242 4242 4242 4242` (Visa), `4000 0027 6000 3184` (falha 3DS),
   `4000 0000 0000 0002` (recusado). Em live, usar cartão real (pago de verdade; reembolsável).
5. **Fluxo**: Perfil → Adicionar créditos → método → `/api/stripe/checkout` cria a sessão →
   redirect à URL da Stripe → pagamento pago → webhook valida assinatura e `payment_status=paid` →
   transação no Firestore credita saldo (idempotente).

## Pendências conhecidas

- **PIX**: não ativado na conta Stripe (nem em teste) — no Brasil é **por convite** (EBANX).
  Ativar em Developers → Payment methods. Até lá, o checkout PIX retorna mensagem amigável em pt-BR.
- **Webhooks**: endpoint vivo de **produção** criado via API (`whsec_kMKHAxwloY95zpnfyLUOTeuxjbCluBWF`) —
  o de teste (`whsec_r9diM7kb3RebnmPntZ5NMosldAlbrVx0`) pode ser removido no painel se preferir.

## Recursos

- Suporte Stripe: https://support.stripe.com
- Docs: https://docs.stripe.com/mcp · https://docs.stripe.com/payments/checkout