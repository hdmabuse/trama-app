# SPEC - TRAMA
## Software de Análise Qualitativa para Times de UX/Produto

---

**Versão:** 1.0
**Data:** Abril 2026
**Status:** Rascunho para Validação
**Confidentialidade:** Interna

---

# 1. Visão do Produto

## 1.1 Propósito

TRAMA é um software web de análise de dados qualitativos simplificado, projetado para times pequeños de UX e Produto que precisam de uma ferramenta acessível para codificar, categorizar e extrair insights de dados textuais sem a complexidade de soluções enterprise como ATLAS.ti ou NVivo.

## 1.2 Problema

Times de UX/Produto enfrentam:
- **Custo alto**: ATLAS.ti professional custa centenas de euros/ano
- **Curva de aprendizado longa**: ferramentas enterprise exigem treinamento extenso
- **Funcionalidades excessivas**: 80% dos recursos não são utilizados
- **Fluxo de trabalho offline**: software desktop não facilita colaboração async

## 1.3 Solução

Uma ferramenta web-first com:
- Interface intuitiva (< 15 min de onboarding)
- Análise manual eficiente
-zero IA - todos os processos são realizados pelo usuário"
- Colaboração em tempo real
- Preço extremamente acessível (VPS barato)

## 1.4 Diferenciais Competitivos

| Característica | ATLAS.ti | TRAMA |
|---------------|---------|------------------|
| Plataforma | Desktop | Web + PWA |
| Onboarding | 4-8h | < 15 min |
| Preço/ano | €300-900 | R$ 200-400 |
| IA | Limitada | Nativa |
| Colaboração | Básica | Tempo real |

---

# 2. Funcionalidades do Produto

## 2.1 Matriz de Funcionalidades

| # | Funcionalidade | Prioridade | Fase | Complexidade |
|---|--------------|-----------|------|-------------|
| F1 | Autenticação e Profil | Must | 1 | Baixa |
| F2 | Gestão de Projetos | Must | 1 | Baixa |
| F3 | Upload de Documentos | Must | 1 | Média |
| F4 | Leitor de Texto | Must | 1 | Média |
| F5 | Sistema de Códigos | Must | 1 | Média |
| F6 | Codificação Manual | Must | 1 | Média |
| F7 | Busca Avançada | Should | 2 | Média |
| F8 | Filtros e Tags | Could | 2 | Baixa |
| F9 | Dashboard Analytics | Could | 4 | Média |
| F10 | Convite de Membros | Should | 3 | Baixa |
| F11 | Comentários | Could | 3 | Média |
| F12 | Exportação de Relatórios | Should | 4 | Média |
| F13 | Visualização - Word Cloud | Could | 4 | Média |
| F14 | Visualização - Matriz | Could | 4 | Alta |

## 2.2 Funcionalidades Detalhadas

### F1 - Autenticação e Perfil
- Cadastro por email/senha
- Login social (Google, GitHub)
- Recuperação de senha
- Perfil: nome, email, avatar, preferências de interface

### F2 - Gestão de Projetos
- Criar projeto (nome, descrição, cor)
- Editar projeto
- Excluir projeto
- Listar projetos (grid/list)
- Métricas por projeto: documentos, códigos, progresso

### F3 - Upload de Documentos
- Tipos suportados: TXT, PDF, DOCX, Markdown
- Limite por arquivo: 10MB
- Limite por projeto: 100 arquivos, 100MB
- Arrastar e soltar (drag & drop)
- Upload em lote (batch)

### F4 - Leitor de Texto
- Renderização de texto formatado
- Destaque de trechos codificados
- Scroll sincronizado com códigos
- Zoom de texto
- Busca dentro do documento
- Contador de palavras

### F5 - Sistema de Códigos
- Criar código: nome, cor, descrição
- Editar código
- Excluir código
- Códigos hierárquicos (pai/filho)
- Buscar códigos
- Estatísticas por código (quantidade de aplicações)

### F6 - Codificação Manual
- Selecionar texto via mouse
- Atribuir um ou mais códigos
- Adicionar memo (anotação) ao trecho
- Editar codificação
- Remover codificação
- Navegar entre codificações

### F7 - IA Sugestão de Códigos
- Analisa o conteúdo do documento
- Sugere códigos relevantes
- Pontuação de confiança (0-100%)
- Aceitar/rejeitar sugestões em bulk

### F8 - IA Resumo Automático
- Gera resumo executive do documento
- Extração de pontos principais
- Identificação de entidades mencionadas
- Sentimento geral do texto

### F9 - IA Extração de Insights
- Identifica temas recorrentes
- Detecta padrões de comportamento
- Sugere relações entre códigos
- Gera perguntas de acompanhamento

### F10 - Convite de Membros
- Convite por email
- Roles: Owner, Editor, Viewer
- Aceitar/recusar convite
- Listar membros
- Remover membro

### F11 - Comentários
- Comentário em trechos codificados
- Respostas a comentários
- @menção de membros
- Resolução de comentários

### F12 - Exportação
- Relatório em PDF
- Relatório em Markdown
- Dados em JSON (para backup)
- Códigos em CSV

### F13 - Word Cloud
- Palavras mais frequentes
- Filtrar por código
- Remover stopwords

### F14 - Matriz Código-Documento
- Grid código vs documento
- Contagem de codificações
- Visualização de relacionamentos

---

# 3. Arquitetura do Sistema

## 3.1 Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  Next.js  │  │  React   │  │TypeScript│  │shadcn/ui│ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                        API GATEWAY                              │
│                    Next.js API Routes                          │
├─────────────────────────────────────────────────────────────────┤
│                        BACKEND                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐      │
│  │ Auth     │  │Projects  │  │Documents │  │ IA API  │      │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘      │
├─────────────────────────────────────────────────────────────────┤
│                        DATA LAYER                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │PostgreSQL │  │ Prisma    │  │UploadThing│                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
├─────────────────────────────────────────────────────────────────┤
│                        EXTERNAL APIS                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ OpenAI   │  │   S3     │  │  Email   │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

