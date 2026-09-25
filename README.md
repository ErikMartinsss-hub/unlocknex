# unlocknex

Plataforma de desbloqueios de celulares — Next.js + Firebase + Mercado Pago.

## Pagamentos (Mercado Pago)

### Métodos disponíveis

- **PIX** — cobrança instantânea com QR Code (rota `POST /api/pix/charge`).
- **Cartão** e **Boleto** — Checkout Pro do Mercado Pago (rota `POST /api/mp/checkout`).
  O usuário é redirecionado para a página de pagamento do Mercado Pago e o saldo
  é creditado automaticamente quando o pagamento é aprovado.

### Variáveis de ambiente

Crie um arquivo `.env.local` (já ignorado no git):

| Variável | Descrição |
| --- | --- |
| `MERCADO_PAGO_ACCESS_TOKEN` | Access Token da aplicação (segredo — só no servidor) |
| `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` | Public Key da aplicação (usada no cliente, ex.: Bricks) |
| `SITE_URL` | URL pública do site (usada em notificações e retorno do checkout) |
| `MERCADO_PAGO_WEBHOOK_SECRET` | "Signing secret" da aplicação (validar webhooks) |
| `MERCADO_PAGO_WEBHOOK_TOKEN` | (opcional) token próprio p/ simular webhooks em testes |

No **Vercel**, configure as mesmas variáveis (Project → Settings → Environment Variables):
`MERCADO_PAGO_ACCESS_TOKEN`, `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY`, `SITE_URL` e `MERCADO_PAGO_WEBHOOK_SECRET`.

### Webhook (crédito automático de saldo)

1. No painel do Mercado Pago (Suas integrações → sua aplicação → **Webhooks**), cadastre:
   `https://seu-dominio/api/pix/webhook`
2. Copie o **signing secret** da aplicação e coloque em `MERCADO_PAGO_WEBHOOK_SECRET`.
3. O webhook valida a assinatura (`x-signature`), confere o pagamento aprovado e credita o saldo
   na conta do usuário via transação no Firestore (idempotente).

> O webhook é único para todos os meios (PIX, cartão e boleto) — o método de pagamento é
> registrado na transação (`paymentMethod: 'pix' | 'card' | 'boleto'`).

### Fluxo

1. Usuário escolhe o valor e o método (PIX / Cartão / Boleto) em **Perfil → Adicionar créditos**.
2. PIX → QR Code + copia e cola na própria página (`payments/{id}` acompanha a confirmação via snapshot).
3. Cartão/Boleto → criação de preferência (`/checkout/preferences`) e redirecionamento ao `init_point`.
4. Pagamento aprovado → webhook credita saldo e grava a transação de depósito.