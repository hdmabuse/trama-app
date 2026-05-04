/**
 * app/(landing)/page.tsx
 * Landing page do TRAMA — épicos 1 e 2 implementados
 *
 * Seções:
 *   1. HeroSection (Epic 1) — com A/B testing
 *   2. HowItWorks  — 4 steps animados
 *   3. PoliticalSection (Epic 2) — "Análise é Política"
 *   4. FinalCTA    — conversão final
 */

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { HeroSectionWrapper } from '@/components/landing/HeroSectionWrapper'
import { PoliticalSection } from '@/components/landing/PoliticalSection'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { FinalCTA } from '@/components/landing/FinalCTA'

export const metadata: Metadata = {
  title: 'TRAMA — Análise Qualitativa Reflexiva',
  description:
    'O dado não fala sozinho. Você fala por ele. Ferramenta de análise qualitativa sem IA, sem nuvem, em português. AGPL-3.0.',
  openGraph: {
    title: 'TRAMA — Análise Qualitativa Reflexiva',
    description:
      'Análise qualitativa em que você constrói o sentido. Sem IA. Sem nuvem. Em português.',
    url: 'https://trama.app.br',
    siteName: 'TRAMA',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function LandingPage() {
  return (
    <main>
      {/* Epic 1: Hero Section com A/B testing (client component) */}
      <Suspense fallback={<div className="min-h-screen" />}>
        <HeroSectionWrapper />
      </Suspense>

      {/* Como funciona — 4 steps */}
      <HowItWorks />

      {/* Epic 2: Sessão Política — posicionamento epistemológico */}
      <PoliticalSection />

      {/* CTA final */}
      <FinalCTA />
    </main>
  )
}