## 3.2 Tech Stack Detalhado (Zero IA, Economia Máxima)

### Frontend
| Tecnologia | Versão | Justificativa |
|-------------|--------|---------------|
| Next.js | 14+ | App Router, Server Components |
| React | 18+ | Hooks, Concurrent features |
| TypeScript | 5+ | Type safety |
| Tailwind CSS | 3+ | Utility-first styling |
| shadcn/ui | latest | Componentes Accessíveis |
| Zustand | 4+ | State management leve |
| React Query | 5+ | Data fetching, caching |

### Backend
| Tecnologia | Versão | Justificativa |
|-------------|--------|---------------|
| Next.js | 14+ | API Routes (mesma instância) |
| Prisma | 5+ | ORM type-safe |
| NextAuth.js | 5+ | Autenticação |
| Zod | 3+ | Validação de schemas |

### Database
| Tecnologia | Justificativa |
|-------------|----------------|
| PostgreSQL |já Included no VPS |

### Infraestrutura (Barata!)
| Serviço | Uso | Custo |
|---------|-----|-------|
| VPS (DigitalOcean/Rackspace) | Servidor completo | $5-10/mês |
| Backups locais | Armazenamento local | $0 |
| Sem serviços externos | Tudo local | $0 |

### Custo Mensal Estimado

| Item | Custo |
|------|-------|
| VPS básico (1GB RAM, 25GB SSD) | $5-10/mês |
| PostgreSQL (incluído no VPS) | $0 |
| Armazenamento local | $0 |
| Domínio (opcional) | ~R$ 30/ano |
| **Total** | **R$ 30-50/mês** |

## 3.3 Estrutura de Dados

### Modelo ER (Entidades Principais)

```
┌────────────────┐       ┌────────────────┐
│      User      │       │     Project    │
├────────────────┤       ├────────────────┤
│ id             │◄──────│ ownerId        │
│ name           │       │ name           │
│ email          │       │ description    │
│ passwordHash   │       │ color          │
│ avatar         │       │ createdAt      │
│ createdAt      │       └────────┬───────┘
└────────┬───────┘                │
         │                       │
         │ 1:N                   │ 1:N
         ▼                       ▼
┌────────────────┐       ┌────────────────┐
│  ProjectMember │       │    Document    │
├────────────────┤       ├────────────────┤
│ userId         │       │ projectId       │
│ projectId      │       │ title          │
│ role          │       │ content        │
│ createdAt      │       │ type           │
└────────────────┘       │ fileUrl       │
                         │ wordCount     │
                         │ createdAt     │
                         └────────┬──────┘
                                  │ 1:N
                                  ▼
┌────────────────┐       ┌────────────────┐
│      Code       │       │    Coding      │
├────────────────┤       ├────────────────┤
│ id             │◄──────│ codeId         │
│ projectId      │       │ documentId     │
│ name           │       │ startOffset    │
│ color          │       │ endOffset     │
│ description    │       │ memo          │
│ parentId       │       │ createdAt     │
│ createdAt      │       └────────────────┘
└────────────────┘

┌────────────────┐
│     Insight    │ (gerado pela IA)
├────────────────┤
│ id             │
│ documentId     │
│ type           │
│ content        │
│ confidence     │
│ createdAt      │
└────────────────┘

┌────────────────┐
│   Comment      │
├────────────────┤
│ id             │
│ codingId       │
│ userId         │
│ content       │
│ resolved      │
│ createdAt     │
└────────────────┘
```

### Schema Prisma (Draft)

```prisma
// schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String   @id @default(cuid())
  name           String?
  email         String   @unique
  emailVerified DateTime?
  image         String?
  passwordHash  String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  projects      ProjectMember[]
  codings       Coding[]
  comments     Comment[]
}

model Project {
  id           String   @id @default(cuid())
  name         String
  description String?
  color       String   @default("#6366f1")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  owner        User     @relation(fields: [ownerId], references: [id])
  ownerId      String
  members     ProjectMember[]
  documents   Document[]
  codes       Code[]
}

model ProjectMember {
  id        String   @id @default(cuid())
  role      Role     @default(EDITOR)
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
  userId    String
  project  Project  @relation(fields: [projectId], references: [id])
  projectId String

  @@unique([userId, projectId])
}

model Document {
  id        String   @id @default(cuid())
  title     String
  content   String   @db.Text
  type      DocumentType
  fileUrl   String?
  wordCount Int      @default(0)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  project   Project   @relation(fields: [projectId], references: [id])
  projectId String

  codings   Coding[]
  insights Insight[]
}

model Code {
  id          String   @id @default(cuid())
  name        String
  color       String   @default("#6366f1")
  description String?
  createdAt   DateTime @default(now())

  project     Project  @relation(fields: [projectId], references: [id])
  projectId   String
  parent      Code?    @relation("CodeHierarchy", fields: [parentId], references: [id])
  parentId   String?
  children   Code[]   @relation("CodeHierarchy")

  codings    Coding[]
}

model Coding {
  id          String   @id @default(cuid())
  startOffset Int
  endOffset   Int
  memo        String?
  createdAt   DateTime @default(now())

  document   Document @relation(fields: [documentId], references: [id])
  documentId String
  code      Code     @relation(fields: [codeId], references: [id])
  codeId    String

  comments  Comment[]
}

model Insight {
  id         String      @id @default(cuid())
  type       InsightType
  content   String     @db.Text
  confidence Float     @default(1.0)
  createdAt  DateTime   @default(now())

  document  Document   @relation(fields: [documentId], references: [id])
  documentId String
}

model Comment {
  id        String   @id @default(cuid())
  content   String   @db.Text
  resolved Boolean  @default(false)
  createdAt DateTime @default(now())

  coding    Coding   @relation(fields: [codingId], references: [id])
  codingId  String
  author   User    @relation(fields: [authorId], references: [id])
  authorId String
}

enum Role {
  OWNER
  EDITOR
  VIEWER
}

enum DocumentType {
  TXT
  PDF
  DOCX
  MARKDOWN
}

enum InsightType {
  SUMMARY
  SENTIMENT
  THEMES
  SUGGESTIONS
}
```

