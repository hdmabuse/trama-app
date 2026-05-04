/**
 * useHeroVariant — A/B testing para HeroSection
 *
 * Atribui variant A ou B de forma determinística por sessão.
 * Persiste em sessionStorage para que a mesma pessoa veja
 * a mesma variante durante toda a visita.
 *
 * Integração com PostHog para tracking de eventos.
 */

'use client'

import { useEffect, useState } from 'react'

export type HeroVariant = 'A' | 'B'

const STORAGE_KEY = 'trama_hero_variant'
const VARIANTS: HeroVariant[] = ['A', 'B']

function pickVariant(): HeroVariant {
  // 50/50 split
  return Math.random() < 0.5 ? 'A' : 'B'
}

export function useHeroVariant(): HeroVariant {
  const [variant, setVariant] = useState<HeroVariant>('A')

  useEffect(() => {
    // Verifica se já foi atribuída nesta sessão
    const stored = sessionStorage.getItem(STORAGE_KEY)

    if (stored && VARIANTS.includes(stored as HeroVariant)) {
      setVariant(stored as HeroVariant)
      return
    }

    const assigned = pickVariant()
    sessionStorage.setItem(STORAGE_KEY, assigned)
    setVariant(assigned)

    // Envia evento ao PostHog se disponível
    if (typeof window !== 'undefined' && (window as any).posthog) {
      ;(window as any).posthog.capture('hero_variant_assigned', {
        variant: assigned,
      })
    }
  }, [])

  return variant
}
