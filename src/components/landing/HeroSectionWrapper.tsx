'use client'

import { useHeroVariant } from '@/lib/useHeroVariant'
import { HeroSection } from './HeroSection'

export function HeroSectionWrapper() {
  const variant = useHeroVariant()
  return <HeroSection variant={variant} />
}