---

# 4. Arquitetura do Sistema (Sem IA)

> **Nota**: Este projeto NÃO utiliza IA. Todos os processos são realizados manualmente pelo usuário. Esta decisão foi tomada para:
> - Eliminar custos de API de IA
> - Manter dados 100% locais e privados
> - Garantir controle total do usuário sobre a análise
> - Reduzir complexidade de infraestrutura

## 4.1 Funcionalidades de Análise Manual

O TRAMA foi desenhado **sem qualquer IA**. Todos os processos de análise são realizados manualmente pelo usuário, garantindo:

- **Custo zero** de API
- **100% privado** - dados nunca saem do servidor
- **Controle total** - usuário decide como analisar
- **Infraestrutura simples** - VPS básico é suficiente

### 4.1.1 Ferramentas de Análise Manual

O sistema oferece ferramentas para análise manual eficiente:

| Ferramenta | Descrição |
|------------|-----------|
| **Busca textual** | Buscar palavras em todos os documentos |
| **Filtros** | Filtrar por código, autor, data |
| **Estatísticas** | Contagem de códigos, distribuição |
| **Cross-documento** | Buscar padrões entre documentos |
| **Anotações** | Memos e notas do analista |
| **Marcação manual** | Destaque de trechos importantes |

### 4.1.2 Fluxo de Análise Manual

```
1. Upload de documentos
       │
       ▼
2. Leitura e familiarização
       │
       ▼
3. Criação de códigos (deductivo ou indutivo)
       │
       ▼
4. Codificação manual de trechos
       │
       ▼
5. Revisão e refinamento
       │
       ▼
6. Análise de padrões (estatísticas)
       │
       ▼
7. Exportação de relatório
```

### 4.1.3 Por Que Sem IA?

| Aspecto        | Antes (com IA)    | Agora (sem IA)     |
| -------------- | ----------------- | ------------------ |
| Custo API      | $50-200/mês       | $0                 |
| Complexidade   | Alta              | Baixa              |
| Dados          | Enviados para外部   | 100% locais        |
| Controle       | Limitado          | Total              |
| Infraestrutura | cara              | VPS $5-10/mês      |
| Confiabilidade | Depende do modelo | Depende do usuário |

---

## 4.2 Ferramentas de Análise Manual

Como o produto NÃO usa IA, todas as funcionalidades de análise são realizadas pelo usuário usando ferramentas integradas:

### 4.2.1 Busca Textual

Busca em todos os documentos do projeto:

```typescript
// Busca simples
const searchResults = await db.document.findMany({
  where: {
    projectId,
    content: { contains: searchTerm, mode: 'insensitive' }
  }
})
```

Suporta:
- Busca exata ("termo exato")
- Busca com wildcards (term*)
- Busca por múltiplos termos (OR)
- Busca em campos específicos (título, conteúdo, memo)

### 4.2.2 Estatísticas de Código

Contagem automática de codificações:

```json
{
  "codes": [
    { "name": "Frustração", "count": 23, "percentage": 34 },
    { "name": "Satisfação", "count": 18, "percentage": 26 },
    { "name": "Sugestão", "count": 12, "percentage": 18 }
  ],
  "total": 67
}
```

### 4.2.3 Cruzamento de Dados

Permite analisar relações entre códigos:

```json
{
  "crossTab": {
    "Entrevista1": { "Frustração": 5, "Satisfação": 2 },
    "Entrevista2": { "Frustração": 3, "Satisfação": 8 }
  }
}
```

### 4.2.4 Exportação

Todos os dados podem serExportados para:
- CSV (para Excel)
- JSON (backup)
- Markdown (relatório)
- PDF (relatório formatado)
    "existing": true,
    "reason": "Usuário menciona problemas recurrentes",
    "confidence": 85
  },
  {
    "code": "oportunidade-melhoria",
    "existing": false,
    "reason": "Sugestão explícita de melhoria",
    "confidence": 72
  }
]
```

### 4.2.5 Recursos Simples de Análise

Como não temos IA, oferecemos recursos que funcionam localmente:

| Recurso | Como Funciona |
|---------|----------------|
| **Navegação por códigos** | Clicar no código filtra documentos |
| **Timeline** | Ver progresso ao longo do tempo |
| **Comparação side-by-side** | 2 documentos em paralelo |
| **Highlighter** | Marcar manualmente trechos importantes |
| **Notas do analista** | Memos livres em cada documento |

## 4.3 Custo Real do Sistema

Como NÃO temos IA, o custo é extremamente baixo:

### Custos Operacionais

| Item | Custo |
|------|-------|
| VPS (DigitalOcean Droplet) | $5-10/mês |
| PostgreSQL (incluído) | $0 |
| Armazenamento (25GB) | $0 |
| Backups (manuais) | $0 |
| **Total/mês** | **$5-10** |

### Por Que Este Custo é Possível?

1. **Sem API de IA** - Não há chamadas externas
2. **Tudo local** - Banco de dados no mesmo servidor
3. **Sem serviços externos** - Sem S3, sem upload service
4. **Backend simples** - Next.js com API Routes
5. **Static deploy** - Next.js pode ser static quando não há server-side dynamic
|--------|------|-----|
| Chamas IA/dia | 10 | 100 |
| Tokens IA/mês | 50K | 500K |
| Cache | Não | Sim |

### Constitutional AI - Processo de Ajuste

Nossa constituição é aplicada através de um processo de **AI Feedback** (similar ao Constitutional AI da Anthropic):

```
┌─────────────────────────────────────────────────────────────────┐
│              PROCESSO CONSTITUTIONAL AI                          │
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│  │Prompt    │───►│  gerar   │───►│ Avaliar  │───►│ Ajustar  │ │
│  │+Stats   │    │output   │    │constit.  │    │output   │ │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘ │
│                      ▲                   │                        │
│                      │                   ▼                        │
│                   ┌────────────────────────────────────────┐   │
│                   │  CRITÉRIOS CONSTITUCIONAIS              │   │
│                   │  • Respeita dignid. do participante?   │   │
│                   │  • Está sendo honesto?                │   │
│                   │  • Confiança adequadamente indicated?  │   │
│                   │  • Não causa dano potencial?           │   │
│                   └────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### AI Feedback - Chain of Evaluation

