# Relatório de Análise do Repositório trama-app

**Data:** 2026-05-06
**Versão analisada:** 0.3.0

---

## Visão Geral

**TRAMA** é uma plataforma web open-source de análise qualitativa de dados (QDA), alternativa colaborativa ao ATLAS.ti e NVivo. Voltada para pesquisadores UX e equipes de produto para analisar transcrições, notas de campo e pesquisas.

- **Stack:** Next.js 14 (App Router) + TypeScript 5 + PostgreSQL 16 + Prisma 6
- **Auth:** NextAuth.js 4 (JWT + Credentials)
- **i18n:** next-intl (pt, en, es)
- **Billing:** Mercado Pago (assinaturas recorrentes)
- **Licença:** AGPL-3.0-or-later

---

## Pontos de Melhoria Identificados

### CRITICO

#### 1. Bypass na validação do webhook do Mercado Pago

- **Arquivo:** `src/app/api/webhooks/mercadopago/route.ts:16`
- **Problema:** A função `verifySignature` retornava `true` quando `MERCADO_PAGO_WEBHOOK_SECRET` não estava configurado, aceitando qualquer webhook como válido. Além disso, `verifySignature` nunca era chamada no handler `POST`.
- **Impacto:** Qualquer pessoa poderia enviar webhooks falsos e manipular assinaturas/pagamentos.
- **Status:** CORRIGIDO — `verifySignature` agora retorna `false` sem secret e é chamada no início do `POST`, retornando 401 para assinaturas inválidas.

#### 2. Bypass de autorização na exclusão de códigos

- **Arquivo:** `src/app/api/codigos/route.ts:70`
- **Problema:** `userCanAccessProject(session.user.id, id)` recebia o `id` do código em vez do `projectId` do projeto. A verificação de acesso era inútil.
- **Impacto:** Potencial bypass de controle de acesso na deleção de códigos.
- **Status:** CORRIGIDO — Removida a chamada desnecessária; a autorização agora se baseia diretamente em `code.project.ownerId`.

---

### ALTO

#### 3. `as any` espalhado pelo código de autenticação

- **Arquivos afetados:**
  - `src/components/Header.tsx:11`
  - `src/components/DashboardClient.tsx:54`
  - `src/app/[locale]/dashboard/page.tsx:13,38`
  - `src/app/[locale]/admin/layout.tsx:9`
  - `src/app/api/admin/usuarios/route.ts:8`
  - `src/app/api/upload/route.ts:96`
  - `src/app/api/admin/usuarios/[id]/route.ts:21`
  - `src/app/api/projetos/[id]/export/route.ts:28-29`
  - `src/app/api/user/locale/route.ts:20`
- **Problema:** Mesmo com tipos customizados em `next-auth.d.ts`, o código usa `(session?.user as any)` em ~10 locais, indicando que a tipagem do NextAuth não está sendo resolvida corretamente.
- **Recomendação:** Verificar a importação/configuração do módulo `next-auth` nos tipos customizados. Provavelmente falta um `import "next-auth"` ou a declaração de módulo não está sendo reconhecida pelo TypeScript.
- **Status:** Pendente

#### 4. Ausência de Error Boundaries

- **Problema:** Nenhum arquivo `error.tsx` encontrado nas rotas do App Router. Qualquer erro não tratado resulta em tela branca.
- **Recomendação:** Criar `error.tsx` pelo menos em `src/app/[locale]/error.tsx` e `src/app/[locale]/projeto/[id]/error.tsx`.
- **Status:** Pendente

#### 5. Validação de senha inconsistente no convite

- **Arquivo:** `src/app/api/convite/[token]/route.ts:24`
- **Problema:** A validação de senha no aceite de convite só exigia 8 caracteres, enquanto o registro normal exigia maiúscula + minúscula + número.
- **Impacto:** Usuários convidados podiam criar contas com senhas fracas.
- **Status:** CORRIGIDO — Agora usa `registerSchema.shape.password` do Zod, a mesma validação do registro.

---

### MEDIO

#### 6. Console.logs em código de produção

