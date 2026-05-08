/**
 * app/epistemologia/page.tsx
 * Página de epistemologia com o Posicionamento Epistemológico do TRAMA.
 */

import type { Metadata } from 'next'
import { PoliticalSection } from '@/components/landing/PoliticalSection'

export const metadata: Metadata = {
  title: 'Construção do Conhecimento — TRAMA',
  description:
    'Posicionamento epistemológico do TRAMA. Por que codificar dados qualitativos é um ato político?',
  openGraph: {
    title: 'Construção do Conhecimento — TRAMA',
    description:
      'O ato de nomear um dado qualitativo nunca é neutro — é sempre o exercício de uma perspectiva histórica e socialmente localizada.',
    type: 'website',
    url: 'https://trama.app.br/epistemologia',
  },
  alternates: {
    canonical: 'https://trama.app.br/epistemologia',
  },
}

export default function EpistemologiaPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <PoliticalSection />
    </main>
  )
}
