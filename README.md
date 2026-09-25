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
| `MERCADO_PAGO_ACCESS_TOKEN` | Access Token da aplicação — usado como **fallback** (segredo — só no servidor) |
| `MERCADO_PAGO_CLIENT_ID` | Client ID da aplicação (identifica a integração) |
| `MERCADO_PAGO_CLIENT_SECRET` | Client Secret da aplicação (segredo) |
| `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` | Public Key da aplicação (usada no cliente, ex.: Bricks) |
| `SITE_URL` | URL pública do site (usada em notificações e retorno do checkout) |
| `MERCADO_PAGO_WEBHOOK_SECRET` | "Signing secret" da aplicação (validar webhooks) |
| `MERCADO_PAGO_WEBHOOK_TOKEN` | (opcional) token próprio p/ simular webhooks em testes |

### Token automático (auto-refresh)

Com `MERCADO_PAGO_CLIENT_ID` + `MERCADO_PAGO_CLIENT_SECRET` configurados, a aplicação obtém o
Access Token via `client_credentials` (`POST /oauth/token`) e o renova sozinha antes de expirar
(~6h), com cache na instância e no Firestore (`config/mp-token`, protegido pelas regras).
Enquanto essas variáveis não existirem, o `MERCADO_PAGO_ACCESS_TOKEN` é usado normalmente.

No **Vercel**, configure as mesmas variáveis (Project → Settings → Environment Variables):
`MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_CLIENT_ID`, `MERCADO_PAGO_CLIENT_SECRET`,
`NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY`, `SITE_URL` e `MERCADO_PAGO_WEBHOOK_SECRET`.

> **⚠️ Dicas importantes (Vercel):**
> 1. **Variáveis só valem para builds novos** — depois de salvar, dê **Redeploy**
>    (aba Deployments → ⋮ → Redeploy). Enquanto isso, o `/api/mp/status` continua
>    mostrando o deploy antigo.
> 2. **Jamais use placeholders** — o valor de `MERCADO_PAGO_CLIENT_SECRET` deve ser o
>    Client Secret real do painel do MP (padrão: ~32 caracteres alfanuméricos). Um valor
>    como `<seu Client Secret>` deixa a variável com status "Needs Attention" e o
>    auto-refresh desligado.
> 3. Confira o resultado em `GET /api/mp/status`: `token.source` deve virar
>    `client_credentials (oauth/cache)` quando o auto-refresh estiver ativo.

### Webhook (crédito automático de saldo)

1. No painel do Mercado Pago (Suas integrações → sua aplicação → **Webhooks**), cadastre:
   `https://www.unlocknex.com.br/api/pix/webhook`
2. Copie o **signing secret** da aplicação e coloque em `MERCADO_PAGO_WEBHOOK_SECRET`.
3. O webhook valida a assinatura (`x-signature`), confere o pagamento aprovado e credita o saldo
   na conta do usuário via transação no Firestore (idempotente).

> O webhook é único para todos os meios (PIX, cartão e boleto) — o método de pagamento é
> registrado na transação (`paymentMethod: 'pix' | 'card' | 'boleto'`).

### Diagnóstico (`GET /api/mp/status`)

Endpoint público de verificação da integração — retorna **apenas flags de configuração**
(se cada variável está definida) e o estado do token, **sem expor os valores**:

```bash
curl https://seu-dominio/api/mp/status
# {
#   "ok": true,
#   "env": { "MERCADO_PAGO_ACCESS_TOKEN": true, "MERCADO_PAGO_CLIENT_SECRET": false, ... },
#   "oauth": { "configured": true, "ok": true, "error": null },   ← testa o oauth de verdade
#   "token": { "ok": true, "source": "client_credentials (oauth/cache)", "masked": "APP_USR…6189" },
#   "mp": { "ok": true, "accountId": 194646189 }
# }
```

> Se `oauth.ok` for `false`, o `MERCADO_PAGO_CLIENT_SECRET` está inválido (ex.: placeholder
> `<seu Client Secret>`) e o app usa o token estático como fallback — confira o valor na Vercel
> e faça um **Redeploy** (ou um push novo dispara o build automaticamente).

### Fluxo

1. Usuário escolhe o valor e o método (PIX / Cartão / Boleto) em **Perfil → Adicionar créditos**.
2. PIX → QR Code + copia e cola na própria página (`payments/{id}` acompanha a confirmação via snapshot).
3. Cartão/Boleto → criação de preferência (`/checkout/preferences`) e redirecionamento ao `init_point`.
4. Pagamento aprovado → webhook credita saldo e grava a transação de depósito.