- **Quantidade:** 30+ chamadas de `console.log/error/warn`
- **Arquivos principais:**
  - `src/app/api/upload/route.ts:107`
  - `src/app/api/billing/checkout/route.ts:49`
  - `src/app/api/webhooks/mercadopago/route.ts:111,116`
  - `src/lib/email.ts:18,113,117,120`
  - `src/lib/activity.ts:16`
  - `src/components/Workspace.tsx` (10+ ocorrências)
  - `src/components/workspace/SearchModal.tsx:41`
  - `src/components/workspace/LinkedMemos.tsx:33`
  - `src/components/workspace/CodingPopup.tsx:44`
- **Recomendação:** Usar um logger estruturado (ex: pino) com níveis configuráveis por ambiente.
- **Status:** Pendente

#### 7. Vazamento de informação em mensagens de erro

- **Arquivo:** `src/app/api/upload/route.ts:108`
- **Problema:** `error: "Erro no upload: " + err.message` retorna detalhes internos do servidor na resposta HTTP.
- **Recomendação:** Retornar mensagem genérica e logar o erro internamente.
- **Status:** Pendente

#### 8. Non-null assertions em variáveis de ambiente

- **Arquivo:** `src/lib/mercadopago.ts:5,9,10`
- **Problema:** `process.env.MERCADO_PAGO_ACCESS_TOKEN!` sem fallback. Se a variável não existir, o erro será críptico.
- **Recomendação:** Validar variáveis de ambiente no startup da aplicação (ex: com Zod ou verificação manual).
- **Status:** Pendente

#### 9. Componentes monolíticos

- **Arquivos:**
  - `src/components/Workspace.tsx` (~23KB)
  - `src/components/DashboardClient.tsx` (~19KB)
- **Problema:** Componentes muito grandes dificultam manutenção e causam re-renders desnecessários.
- **Recomendação:** Decompor em componentes menores focados (ex: `DocumentPanel`, `CodingPanel`, `ProjectCard`).
- **Status:** Pendente

#### 10. Uploads armazenados no filesystem local

- **Problema:** Uploads vão para `/app/uploads`. Em ambiente com múltiplas instâncias ou serverless, isso não funciona.
- **Recomendação:** Considerar S3, R2 (Cloudflare), ou MinIO para armazenamento de arquivos.
- **Status:** Pendente

---

### BAIXO / BOAS PRATICAS

#### 11. Falta de testes

- **Problema:** Não havia nenhum teste no projeto.
- **Status:** CORRIGIDO — Vitest configurado com 71 testes cobrindo 8 API routes críticas:
  - `POST /api/auth/register` (7 testes)
  - `GET/POST /api/projetos` (6 testes)
  - `GET/PATCH/DELETE /api/projetos/[id]` (7 testes)
  - `GET/POST/DELETE /api/codigos` (8 testes)
  - `GET/POST/DELETE /api/codificacoes` (9 testes)
  - `POST /api/webhooks/mercadopago` (12 testes)
  - `GET/POST /api/convite/[token]` (9 testes)
  - `GET /api/admin/usuarios` (3 testes)

#### 12. Sem ESLint customizado nem Prettier

- **Problema:** Apenas `next lint` padrão. Sem `.eslintrc` customizado nem `.prettierrc`.
- **Recomendação:** Configurar ESLint com regras de projeto e Prettier para consistência de estilo.
- **Status:** Pendente

#### 13. Sem rate limiting nas API routes

- **Problema:** Nenhuma proteção contra abuso em endpoints como `/api/auth/register`, `/api/busca`, `/api/upload`.
- **Recomendação:** Adicionar middleware de rate limiting (ex: `next-rate-limit` ou Redis-based).
- **Status:** Pendente

#### 14. Comentários de BUG no código

- **Arquivo:** `src/components/Workspace.tsx:93,116,259`
- **Problema:** Comentários como `// ── BUG 1 FIX:` são artefatos de debug.
- **Recomendação:** Remover ou converter em comentários descritivos.
- **Status:** Pendente

#### 15. Prisma queries com tipo `any`

- **Arquivo:** `src/app/api/memorandos/route.ts:22`
- **Problema:** `const where: any = {...}` perde a segurança de tipos do Prisma.
- **Recomendação:** Usar `Prisma.DocumentWhereInput` ou equivalente.
- **Status:** Pendente

#### 16. Migrations vs `db push`

- **Problema:** O projeto usa `prisma db push` em produção (via `docker-entrypoint.sh`). Em produção, isso pode causar perda de dados.
- **Recomendação:** Usar `prisma migrate deploy` com migrations versionadas para controle de alterações.
- **Status:** Pendente

