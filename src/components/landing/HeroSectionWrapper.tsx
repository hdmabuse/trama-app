'use client'

import { HeroSection } from './HeroSection'
import { useHeroVariant } from '@/lib/useHeroVariant'

/**
 * HeroSectionWrapper
 *
 * Client component que resolve o variant A/B e passa para HeroSection.
 * Separado para permitir que a página seja um Server Component
 * (metadata, SSG) enquanto apenas este wrapper é client.
 */
export function HeroSectionWrapper() {
  const variant = useHeroVariant()
  return <HeroSection variant={variant} />
}
