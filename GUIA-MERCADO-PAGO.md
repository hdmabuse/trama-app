# Guia: Configurar Mercado Pago no trama-app

## Pré-requisitos

- Conta de desenvolvedor no Mercado Pago: https://www.mercadopago.com.br/developers
- Aplicação já rodando localmente (`npm run dev`)
- Banco PostgreSQL com schema atualizado (`npm run db:push`)

---

## 1. Criar Aplicação no Painel de Desenvolvedores

1. Acesse https://www.mercadopago.com.br/developers/panel/app
2. Clique **"Criar aplicação"**
3. Preencha:
   - Nome: `Trama`
   - Produto: **Assinaturas** (ou "Checkout Pro")
   - Modelo de integração: **Checkout Pro**
4. Após criação, copie:
   - **Access Token** (credenciais de produção ou teste)
   - **Public Key**

> Para testes, use as **credenciais de teste** (sandbox). Só mude para produção quando for ao ar.

---

## 2. Criar Planos Recorrentes (Preapproval Plans)

Via API (usando curl ou Postman) — o painel web do MP nem sempre tem UI para planos:

```bash
# Plano PRO (R$ 39/mês)
curl -X POST https://api.mercadopago.com/preapproval_plan \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Trama Pro",
    "auto_recurring": {
      "frequency": 1,
      "frequency_type": "months",
      "transaction_amount": 39,
      "currency_id": "BRL"
    },
    "back_url": "https://seudominio.com/billing/success"
  }'

# Plano TEAM (R$ 99/mês)
curl -X POST https://api.mercadopago.com/preapproval_plan \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Trama Team",
    "auto_recurring": {
      "frequency": 1,
      "frequency_type": "months",
      "transaction_amount": 99,
      "currency_id": "BRL"
    },
    "back_url": "https://seudominio.com/billing/success"
  }'
```

Cada chamada retorna um JSON com `"id"` — esse é o **Plan ID**. Guarde os dois.

---

## 3. Configurar Variáveis de Ambiente

Edite o arquivo `.env` (crie a partir de `.env.example` se não existir):

