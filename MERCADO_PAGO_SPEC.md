# Spec: Integração Mercado Pago — Assinaturas Recorrentes

## Contexto

O app **Trama** já possui infraestrutura de planos (`FREE`, `PRO`, `TEAM`) com limites enforceados via `checkPlanLimit()`. O que falta é o **processamento de pagamentos** para que usuários possam fazer upgrade de plano via cartão de crédito usando **Mercado Pago**.

**Preços atuais:**
- FREE: R$ 0
- PRO: R$ 39/mês
- TEAM: R$ 99/mês

---

## 1. Schema do Banco de Dados (Prisma)

### Novos Models

```prisma
model Subscription {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id])
  plan              Plan     // PRO ou TEAM
  status            SubscriptionStatus @default(ACTIVE)
  mercadoPagoId     String   @unique  // ID da subscription no MP
  mercadoPagoPlanId String   // ID do plano no MP
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelAtPeriodEnd Boolean  @default(false)
  lastPaymentId     String?  @db.Text  // último payment_id do MP
  lastPaymentStatus String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  payments Payment[]

  @@index([userId])
  @@index([status])
}

model Payment {
  id              String   @id @default(cuid())
  subscriptionId  String
  subscription    Subscription @relation(fields: [subscriptionId], references: [id])
  mercadoPagoPaymentId String @unique
  amount          Int      // em centavos
  currency        String   @default("BRL")
  status          String   // approved, pending, rejected, etc.
  paymentMethod   String?  // credit_card, boleto, pix
  installments    Int?
  cardLast4       String?
  receiptUrl      String?
  transactionDate DateTime
  createdAt       DateTime @default(now())

  @@index([subscriptionId])
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELLED
  EXPIRED
  PENDING
}
```

### Alteração no Model User

```prisma
model User {
  // ... campos existentes ...
  subscriptions Subscription[]
}
```

---

## 2. Variáveis de Ambiente (.env.example)

```env
# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxx
MERCADO_PAGO_PUBLIC_KEY=APP_USR-xxx
MERCADO_PAGO_CLIENT_ID=xxx
MERCADO_PAGO_CLIENT_SECRET=xxx
MERCADO_PAGO_WEBHOOK_SECRET=xxx

# IDs dos planos recorrentes no Mercado Pago
MERCADO_PAGO_PLAN_ID_PRO=xxx
MERCADO_PAGO_PLAN_ID_TEAM=xxx

# URL base para callbacks
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 3. Setup no Mercado Pago (Painel)

### 3.1 Criar Planos Recorrentes

No painel do Mercado Pago → Produtos → Planos de Assinatura:

| Campo | PRO | TEAM |
|---|---|---|
| Nome | Trama Pro | Trama Team |
| Preço | R$ 39,00 | R$ 99,00 |
| Recorrência | Mensal | Mensal |
| Período de teste | 7 dias (opcional) | 7 dias (opcional) |

### 3.2 Criar Aplicação

No painel de desenvolvedores do Mercado Pago:
- Criar aplicação do tipo **Recuperação de Pagamentos / Assinaturas**
- Obter `ACCESS_TOKEN` e `PUBLIC_KEY`
- Configurar **Webhook URL** apontando para `/api/webhooks/mercadopago`

---

## 4. API Routes

### 4.1 `POST /api/billing/checkout`

Cria uma preference de checkout para assinatura.

**Request:**
```json
{
  "plan": "PRO"
}
```

**Lógica:**
1. Verificar usuário autenticado
2. Validar plano (PRO ou TEAM)
3. Verificar se já existe subscription ativa → erro 400
4. Buscar `planId` do MP baseado no plano (env var)
5. Retornar `init_point` (URL de checkout do MP)

**Response:**
```json
{
  "checkoutUrl": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=xxx",
  "planId": "xxx",
  "price": 3900
}
```

### 4.2 `POST /api/webhooks/mercadopago`

Recebe eventos do Mercado Pago.

**Eventos a tratar:**

| Tipo | Ação |
|---|---|
| `subscription.preapproval.authorized` | Criar `Subscription` no DB, setar `user.plan` |
| `subscription.preapproval.cancelled` | Setar `subscription.status = CANCELLED`, agendar downgrade |
| `subscription.preapproval.suspended` | Setar `status = PAST_DUE`, notificar usuário |
| `payment.created` (payment_type=subscription) | Criar `Payment` no DB |
| `payment.updated` (status=approved) | Confirmar pagamento, atualizar `lastPaymentStatus` |
| `payment.updated` (status=rejected) | Marcar pagamento como falho, notificar |

**Segurança:**
- Validar `x-signature` header com `MERCADO_PAGO_WEBHOOK_SECRET`
- Verificar `application_id` confere com a app registrada

### 4.3 `GET /api/billing/subscription`

Retorna estado da assinatura do usuário logado.

**Response:**
```json
{
  "plan": "PRO",
  "status": "ACTIVE",
  "currentPeriodEnd": "2026-06-06T00:00:00Z",
  "cancelAtPeriodEnd": false,
  "lastPayment": {
    "amount": 3900,
    "status": "approved",
    "date": "2026-05-06T00:00:00Z"
  }
}
```

### 4.4 `POST /api/billing/cancel`

Cancela assinatura no MP e no DB local.

**Lógica:**
1. Buscar subscription ativa do usuário
2. Chamar MP API para cancelar (`/preapproval/{id}` com status=cancelled)
3. Setar `cancelAtPeriodEnd = true` no DB
4. Manter acesso até `currentPeriodEnd`

### 4.5 `POST /api/billing/upgrade`

Faz upgrade de PRO → TEAM.

**Lógica:**
1. Cancelar subscription PRO no MP
2. Criar nova subscription TEAM
3. Atualizar `user.plan` imediatamente
4. Cobrar proporcional (via MP ou próximo ciclo)

---

## 5. Páginas Frontend

### 5.1 `/[locale]/pricing` — Página de Preços (Pública)

- Tabela comparativa dos 3 planos
- Recursos de cada plano (buscar de `src/lib/plans.ts`)
- Botões "Assinar" → redireciona para `/[locale]/billing/upgrade` (logado) ou `/login` (não logado)

### 5.2 `/[locale]/billing/upgrade` — Checkout (Autenticado)

- Seleção de plano (PRO / TEAM)
- Botão "Assinar com Mercado Pago" → chama `POST /api/billing/checkout` → redireciona para URL do MP
- Aviso de período de teste (se configurado)

### 5.3 `/[locale]/billing/manage` — Gerenciar Assinatura (Autenticado)

- Status atual da assinatura
- Plano ativo, próxima cobrança, valor
- Histórico de pagamentos (tabela)
- Botão "Cancelar assinatura"
- Botão "Fazer upgrade" (se FREE ou PRO)

### 5.4 `/[locale]/billing/success` — Confirmação

- Página de sucesso após retorno do Mercado Pago
- Link para dashboard

### 5.5 `/[locale]/billing/error` — Erro

- Página de erro se checkout falhar
- Link para tentar novamente

---

## 6. Componentes

### 6.1 `PlanCard` — Card de Plano na Página de Preços

```tsx
<PlanCard
  name="Pro"
  price="R$ 39/mês"
  features={["20 projetos", "100 docs/projeto", "5 membros", "5 GB storage", "Export PDF/JSON/CSV"]}
  current={false}
  onSubscribe={() => router.push("/billing/upgrade?plan=PRO")}