Cada output da IA passa por uma avaliação constitucional antes de ser apresentado:

```typescript
// lib/ai/feedback-evaluation.ts

interface EvaluationCriteria {
  dignity: boolean      // Respeita participantes?
  honesty: boolean    // É verdadeiro/preciso?
  confidence: boolean // Indica confiança claramente?
  nonHarm: boolean   // Não causa dano?
}

export async function evaluateConstitutionally(
  output: AISuggestion,
  constitution: Constitution
): Promise<{
  approved: boolean
  criteria: EvaluationCriteria
  revisions?: string
}> {
  const evaluationPrompt = `
Você é um avaliador constitucional para análise qualitativa.
Avalie a seguinte sugestão da IA contra os princípios constitucionais:

SUGESTÃO: ${output.content}
CÓDIGO: ${output.code}
CONFIANÇA: ${output.confidence}%

PRINCÍPIOS:
1. Dignidade: O output respeita a dignidade dos participantes?
2. Honestidade: O output é verdadeiro e preciso?
3. Confiança: O nível de confiança é claro e justificado?
4. Não-Maleficência: O output pode causar dano se usado?

Retorne JSON:
{
  "approved": true/false,
  "criteria": {
    "dignity": true/false,
    "honesty": true/false,
    "confidence": true/false,
    "nonHarm": true/false
  },
  "revisions": "Se não aprovado, explique o que precisa ajustar"
}
`

  const evaluation = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: evaluationPrompt }],
    response_format: { type: 'json_object' }
  })

  return JSON.parse(evaluation.choices[0].message.content)
}
```

### Rate Limiting (API)

```typescript
// lib/rate-limit.ts

const limits = {
  free: { calls: 10, window: '24h' },
  pro: { calls: 100, window: '24h' }
}

export async function rateLimit(userId: string, plan: 'free' | 'pro') {
  const limit = limits[plan]
  const key = `ratelimit:${plan}:${userId}`
  
  const count = await redis.incr(key)
  if (count === 1) {
    await redis.expire(key, parseDuration(limit.window))
  }
  
  if (count > limit.calls) {
    throw new Error('Rate limit exceeded')
  }
}
```

## 4.4 Considerações de Segurança

### Dados do Usuário
- **Nunca** enviar dados brutos para IA sem consentimento
- Opção de desativar IA por projeto
- Dados são processados apenas para a análise específica

### API Keys
- Armazenar chaves em variáveis de ambiente
- Não expô-las no frontend
- Rotação de chaves trimestral

### LGPD/GDPR
- Usuário pode solicitar exclusão de dados
- Dados de IA não são usados para treinamento (por padrão)
- Política de privacidade clara

---

# 5. Interface do Usuário

# 5. Interface do Usuário

## 5.1 Design System

### Cores

| Nome | Hex | Uso |
|------|-----|-----|
| Primary | #6366f1 | Main actions, links |
| Primary Hover | #4f46e5 | Hover states |
| Secondary | #f1f5f9 | Backgrounds |
| Accent | #10b981 | Success, insights |
| Warning | #f59e0b | Alerts |
| Error | #ef4444 | Errors |
| Text Primary | #1e293b | Main text |
| Text Secondary | #64748b | Secondary text |
| Border | #e2e8f0 | Borders |

### Tipografia

| Elemento | Fonte | Tamanho | Peso |
|----------|-------|---------|------|
| H1 | Inter | 32px | 700 |
| H2 | Inter | 24px | 600 |
| H3 | Inter | 20px | 600 |
| Body | Inter | 16px | 400 |
| Small | Inter | 14px | 400 |
| Code | JetBrains Mono | 14px | 400 |

### Espaçamento

- Base: 4px
- xs: 4px | sm: 8px | md: 16px | lg: 24px | xl: 32px | 2xl: 48px

### Border Radius

- sm: 4px | md: 8px | lg: 12px | full: 9999px

## 5.2 Telas Principais

### T1 - Login/Cadastro
- Logo + tagline
- Formulário email/senha
- Botões sociais (Google, GitHub)
- Link "Esqueci senha"

### T2 - Dashboard
- Header: Logo, buscar, perfil
- Grid de projetos (cards)
- Card: Nome, descrição, métricas, membros
- Botão "Novo Projeto"
- Sidebar: Recent projects

### T3 - Projeto
- Header: Título, membros, config
- 3 colunas:
  - Esquerda: Documentos (lista)
  - Centro: Leitor de texto
  - Direita: Códigos + Estatísticas
- Toolbar: Buscar, filtrar, exportar

### T4 - Leitor de Texto
- Toolbar: Zoom, busca, paginação
- Texto codificado com highlights
- Popup de codificação ao selecionar
- Sidebar: Códigos aplicados

### T5 - Painel de Códigos
- Lista de códigos (árvore)
- Botão "Adicionar código"
- Stats por código
- Botão de busca/filtro

### T6 - Estatísticas
- Contagem de códigos
- Distribuição por documento
- Timeline de progresso

### T7 - Insights/Visualização
- Charts: Barras, Word cloud
- Matriz código-documento
- Export buttons

## 5.3 Fluxo de Usuário

```
Login
  │
  ▼
Dashboard ◄────────────────────────────┐
  │                                        │
  │ +Novo Projeto                          │
  ▼                                        │
Config Projeto ─► Upload Documentos       │
  │                                        │
  ▼                                        │
Leitor de Texto ◄── Selecionar documento  │
  │                                        │
  │ +Selecionar texto                      │
  ▼                                        │
Popup Codificação ◄── Atribuir código     │
  │                                        │
  │ +IA                                    │
  ▼                                        │
Sugestões IA ◄─────── Aceitar/rejeitar     │
  │                                        │
  │ +Concluir análise                     │
  ▼                                        │
Exportação ───────────────────────────────┘
```

## 5.4 Wireframes e Layouts Detalhados

### 5.4.1 Layout Base (Todas as Telas)

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER (56px)                                                    │
│ ┌──────┐ ┌─────────────────────────┐ ┌──────┐ ┌────────────┐   │
│ │ Logo │ │     Search (cmd+k)     │ │ Notif│ │  Avatar   │   │
│ └──────┘ └─────────────────────────┘ └──────┘ └────────────┘   │
├──────────┬──────────────────────────────────────────────────────┤
│ SIDEBAR  │                                                      │
│ (240px)  │                   MAIN CONTENT                       │
│          │                                                      │
│ Projects │                                                      │
│ ├─ Proj1 │                                                      │
│ ├─ Proj2 │                                                      │
│ └─ Proj3 │                                                      │
│          │                                                      │
│ ──────── │                                                      │
│ Settings │                                                      │
│ Help     │                                                      │
└──────────┴──────────────────────────────────────────────────────┘
```

**Decisões de Design:**
- **Header fixo**: Garante acesso rápido a busca global e perfil em qualquer momento
- **Sidebar colapsável**: Economiza espaço em telas menores; usuário pode recolher
- **Search central (cmd+k)**: Padrão reconhecido por desenvolvedores/pesquisadores; acesso rápido a tudo
- **Largura fixa sidebar**: Evita quebra de layout; facilita aprendizado mental

### 5.4.2 Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER: "Meus Projetos"           [+ Novo Projeto]            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ PROJETO A   │  │ PROJETO B   │  │ PROJETO C   │              │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │              │
│  │ │■Projeto │ │  │ │■Projeto │ │  │ │■Projeto │ │              │
│  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │              │
│  │             │  │             │  │             │              │
│  │ 5 docs     │  │ 12 docs     │  │ 3 docs      │              │
│  │ 23 códigos │  │ 45 códigos  │  │ 8 códigos   │              │
│  │ ████░░░░░  │  │ ████████░░  │  │ ██░░░░░░░░  │              │
│  │ 40% conclu │  │ 80% conclu  │  │ 20% conclu  │              │
│  │             │  │             │  │             │              │
│  │ 👤 João     │  │ 👤 Maria    │  │ 👤 Team    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                 │
│  [Ver todos os projetos →]                                     │
└─────────────────────────────────────────────────────────────────┘
```

**Decisões de Design:**
- **Grid responsivo**: 3 colunas desktop → 2 tablet → 1 mobile
- **Card como unidade**: Cada projeto é autocontido; informação scannável
- **Progress bar visual**: Incentiva continuidade; mostra status sem clicar
- **(owner) indicator**: Mostra quem é responsável; facilita assigning
- **Cores por projeto**: Identificação rápida; Personalização

### 5.4.3 Tela de Projeto (3 Colunas)

```
┌────────────┬─────────────────────────┬──────────────────────────┐
│ DOCUMENTOS │      LEITOR DE TEXTO    │      CÓDIGOS + IA        │
│            │                         │                          │
│ 🔍Buscar   │  ░░░░░░░░░░░░░░░░░░░░░░ │  CÓDIGOS                 │
│            │  ░░░░░░░░░░░░░░░░░░░░░░ │  ├─ Frustração  (5) 🔴  │
│ 📄 Transcr1 │░░░░░░░░░░░░░░░░░░░░░░░ │  ├─ Satisfação   (8) 🟢 │
│ 📄 Transcr2 │░░░░░░░░░░░░░░░░░░░░░░░ │  ├─ Sugestão    (3) 🔵  │
│ 📄 Transcr3 │░░░░░░░░░░░░░░░░░░░░░░░ │  └─ Dúvida       (2) 🟡 │
│ 📄 Survey1  │░░░░░░░░░░░░░░░░░░░░░░░ │                          │
│            │  [seleção highlight]     │  [+ Novo Código]          │
│ [+Upload]  │  ░░░░░░░░░░░░░░░░░░░░░░ │  ─────────────────────   │
│            │                         │                          │
│            │                         │  IA ASSISTANT            │
│            │                         │  ┌────────────────────┐  │
│            │                         │  │✨ Gerar Resumo     │  │
│            │                         │  │💡 Sugerir Códigos │  │
│            │                         │  │📊 Extrair Insights │  │
│            │                         │  └────────────────────┘  │
│            │                         │                          │
│ 25%        │                         │                          │
└────────────┴─────────────────────────┴──────────────────────────┘
```

**Decisões de Design:**
- **3 colunas fixas**: Layout padrão de análise qualitativa; dokumen-to-code visível simultaneamente
- **Larguras: 20% / 50% / 30%**: Leitor é protagonista; códigos e docs são referência
- **Ordenação documentos**: Por data upload; mais recente primeiro
- **Códigos em árvore**: Hierarquia visual; facilita encontrar código pai/filho
- **IA sempre visível mas discreta**: Prompts de ação clara; não intimida usuário
- **Seleção com highlight**: Feedback visual imediato; confirma ação do usuário

### 5.4.4 Popup de Codificação

```
┌─────────────────────────────────────────────────┐
│  "O aplicativo é muito lento"                  │
│                                                 │
│  Selecionados: 32 caracteres                   │
│  ─────────────────────────────────────────────  │
│                                                 │
│  Atribuir códigos:                              │
│  ┌──────────────────────────────────────────┐  │
│  │ 🔍 Buscar código...                     │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  Códigos sugeridos (IA):                       │
│  ┌────────────────────┐ ┌────────────────────┐ │
│  │ ☐ Frustração   85%│ │ ☐ Performance   72%│ │
│  └────────────────────┘ └────────────────────┘ │
│                                                 │
│  Códigos existentes:                           │
│  ☑ Frustração     🟢                           │
│  ☐ Satisfação     🔵                           │
│  ☐ Dúvida         🟡                           │
│                                                 │
│  ─────────────────────────────────────────────  │
│  Memo (opcional):                              │
│  ┌──────────────────────────────────────────┐  │
│  │                                          │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│            [Cancelar]  [Aplicar (1)]           │
└─────────────────────────────────────────────────┘
```

**Decisões de Design:**
- **Popup sobre o texto**: Mantém contexto visual; usuário vê o que está codificando
- **Sugestões IA em destaque**: Separação clara do que é sugestão vs. existente
- **Checkbox em vez de radio**: Permite múltiplos códigos; flexível
- **Memo opcional**: Não bloqueia fluxo; pode adicionar depois
- **Keyboard navigation**: Tab para navegar; Enter para confirmar; Esc para fechar

### 5.4.5 Painel de Resultados IA

```
┌─────────────────────────────────────────────────────────────────┐
│  🤖 Sugestões de Código                         [Processar]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Documento: "Transcrição Entrevista João - 15/03/2026"       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ☑ Frustração com performance                              ││
│  │    "O aplicativo fica travando quando abro muitos dados"││
│  │    Confiança: 85% | Trecho: linha 12-14                  ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ☐ Oportunidade de melhoria - UI                         ││
│  │    "Seria bom ter um modo escuro"                         ││
│  │    Confiança: 72% | Trecho: linha 28-29                  ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ☑ Necessidade de treinamento                              ││
│  │    "Precisei de ajuda para usar recursos avançados"       ││
│  │    Confiança: 91% | Trecho: linha 45-47                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│            [Rejeitar Todos]    [Aceitar Selecionados (2)]       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Decisões de Design:**
- **Um resultado por card**: Scannable; fácil rejeitar/aceitar individualmente
- **Trecho destacado**: Confirma contexto; evita erro de atribuição
- **Confidence claro**: Transparência constitucional; usuário decide relevância
- **Batch actions**: Eficiência; aceitar/rejeitar múltiplos de uma vez
- **Não destrói trabalho**: Códigos sugeridos não são aplicados automaticamente

## 5.5 Estados de Componentes

### 5.5.1 Estados do Documento

| Estado | Visual | Ação do Usuário |
|--------|--------|----------------|
| **Vazio** | Dashed border + "Arraste arquivos aqui" | Upload |
| **Processando** | Spinner + "Extraindo texto..." | Aguardar |
| **Pronto** | Texto normal + highlight codes | Ler/codificar |
| **Erro** | Vermelho + mensagem de erro | Retry/Upload novamente |
| **IA processando** | Pulsing border + "IA analisando..." | Aguardar |

### 5.5.2 Estados de Codificação

| Estado | Visual |
|--------|--------|
| **Selecionado** | Highlight azul claro |
| **Codificado** | Background com cor do código |
| **Hover** | Borda mais forte + cursor pointer |
| **Com memo** | Ícone 💬 appended ao código |

### 5.5.3 Estados de Loading

```
Skeleton Loading (Documentos):
┌──────────────────────────────────────┐
│ ████████████░░░░░░░░░░  60%          │
│ ████████████████░░░░░░  70%          │
│ ████████░░░░░░░░░░░░░░  40%          │
└──────────────────────────────────────┘

Spinner (IA):
┌──────────────────────┐
│      ╭─────╮         │
│      │    ╱│         │
│      ╰─────╯         │
│   Analisando...      │
└──────────────────────┘
```

## 5.6 Interações e Comportamentos

### 5.6.1 Atalhos de Teclado

| Atalho | Ação | Contexto |
|--------|------|----------|
| `Cmd/Ctrl + K` | Abrir busca global | Todas telas |
| `Cmd/Ctrl + N` | Novo código | Tela de projeto |
| `Cmd/Ctrl + Enter` | Aplicar codificação | Popup codificação |
| `Escape` | Fechar popup | Qualquer popup |
| `←/→` | Navegar documentos | Tela de projeto |
| `Cmd/Ctrl + E` | Exportar | Tela de projeto |
| `?` | Mostrar atalhos | Overlay |

### 5.6.2 Gestos Mobile

| Gesto | Ação |
|-------|------|
| Swipe left | Próximo documento |
| Swipe right | Documento anterior |
| Long press | Selecionar texto |
| Pinch | Zoom no texto |
| Double tap | Seleção rápida de palavra |

### 5.6.3 Drag & Drop

```
Zona de Upload:
┌─────────────────────────────────────────┐
│                                         │
│            ┌─────────────────┐         │
│            │   📁 ARQUIVOS    │         │
│            │  Arraste aqui    │         │
│            └─────────────────┘         │
│     ou    [Procurar arquivos]           │
│                                         │
└─────────────────────────────────────────┘

