# unlocknex

Plataforma de desbloqueios de celulares — Next.js + Firebase + Mercado Pago.

## Pagamentos (Mercado Pago)

### Métodos disponíveis

- **PIX** — cobrança gerada na hora (`POST /api/pix/charge`), exibe o QR Code e o
  código copia-e-cola no próprio Perfil. Saldo creditado automaticamente após a
  confirmação (webhook).
- **Cartão** e **Boleto** — Checkout Pro do Mercado Pago (`POST /api/mp/checkout`).
  O usuário é redirecionado para a página de pagamento da MP e o saldo é creditado
  automaticamente quando o pagamento é confirmado (webhook).

> **Conta em uso:** **VEXTEC** (account `3049300411`) — credenciais de **produção**
> (Access Token começa com `APP_USR_...`).

### Variáveis de ambiente

Crie um arquivo `.env.local` (já ignorado no git):

| Variável | Descrição |
| --- | --- |
| `MERCADO_PAGO_ACCESS_TOKEN` | Access Token de produção (fallback; renovado pelo OAuth quando houver CLIENT_ID/SECRET) |
| `MERCADO_PAGO_CLIENT_ID` | Client ID da aplicação (auto-refresh do token via `client_credentials`) |
| `MERCADO_PAGO_CLIENT_SECRET` | Client Secret da aplicação (junto com o Client ID) |
| `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` | Public Key de produção (cliente) |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Signing secret da aplicação (validação dos webhooks) |
| `MERCADO_PAGO_WEBHOOK_TOKEN` | (opcional) token próprio para simular webhooks em testes |
| `SITE_URL` | URL pública do site (notificações e retorno do checkout) |

No **Vercel**, configure as mesmas variáveis (Project → Settings → Environment Variables).

> **⚠️ Dicas importantes (Vercel):**
> 1. **Variáveis só valem para builds novos** — depois de salvar, faça um **push novo** para
>    `main` (dispara o build automaticamente) ou um Redeploy manual.
> 2. **Jamais use placeholders** — use sempre as chaves reais de produção.

### Webhook (crédito automático de saldo)

1. No painel do Mercado Pago (aplicação da conta **VEXTEC** → Webhooks), cadastre:
   `https://www.unlocknex.com.br/api/pix/webhook`
2. Selecione o evento **`payment`** (e, se disponível, `merchant_order`).
3. Copie o **signing secret** da aplicação para `MERCADO_PAGO_WEBHOOK_SECRET`.
4. O webhook busca o pagamento na API, valida o status `approved`, e credita o saldo
   via transação atômica no Firestore (idempotente).

O webhook é único para todos os meios (PIX, cartão e boleto) — o método de pagamento é
registrado na transação (`paymentMethod: 'pix' | 'card' | 'boleto'`).

### Fluxo

1. Usuário escolhe o valor e o método (PIX / Cartão / Boleto) em **Perfil → Adicionar créditos**.
2. **PIX**: `POST /api/pix/charge` cria o pagamento (`/v1/payments`), devolve QR + copia-e-cola,
   e o saldo entra sozinho quando o webhook confirma.
3. **Cartão/Boleto**: `POST /api/mp/checkout` cria a preferência (`/checkout/preferences`) e
   redireciona para o Checkout Pro; o webhook confirma e credita.