---

## Resumo de Prioridades

| Prioridade | Item | Esforço | Status |
|------------|------|---------|--------|
| P0 | Webhook bypass (MP) | Baixo | CORRIGIDO |
| P0 | Auth bypass em códigos | Baixo | CORRIGIDO |
| P1 | Validação de senha no convite | Baixo | CORRIGIDO |
| P1 | Adicionar testes | Alto | CORRIGIDO (71 testes) |
| P1 | Corrigir tipos NextAuth (eliminar `as any`) | Medio | Pendente |
| P1 | Adicionar Error Boundaries | Baixo | Pendente |
| P2 | Decompor componentes grandes | Medio | Pendente |
| P2 | Rate limiting | Medio | Pendente |
| P2 | Logger estruturado | Baixo | Pendente |
| P3 | Migrar para `prisma migrate` | Medio | Pendente |
| P3 | ESLint + Prettier | Baixo | Pendente |
| P3 | Remover console.logs | Baixo | Pendente |

---

## Estrutura do Projeto

```
trama-app/
├── prisma/
│   ├── schema.prisma          # 12 models + enums
│   ├── seed.ts                # Dados de demo
│   └── migrations/            # Migrations Prisma
├── src/
│   ├── middleware.ts           # i18n middleware
│   ├── types/next-auth.d.ts   # Tipos customizados NextAuth
│   ├── lib/
│   │   ├── db.ts              # Prisma singleton
│   │   ├── auth.ts            # NextAuth config (JWT + Credentials)
│   │   ├── validations.ts     # Schemas Zod
│   │   ├── ownership.ts       # Verificação de acesso
│   │   ├── plans.ts           # Limites e preços dos planos
│   │   ├── mercadopago.ts     # Integração Mercado Pago
│   │   ├── email.ts           # Templates de email (Resend)
│   │   ├── export.ts          # Export PDF/Markdown
│   │   ├── crypto.ts          # E2EE (futuro)
│   │   └── activity.ts        # Logs de atividade
│   ├── components/
│   │   ├── Workspace.tsx      # Interface principal de análise
│   │   ├── DashboardClient.tsx # Grid de projetos
│   │   ├── Header.tsx         # Navegação
│   │   ├── landing/           # Componentes da landing page
│   │   ├── workspace/         # Componentes de análise
│   │   └── ui/                # Componentes reutilizáveis
│   ├── app/
│   │   ├── api/               # 27 API routes
│   │   └── [locale]/          # Páginas com i18n
│   └── __tests__/             # Testes (Vitest)
│       ├── setup.ts           # Mocks globais
│       ├── helpers.ts         # Helpers de teste
│       └── api/               # Testes das API routes
├── messages/                  # Traduções (pt, en, es)
├── vitest.config.ts           # Configuração Vitest
├── next.config.js             # Next.js + i18n
├── tailwind.config.ts         # Tailwind customizado
├── Dockerfile                 # Multi-stage build
├── docker-compose.yml         # Dev (PostgreSQL)
└── docker-compose.prod.yml    # Produção (PostgreSQL + App)
```

---

## Modelos de Dados

| Model | Campos principais | Relações |
|-------|-------------------|----------|
| User | name, email, plan, isAdmin, isActive | projects, memberships, codings, subscriptions |
| Project | name, description, color, ownerId | documents, codes, themes, members |
| Document | title, content, type, projectId | codings |
| Code | name, color, projectId, parentId | codings, children (hierárquico) |
| Coding | startOffset, endOffset, selectedText, authorId | document, code, comments |
| Theme | name, description, color, projectId | themeCodes |
| Subscription | plan, status, mercadoPagoId, userId | payments |
| Payment | amount, status, mercadoPagoPaymentId | subscription |
| AdminInvite | email, plan, token, status, expiresAt | invitedBy |
| ActivityLog | action, resource, resourceId, userId | user |

### Planos

| Limite | FREE | PRO | TEAM |
|--------|------|-----|------|
| Projetos | 3 | 20 | Ilimitado |
| Docs/Projeto | 20 | 100 | 500 |
| Membros/Projeto | 1 | 5 | 20 |
| Storage | 500 MB | 5 GB | 20 GB |
| Exports | md | pdf, md, json, csv | pdf, md, json, csv |
| Preco | R$ 0 | R$ 39/mes | R$ 99/mes |
