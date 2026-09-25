# MERCADO_PAGO_INTEGRATION_TODO

Integração de pagamentos **UnlockNex via Mercado Pago** (substituiu o Stripe — removido em 25/09).

- **PIX** → `POST /api/pix/charge` (QR + copia-e-cola no Perfil, webhook credita saldo)
- **Cartão / Boleto** → `POST /api/mp/checkout` (Checkout Pro, redireciona e webhook credita saldo)
- **Webhook** → `POST /api/pix/webhook` (valida assinatura, busca o pagamento e credita via transação idempotente)

> Conta em uso: **VEXTEC** — account `3049300411` (criada 08/12/2025, CNPJ). As credenciais novas
> foram validadas: token OAuth gerado (`live_mode: true`) e `GET /users/me` respondendo.

## ✅ Feito

- Stripe removido do código: `lib/stripe.ts`, `app/api/stripe/*`, `STRIPE_INTEGRATION_TODO.md` apagados.
- `app/perfil/page.tsx` voltou a chamar `/api/pix/charge` (PIX c/ QR) e `/api/mp/checkout` (card/boleto).
- `.env.local` com as credenciais novas da conta VEXTEC (Access Token, Public Key, Client ID/Secret).
- OAuth `client_credentials` **validado** para a conta nova — auto-refresh do token funcionará na Vercel.
- **Cache de token no Firestore (`config/mp-token`) agora valida o `clientId`** — se as credenciais
  mudarem (ex.: troca de conta MP), o token velho é ignorado automaticamente e o novo é gerado na hora.

## ⏳ Pendências (ações no painel — não dá pra fazer por código)

1. **Vercel (Production → Settings → Environment Variables):** substituir os valores de
   `MERCADO_PAGO_ACCESS_TOKEN`, `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY`, `MERCADO_PAGO_CLIENT_ID`
   e `MERCADO_PAGO_CLIENT_SECRET` pelas credenciais da conta **VEXTEC**, e **remover**
   `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
   Depois: push para `main` (redeploy automático) e conferir `GET /api/mp/status` — deve mostrar
   `oauth.ok = true` e `mp.accountId = 3049300411`.

2. **Webhook no painel MP (conta VEXTEC → aplicação → Webhooks):** cadastrar
   `https://www.unlocknex.com.br/api/pix/webhook` com o evento **`payment`** e copiar o
   **signing secret** para `MERCADO_PAGO_WEBHOOK_SECRET` (local + Vercel).

3. **PIX ativo?** A conta VEXTEC é nova — conferir se o PIX está liberado para receber
   (`/v1/payments` com `payment_method_id: pix`). Se faltar validação de conta (dados/CPF-CNPJ),
   a MP retorna erro específico — validar no painel (preferências/validações).

## Testes manuais

- Cartões de teste MP (Checkout Pro aceita em produção? Não — cartão real; reembolsável).
- PIX: gerar cobrança R$ 5, pagar com o app do banco e conferir o saldo subir sozinho.
- Boleto: gerar e conferir que o webhook credita após compensação (2d úteis, status `approved`).

## Recursos

- Credenciais: https://www.mercadopago.com.br/developers/panel/app
- Docs API PIX: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/recebimento-de-pagamentos-pix
- Webhooks: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks