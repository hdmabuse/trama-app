# trama

**Pesquisa qualitativa que se compõe.**

Software web de análise de dados qualitativos para times de UX e Produto. Codifique, categorize e extraia insights de transcrições, notas de campo e surveys — sem IA, sem dependências externas, sem envio de dados a terceiros.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

---

## O que é

TRAMA é uma alternativa web-first, leve e acessível a ferramentas como ATLAS.ti e NVivo. Foi projetado para pesquisadores que precisam de uma ferramenta de análise qualitativa sem a complexidade e o custo de soluções enterprise.

O sistema opera sem IA: todos os processos analíticos são conduzidos manualmente pelo pesquisador, garantindo controle total sobre a interpretação dos dados e privacidade absoluta.

## Por que mais um QDA?

| | ATLAS.ti | NVivo | Taguette | QualCoder | **TRAMA** |
|---|---|---|---|---|---|
| Plataforma | Desktop | Desktop | Web | Desktop | **Web + PWA** |
| Colaboração | Básica | Limitada | Não | Não | **Tempo real** |
| Temas | Sim | Sim | Não | Não | **Sim** |
| Upload mídia | Sim | Sim | Não | Sim | **Sim** |
| E2EE | Não | Não | Não | Não | **Planejado** |
| Preço/ano | €300+ | $299+ | Grátis | Grátis | **R$ 0-400** |
| Licença | Proprietária | Proprietária | AGPL | MIT | **AGPL-3.0** |

## Funcionalidades

- **Projetos** — crie projetos com nome, descrição e cor para organizar suas pesquisas
- **Documentos** — importe TXT, MD, PDF, DOCX ou cole texto diretamente
- **Áudio e vídeo** — faça upload de MP3, WAV, MP4, WebM com player integrado
- **Códigos** — crie códigos hierárquicos (pai/filho) com cores e descrições
- **Codificação** — selecione texto e atribua códigos com memo opcional
- **Temas** — agrupe códigos em temas analíticos (Braun & Clarke)
- **Filtro por tema** — filtre os highlights do leitor por tema
- **Busca** — busque termos em todos os documentos do projeto (⌘K)
- **Exportação** — exporte relatórios em PDF e Markdown com análise temática
- **Criação inline** — crie códigos diretamente no popup de codificação

## Quick Start

```bash
git clone https://github.com/seu-usuario/trama.git
cd trama
cp .env.example .env
docker compose up -d && npm install && npm run setup
npm run dev
```

Abra **http://localhost:3000** e faça login com:

| | |
|---|---|
| Email | `pesquisador@trama.app.br` |
| Senha | `trama2026` |

## Stack

Next.js 14 · TypeScript · Prisma · PostgreSQL · Tailwind CSS · NextAuth · jsPDF

## Deploy em VPS

O projeto inclui Dockerfile e docker-compose.prod.yml prontos para deploy. Consulte o [Guia de Instalação](GUIA-INSTALACAO.md) para instruções completas.

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## Roadmap

| Fase | Status | Escopo |
|---|---|---|
| 1 — MVP | ✅ Concluído | Auth, projetos, documentos, códigos, codificação |
| 2 — Temas | ✅ Concluído | Análise temática, busca, filtros, export |
| 3 — Colaboração | Planejado | Convites, roles, comentários |
| 4 — Visualização | Planejado | Matriz tema×doc, word cloud, dashboard |
| 5 — E2EE | Planejado | Criptografia de ponta-a-ponta |

## Licença

AGPL-3.0-or-later. Veja [LICENSE](LICENSE).

---

**trama.app.br**
