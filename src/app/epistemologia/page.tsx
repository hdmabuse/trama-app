/**
 * app/epistemologia/page.tsx
 * Publica o artigo "Codificar é Interpretar" como conteúdo do produto.
 *
 * SEO: indexável, com JSON-LD SchemaOrg Article.
 * UX:  tipografia de leitura longa, barra de progresso, sticky CTA.
 */

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ArticleContent } from '@/components/landing/ArticleContent'
import { ReadingProgressBar } from '@/components/ui/ReadingProgressBar'
import { StickyArticleCTA } from '@/components/ui/StickyArticleCTA'

export const metadata: Metadata = {
  title: 'Codificar é Interpretar — TRAMA',
  description:
    'Por que codificar dados qualitativos é um ato político? Argumentação em Braun & Clarke (2006/2019), Haraway (1988) e Vieira Pinto (1960/2005).',
  openGraph: {
    title: 'Codificar é Interpretar: Análise Temática, Saberes Situados e Consciência Crítica',
    description:
      'O ato de nomear um dado qualitativo nunca é neutro — é sempre o exercício de uma perspectiva histórica e socialmente localizada.',
    type: 'article',
    publishedTime: '2026-04-01',
    authors: ['José Carlos Porto Arcoverde Jr.'],
    url: 'https://trama.app.br/epistemologia',
  },
  alternates: {
    canonical: 'https://trama.app.br/epistemologia',
  },
}

// ─── JSON-LD SchemaOrg ───────────────────────────────────────────────────────

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ScholarlyArticle',
  headline: 'Codificar é Interpretar: Análise Temática, Saberes Situados e Consciência Crítica como Fundamentos Epistemológicos da Pesquisa Qualitativa Situada no Brasil',
  author: {
    '@type': 'Person',
    name: 'José Carlos Porto Arcoverde Jr.',
    affiliation: {
      '@type': 'Organization',
      name: 'CESAR School / Instituto Fab Lab Rec',
    },
  },
  datePublished: '2026-04-01',
  inLanguage: 'pt-BR',
  publisher: {
    '@type': 'Organization',
    name: 'TRAMA',
    url: 'https://trama.app.br',
  },
  description:
    'Este artigo argumenta que o ato de codificar dados qualitativos não é um procedimento técnico neutro, mas uma prática interpretativa constitutivamente política.',
  citation: [
    {
      '@type': 'ScholarlyArticle',
      name: 'Using thematic analysis in psychology',
      author: [{ '@type': 'Person', name: 'Virginia Braun' }, { '@type': 'Person', name: 'Victoria Clarke' }],
      datePublished: '2006',
      identifier: 'https://doi.org/10.1191/1478088706qp063oa',
    },
    {
      '@type': 'ScholarlyArticle',
      name: 'Situated Knowledges',
      author: [{ '@type': 'Person', name: 'Donna Haraway' }],
      datePublished: '1988',
      identifier: 'https://doi.org/10.2307/3178066',
    },
  ],
}

// ─── Página ──────────────────────────────────────────────────────────────────

export default function EpistemologiaPage() {
  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      {/* Barra de progresso de leitura (client) */}
      <Suspense fallback={null}>
        <ReadingProgressBar />
      </Suspense>

      <main className="min-h-screen bg-white dark:bg-neutral-950">

        {/* Cabeçalho do artigo */}
        <header className="max-w-2xl mx-auto px-6 pt-20 pb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-teal-600 dark:text-teal-400 mb-4">
            Artigo · Epistemologia
          </p>
          <h1 className="
            text-2xl md:text-3xl font-medium leading-[1.3]
            text-neutral-900 dark:text-white mb-5
          ">
            Codificar é Interpretar
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
            Análise Temática, Saberes Situados e Consciência Crítica como<br />
            Fundamentos Epistemológicos da Pesquisa Qualitativa Situada no Brasil
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-neutral-400 dark:text-neutral-500">
            <span>José Carlos Porto Arcoverde Jr.</span>
            <span>·</span>
            <span>CESAR School / Fab Lab Recife</span>
            <span>·</span>
            <span>Abril 2026</span>
            <span>·</span>
            <span>~18 min de leitura</span>
          </div>
        </header>

        {/* Conteúdo do artigo */}
        <Suspense fallback={<ArticleSkeleton />}>
          <ArticleContent />
        </Suspense>

        {/* Rodapé */}
        <footer className="max-w-2xl mx-auto px-6 py-16 border-t border-neutral-100 dark:border-neutral-800 mt-10">
          <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center mb-6">
            Instituto Fab Lab Rec / CESAR School — Recife, PE — Abril 2026
          </p>
          <div className="flex justify-center">
            <a
              href="https://trama.app.br"
              className="
                px-6 py-2.5 text-sm font-medium
                bg-teal-600 text-white rounded-lg
                hover:bg-teal-700 transition-colors
              "
            >
              Usar o TRAMA gratuitamente →
            </a>
          </div>
        </footer>
      </main>

      {/* Sticky CTA — aparece após 60% de scroll (client) */}
      <Suspense fallback={null}>
        <StickyArticleCTA />
      </Suspense>
    </>
  )
}

// ─── Skeleton de loading ─────────────────────────────────────────────────────

function ArticleSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-4 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded"
          style={{ width: `${70 + Math.random() * 30}%` }}
        />
      ))}
    </div>
  )
}