```env
# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxx
MERCADO_PAGO_PUBLIC_KEY=APP_USR-xxxxxxxxxxxx
MERCADO_PAGO_WEBHOOK_SECRET=seu_webhook_secret_aqui

# IDs dos planos criados no passo 2
MERCADO_PAGO_PLAN_ID_PRO=2c9380848xxxxxxx
MERCADO_PAGO_PLAN_ID_TEAM=2c9380848xxxxxxx

# URL base do app (sem barra no final)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> O `WEBHOOK_SECRET` é definido por você ao configurar o webhook no passo 4. Pode ser qualquer string aleatória segura (ex: `openssl rand -hex 32`).

---

## 4. Configurar Webhook no Mercado Pago

1. No painel de desenvolvedores, acesse sua aplicação e vá em **Webhooks** (ou "Notificações IPN")
2. Configure:
   - **URL de produção:** `https://seudominio.com/api/webhooks/mercadopago`
   - **URL de teste (dev):** use um túnel como [ngrok](https://ngrok.com/) ou [localtunnel](https://localtunnel.github.io/localtunnel/)
   - **Eventos a escutar:**
     - `subscription_preapproval` (criação/autorização/cancelamento de assinatura)
     - `payment` (pagamentos criados/atualizados)
3. Ao salvar, o MP pode mostrar um **Secret** para assinatura — use-o como `MERCADO_PAGO_WEBHOOK_SECRET`

### Expor localhost para testes (ngrok)

```bash
ngrok http 3000
```

Use a URL gerada (ex: `https://abc123.ngrok-free.app/api/webhooks/mercadopago`) como webhook URL no painel.

---

## 5. Garantir que o Schema do Banco está Atualizado

O projeto já tem os models `Subscription` e `Payment` no `prisma/schema.prisma`. Rode:

```bash
npm run db:push
```

Isso sincroniza o schema com o banco PostgreSQL.

---

## 6. Testar o Fluxo Completo (Sandbox)

### 6.1 Iniciar o app

```bash
npm run dev
```

### 6.2 Criar um usuário de teste

Registre em `http://localhost:3000/cadastro` ou use o seed:

- Email: `pesquisador@trama.app.br`
- Senha: `trama2026`

### 6.3 Iniciar checkout

1. Acesse `http://localhost:3000/pricing`
2. Clique em **"Assinar Pro"** ou **"Assinar Team"**
3. Você será redirecionado para o Mercado Pago (sandbox)

### 6.4 Pagar no sandbox

O Mercado Pago fornece **cartões de teste** para sandbox:

| Bandeira   | Número               | CVV | Vencimento |
|------------|----------------------|-----|------------|
| Visa       | 4235 6477 2802 5682  | 123 | 11/25      |
| Mastercard | 5031 4332 1540 6351  | 123 | 11/25      |

Use qualquer **nome** e **CPF fictício** (ex: 12345678909).

> Para simular pagamento **aprovado**, use o cartão Visa acima.
> Para simular **rejeitado**, o MP tem números específicos na [documentação de testes](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/additional-content/test-cards).

### 6.5 Verificar webhook

Após pagamento, o MP envia o webhook para sua URL. Verifique no terminal/ngrok:

- O log mostrará os eventos processados
- No banco: `prisma studio` → tabela `Subscription` deve ter um registro ACTIVE
- O `user.plan` deve ter mudado de `FREE` para `PRO`

### 6.6 Verificar no app

- Acesse `http://localhost:3000/billing/manage`
- Deve mostrar a assinatura ativa com dados do pagamento

---

## 7. Testar Cancelamento

1. Em `/billing/manage`, clique **"Cancelar assinatura"**
2. Confirme
3. O app chama a API do MP para cancelar
4. `cancelAtPeriodEnd` fica `true` — acesso mantido até fim do período
5. Webhook recebe evento de cancelamento e atualiza status para `CANCELLED`

---

## 8. Deploy para Produção

### 8.1 Trocar credenciais

No ambiente de produção, substitua as credenciais de teste pelas de **produção** no painel do MP.

### 8.2 Configurar webhook de produção

Atualize a URL do webhook para o domínio real:

```
https://trama.app.br/api/webhooks/mercadopago
```

### 8.3 Variáveis no servidor

Configure todas as env vars no seu servidor/Docker:

```env
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-prod-xxxx
MERCADO_PAGO_PUBLIC_KEY=APP_USR-prod-xxxx
MERCADO_PAGO_WEBHOOK_SECRET=sua_chave_segura_producao
MERCADO_PAGO_PLAN_ID_PRO=id_do_plano_prod_pro
MERCADO_PAGO_PLAN_ID_TEAM=id_do_plano_prod_team
NEXT_PUBLIC_APP_URL=https://trama.app.br
```

### 8.4 Verificar HTTPS

O webhook do MP **exige HTTPS** em produção. Certifique-se que o domínio tem SSL configurado.

---

## 9. Checklist Final

| Item | Status |
|------|--------|
| Access Token configurado | [ ] |
| Plan IDs PRO e TEAM criados | [ ] |
| Webhook URL registrada no MP | [ ] |
| Webhook Secret configurado | [ ] |
| `NEXT_PUBLIC_APP_URL` correto | [ ] |
| Schema do banco atualizado (`db:push`) | [ ] |
| Fluxo de checkout testado no sandbox | [ ] |
| Webhook recebendo eventos (verificar logs) | [ ] |
| Cancelamento funcionando | [ ] |
| Página `/billing/success` acessível após pagamento | [ ] |
| Credenciais de produção separadas das de teste | [ ] |

---

## 10. Troubleshooting

| Problema | Solução |
|----------|---------|
| Webhook retorna 401 | Verifique que `MERCADO_PAGO_WEBHOOK_SECRET` está correto e igual ao configurado no MP |
| Checkout redireciona para erro | Verifique que os Plan IDs existem e estão ativos no MP |
| `user.plan` não atualiza | Verifique que o `external_reference` no checkout é o `userId` correto |
| Pagamento aprovado mas subscription não criada | Verifique os logs do webhook — o `preapproval_plan_id` precisa casar com `MERCADO_PAGO_PLAN_ID_PRO` ou `_TEAM` |
| ngrok não recebe eventos | Certifique-se que a URL do webhook no painel do MP inclui `/api/webhooks/mercadopago` e que o ngrok está rodando |
| Erro "USER_ALREADY_HAS_ACTIVE_SUBSCRIPTION" | O usuário já tem assinatura ativa — cancele primeiro ou use outro usuário |

---

## Arquitetura da Integração

```
Usuário                     trama-app                        Mercado Pago
  |                            |                                  |
  |-- Clica "Assinar Pro" ---->|                                  |
  |                            |-- POST /api/billing/checkout --->|
  |                            |<-- { checkoutUrl } --------------|
  |<-- Redireciona ------------|                                  |
  |                                                               |
  |-- Paga no checkout do MP ------------------------------------>|
  |                                                               |
  |                            |<-- Webhook (subscription auth) --|
  |                            |    Cria Subscription no DB       |
  |                            |    Atualiza user.plan            |
  |                                                               |
  |<-- Redireciona /billing/success                               |
  |                                                               |
  |                   (mensalmente)                               |
  |                            |<-- Webhook (payment approved) ---|
  |                            |    Cria Payment no DB            |
  |                            |    Renova período                |
```

### Rotas da API

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/billing/checkout` | POST | Cria checkout e retorna URL do MP |
| `/api/billing/subscription` | GET | Retorna estado da assinatura do usuário |
| `/api/billing/cancel` | POST | Cancela assinatura no MP e no DB |
| `/api/billing/upgrade` | POST | Faz upgrade de plano (PRO → TEAM) |
| `/api/webhooks/mercadopago` | POST | Recebe e processa eventos do MP |

### Páginas

| Página | Descrição |
|--------|-----------|
| `/pricing` | Tabela comparativa dos 3 planos |
| `/billing/upgrade` | Seleção de plano e botão de checkout |
| `/billing/manage` | Status da assinatura, histórico, cancelamento |
| `/billing/success` | Confirmação após pagamento |
| `/billing/error` | Página de erro no checkout |