Zona ativa: Borda verde + background leve
Zona inativa: Borda cinza tracejada
```

### 5.6.4 Tooltips e Helpers

| Elemento | Trigger | Conteúdo |
|----------|---------|----------|
| Código | Hover | Nome + quantidade de aplicações |
| Botão Estatísticas | Hover | "Ver distribuição de códigos" |
| Membro | Hover | "Última atividade: 2h atrás" |

## 5.7 Edge Cases e Tratamento de Erros

### 5.7.1 Erros de Upload

| Cenário | Mensagem | Ação |
|---------|----------|------|
| Arquivo muito grande | "Arquivo excede 10MB. Tamanho atual: 15MB" | Suggest compress or split |
| Tipo não suportado | "Tipo .exe não suportado. Use: TXT, PDF, DOCX, MD" | Listar tipos válidos |
| Upload falhou | "Erro ao subir arquivo. Verifique sua conexão." | Retry button |
| Timeout | "Tempo limite excedido. Tente novamente." | Auto-retry 2x |
| Duplicado | "Este arquivo já existe no projeto. Sobrescrever?" | Sobrescrever/renomear |

### 5.7.2 Erros de Dados

| Cenário | Mensagem | Ação |
|---------|----------|------|
| Arquivo corrompido | "Não foi possível ler este arquivo." | Retry |
| Dados inválidos | "Formato não suportado." | Suggest formatos |
| Timeout | "Operação demorou demais. Tentar novamente?" | Retry |
| Resultado vazio | "Nenhum resultado encontrado." | Suggest ajuste |

### 5.7.3 Estados Vazios

| Tela | Conteúdo |
|------|----------|
| Sem projetos | "Nenhum projeto ainda. Crie seu primeiro projeto!" |
| Sem documentos | "Adicione documentos para começar a analisar." |
| Sem códigos | "Crie seu primeiro código." |
| Sem codificações | "Selecione texto e atribua códigos." |

### 5.7.4 Recoveries

```
Erro de rede:
┌────────────────────────────────────────┐
│ ⚠️ Você está offline                   │
│    Alterações serão salvas quando     │
│    você reconectar.                    │
│                            [Tentar agora]│
└────────────────────────────────────────┘

Perda de dados (browser close):
┌────────────────────────────────────────┐
│ 💾 Salvando...                         │
│    Seu trabalho está sendo salvo       │
│    automaticamente.                    │
└────────────────────────────────────────┘

Sessão expirada:
┌────────────────────────────────────────┐
│ 🔐 Sessão expirada                    │
│    [Continuar trabalhando]             │
└────────────────────────────────────────┘
```

## 5.8 Responsividade e Breakpoints

### 5.8.1 Breakpoints

```
Mobile:    < 640px   (1 coluna, hamburger menu)
Tablet:    640-1024px (2 colunas, sidebar colapsada)
Desktop:   1024-1440px (3 colunas completas)
Wide:      > 1440px  (3 colunas + área extra)
```

### 5.8.2 Adaptações por Breakpoint

| Componente | Desktop | Tablet | Mobile |
|------------|---------|--------|--------|
| Sidebar | Fixed 240px | Collapsed 64px | Drawer |
| Documentos | Lista 20% | Lista 25% | Bottom sheet |
| Códigos | Panel 30% | Panel 35% | Tab |
| IA Panel | Always visible | Collapsible | FAB button |
| Header | Full | Search icon | Hamburger |

### 5.8.3 Mobile-First Considerations

- **Touch targets**: Mínimo 44x44px
- **Font sizes**: Base 16px (não 14px)
- **Spacing**: Múltiplos de 8px
- **Scroll**: Native scroll, não custom
- **Forms**: Labels acima de inputs

## 5.9 Acessibilidade (WCAG 2.1 AA)

### 5.9.1 Requisitos Implementados

| Requisito | Implementação |
|-----------|---------------|
| **Contrast** | Ratio mínimo 4.5:1 para texto |
| **Focus indicators** | Outline visível em todos osInteractive elements |
| **Keyboard navigation** | Tab order lógico; focus visible |
| **Screen reader** | Labels em todos osinputs; ARIA onde necessário |
| **Alt text** | Imagens e ícones decorativos hidden |
| **Motion** | Respects prefers-reduced-motion |

### 5.9.2skip Links e Landmarks

```html
<body>
  <a href="#main" class="skip-link">Pular para conteúdo principal</a>
  <nav aria-label="Principal">...</nav>
  <main id="main" role="main">...</main>
  <aside aria-label="Códigos">...</aside>
</body>
```

### 5.9.3 Estados para Screen Readers

```typescript
// Exemplo de aria-labels dinâmicos
<button
  aria-label="Adicionar código"
  aria-describedby="code-hint"
>
  + Código
</button>
<span id="code-hint" class="sr-only">
  Abre formulário para criar novo código