/>
```

### 6.2 `SubscriptionStatus` — Status no Dashboard

- Badge colorido com status (Active/Past Due/Cancelled)
- Data de renovação
- Link para gerenciar

### 6.3 `PaymentHistory` — Tabela de Pagamentos

| Data | Valor | Método | Status | Recibo |
|---|---|---|---|---|
| 06/05/2026 | R$ 39,00 | •••• 4242 | Aprovado | Download |

---

## 7. Fluxo Completo

### 7.1 Upgrade (FREE → PRO/TEAM)

```
1. Usuário clica "Assinar" na pricing page
2. Seleciona plano (PRO ou TEAM)
3. Redirecionado para checkout do Mercado Pago
4. Insere dados do cartão
5. MP processa → callback webhook `/api/webhooks/mercadopago`
6. Webhook cria Subscription + Payment no DB
7. Webhook atualiza user.plan
8. Usuário redirecionado para /billing/success
9. Acesso aos novos recursos liberado imediatamente
```

### 7.2 Renovação Mensal

```
1. MP cobra automaticamente o cartão
2. Webhook recebe evento payment.updated (approved)
3. Payment criado no DB
4. currentPeriodStart/End atualizados
5. Se falhar: status → PAST_DUE, notificar usuário por email
```

### 7.3 Cancelamento

```
1. Usuário clica "Cancelar" em /billing/manage
2. Confirma cancelamento
3. POST /api/billing/cancel → cancela no MP
4. cancelAtPeriodEnd = true
5. Usuário mantém acesso até currentPeriodEnd
6. Webhook recebe cancelled → status → CANCELLED
7. user.plan → FREE (downgrade automático)
```

---

## 8. Dependências

```json
{
  "dependencies": {
    "mercadopago": "^2.0.0"
  }
}
```

---

## 9. Lib de Integração (`src/lib/mercadopago.ts`)

```ts
import { MercadoPagoConfig, PreApproval, Payment, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
});

// Criar subscription
export async function createSubscription(userId: string, plan: "PRO" | "TEAM") {
  const planId = plan === "PRO"
    ? process.env.MERCADO_PAGO_PLAN_ID_PRO
    : process.env.MERCADO_PAGO_PLAN_ID_TEAM;

  const preapproval = new PreApproval(client);
  return preapproval.create({
    body: {
      preapproval_plan_id: planId,
      payer_email: userEmail,
      reason: `Assinatura Trama ${plan}`,
      external_reference: userId,
    },
  });
}

// Cancelar subscription
export async function cancelSubscription(mercadoPagoId: string) {
  const preapproval = new PreApproval(client);
  return preapproval.update({
    id: mercadoPagoId,
    body: { status: "cancelled" },
  });
}

// Buscar pagamento
export async function getPayment(paymentId: string) {
  const payment = new Payment(client);
  return payment.get({ id: paymentId });
}
```

---

## 10. Arquivos a Criar/Modificar

### Criar
| Arquivo | Descrição |
|---|---|
| `prisma/migrations/XXXX_add_subscriptions/` | Migration para novos models |
| `src/lib/mercadopago.ts` | Cliente MP + helpers |
| `src/app/api/billing/checkout/route.ts` | Criar checkout |
| `src/app/api/billing/subscription/route.ts` | Status da assinatura |
| `src/app/api/billing/cancel/route.ts` | Cancelar assinatura |
| `src/app/api/billing/upgrade/route.ts` | Upgrade de plano |
| `src/app/api/webhooks/mercadopago/route.ts` | Webhook handler |
| `src/app/[locale]/pricing/page.tsx` | Página de preços |
| `src/app/[locale]/billing/upgrade/page.tsx` | Página de checkout |
| `src/app/[locale]/billing/manage/page.tsx` | Gerenciar assinatura |
| `src/app/[locale]/billing/success/page.tsx` | Sucesso |
| `src/app/[locale]/billing/error/page.tsx` | Erro |
| `src/components/billing/PlanCard.tsx` | Card de plano |
| `src/components/billing/SubscriptionStatus.tsx` | Badge de status |
| `src/components/billing/PaymentHistory.tsx` | Histórico pagamentos |

### Modificar
| Arquivo | Mudança |
|---|---|
| `prisma/schema.prisma` | Adicionar models Subscription, Payment, enum SubscriptionStatus |
| `.env.example` | Adicionar variáveis do Mercado Pago |
| `src/lib/plans.ts` | Remover preços hardcoded (ou manter só como fallback) |
| `src/lib/auth.ts` | Adicionar subscription info no JWT/session |
| `src/components/landing/HeroSection.tsx` | Remover "Sem plano pago nem cartao" |
| `src/components/DashboardClient.tsx` | Trocar link de upgrade → `/billing/upgrade` |
| `src/app/[locale]/convite/[token]/page.tsx` | Integrar com checkout real |

---

## 11. Security Checklist

- [ ] Validar assinatura do webhook (`x-signature`)
- [ ] Idempotência nos webhooks (evitar duplicação de Payment)
- [ ] Rate limiting nas rotas de billing
- [ ] Não expor `ACCESS_TOKEN` no client-side
- [ ] `PUBLIC_KEY` exposta apenas no frontend (OK pelo design do MP)
- [ ] Validar `external_reference` confere com userId autenticado
- [ ] Logs de auditoria para todas as mudanças de plano

---

## 12. Testes

| Tipo | Cenário |
|---|---|
| Unit | `createSubscription()` gera payload correto |
| Unit | `cancelSubscription()` chama MP API |
| Integration | Webhook processa `subscription.preapproval.authorized` |
| Integration | Webhook processa `payment.updated` com status=approved |
| Integration | Webhook processa `payment.updated` com status=rejected |
| E2E | Fluxo completo: FREE → checkout → webhook → PRO |
| E2E | Cancelamento e downgrade para FREE |
| E2E | Upgrade PRO → TEAM |
| E2E | Tentativa de subscription duplicada |

---

## 13. Ordem de Implementação Sugerida

1. **Schema + Migration** — Subscription, Payment, enum
2. **Setup Mercado Pago** — Criar planos no painel, obter credenciais
3. **Lib `mercadopago.ts`** — Client + helpers
4. **Webhook** — `/api/webhooks/mercadopago` (fundamental para tudo funcionar)
5. **Checkout API** — `/api/billing/checkout`
6. **Pricing page** — `/pricing`
7. **Billing pages** — upgrade, manage, success, error
8. **Componentes** — PlanCard, SubscriptionStatus, PaymentHistory
9. **Cancelar assinatura** — `/api/billing/cancel`
10. **Upgrade** — `/api/billing/upgrade`
11. **Tests** — Unit + Integration + E2E
12. **Cleanup** — Remover textos "sem plano pago" do landing