</span>
```

## 5.10 Decisões de Design Resumidas

| Decisão | Razão |
|---------|-------|
| **3 colunas fixas** | Padrão da indústria QDA; contexto visual |
| **Cores por código** | Reconhecimento rápido; diferenciação visual |
| **IA como assistente** | Não intimida; mantém usuário no controle |
| **Confidence score** | Transparência constitucional; confiança calibrada |
| **Popup de codificação** | Mantém contexto; ação reversible |
| **Onboarding < 15min** | Reduz fricção; waktu implementasi cepat |
| **Web-first** | Colaboração async; sem install; acesso mobile |
| **Export simples** | Integração com workflow existente |
| **Rate limiting** | Controle de custos; fair use |

---

# 6. Critérios de Aceite

## 6.1 Funcionalidades MVP

- [ ] Usuário consegue se cadastrar e fazer login
- [ ] Usuário consegue criar um projeto
- [ ] Usuário consegue fazer upload de arquivo TXT
- [ ] Usuário consegue visualizar o conteúdo do arquivo
- [ ] Usuário consegue criar um código
- [ ] Usuário consegue codificar um trecho selecionando texto e atribuindo código
- [ ] Usuário consegue visualizar todos os códigos de um projeto
- [ ] Usuário consegue editar e excluir códigos e codificações

## 6.2 Funcionalidades IA

- [ ] Usuário consegue gerar resumo automático (sem呆stake > 30s)
- [ ] Usuário consegue ver sugestões de códigos da IA
- [ ] Usuário consegue aceitar/rejeitar sugestões em batch

## 6.3 Requisitos Não-Funcionais

| Requisito | Critério |
|-----------|----------|
| Performance | Tempo de resposta < 200ms (API) |
| Uptime | 99.5% availability |
| Segurança | Dados criptografados em trânsito (TLS) |
| Acessibilidade | WCAG 2.1 AA |
| Responsividade | Mobile-friendly (320px+) |

---

# 7. Roadmap

## Fase 1 - MVP (Semanas 1-6)

| Semana | Escopo |
|--------|--------|
| 1 | Setup projeto, auth, layout base |
| 2 | Autenticação completa, dashboard |
| 3 | Upload de documentos, leitor |
| 4 | Sistema de códigos, CRUD |
| 5 | Codificação manual |
| 6 | Testes, polish MVP |

**Entregável:** Produto mínimo funcional com fluxo completo de análise manual

## Fase 2 - IA (Semanas 7-10)

| Semana | Escopo |
|--------|--------|
| 7 | Arquitetura IA, integração OpenAI |
| 8 | Módulo sugestão de códigos |
| 9 | Módulo resumo automático |
| 10 | Otimização, testes |

**Entregável:** Features de IA funcionando com rate limiting

## Fase 3 - Colaboração (Semanas 11-14)

| Semana | Escopo |
|--------|--------|
| 11 | Convite de membros |
| 12 | Comentários |
| 13 | Permissions (owner/editor/viewer) |
| 14 | Notificações |

**Entregável:** Trabajo em equipe возможний

## Fase 4 - Visualização (Semanas 15-18)

| Semana | Escopo |
|--------|--------|
| 15 | Word cloud |
| 16 | Matriz código-documento |
| 17 | Exportação (PDF, Markdown) |
| 18 | Polish, testes |

**Entregável:** Relatórios e visualizações

---

# 8. Modelagem de Negócio

## 8.1 Planos

| Recurso            | Free       | Pro       | Team      |
| ------------------ | ---------- | --------- | --------- |
| Preço              | R$ 0       | R$ 39/mês | R$ 99/mês |
| Projetos           | 3          | 20        | Ilimitado |
| Documentos/projeto | 20         | 100       | 500       |
| Membros            | 1          | 5         | 20        |
| IA daily           | 10         | 100       | 500       |
| Suporte            | comunidade | email     | priority  |
| Exportação         | básico     | completo  | completo  |

## 8.2 Monetização

- **Freemium**: Free para indivíduos, Pro para pequenas equipes
- **Self-serve**: Cadastro e pagamento inline
- **Teams**: Licenças customizadas via contato

---

# 9. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Custos IA muito altos | Alta | Alto | Rate limiting, caching, modelo optimized |
| Concurrência | Média | Alto | Foco em UX, IA nativa |
| LGPD/GDPR | Média | Alto | Privacy by design, DPA |
| Abandono usuário | Alta | Médio | Onboarding otimizado, tutoriais |
| Escalabilidade | Média | Médio | Arquitetura serverless |

---

# 10. Métricas de Produto

## 10.1 Métricas de Negócio

| Métrica | Meta (Mês 3) |
|---------|---------------|
| Usuários ativos | 500 |
| MRR | R$ 10.000 |
| Churn | < 5% |
| NPS | > 50 |

## 10.2 Métricas de Produto

| Métrica | Meta |
|---------|------|
| Tempo para primeiro código | < 5 min |
| Taxa de uso de IA | > 50% |
| Codificações por documento | > 10 |
| Exportações realizadas | > 100/mês |

---

# 11. Competidores e Análise de Mercado

## 11.1 Concorrentes Diretos

| Produto | Preço | Pontos Fortes | Pontos Fracos |
|---------|------|--------------|--------------|
| ATLAS.ti | €300+/ano | Enterprise, reputable | Caro, desktop-only |
| NVivo | $299+ |强大 recursos | Caro, complexo |
| Dovetail | $99/mês | Moderno | Caro para times |
| Taguify | €20/mês | Acessível | Poucos features |

## 11.2 Oportunidade

- Mercado副无 solução web-native acessível com IA nativa
- Preço: entre Dovetail e opções gratuitas
- Foco em UX simplificado

---

# 12. Anexos

## A. Glossário

| Termo | Definição |
|-------|-----------|
| Codificação | Processo de atribuir códigos a trechos de texto |
| Código | Rótulo/categoria para organizar dados |
| Insight | Conhecimento extraído automaticamente |
| Chunk | Trecho de texto processado pela IA |
| Confidence | Pontuação de confiança da sugestão |

## B. Referências

- ATLAS.ti Official: atlasti.com
- Agent Skills Spec: dev.opencode.ai/docs/skills
- Prisma Schema: prisma.io
- shadcn/ui: ui.shadcn.com

---

*Documento para validação inicial - sujeito a iteraciones*