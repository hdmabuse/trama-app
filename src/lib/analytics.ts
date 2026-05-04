/**
 * analytics.ts — helpers de tracking para Épicos 1 e 2
 *
 * Usa PostHog se disponível, fallback silencioso se não.
 * Integrar no _app.tsx: posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY)
 */

type EventName =
  // Epic 1 — Hero
  | 'hero_variant_assigned'
  | 'hero_headline_viewed'
  | 'hero_cta_clicked'
  | 'hero_section_scrolled_past'
  // Epic 2 — Sessão Política
  | 'political_section_viewed'
  | 'political_theorist_card_hovered'
  | 'political_article_link_clicked'
  // Página do artigo
  | 'article_page_viewed'
  | 'article_reading_progress'
  | 'article_sticky_cta_clicked'
  | 'article_completed'

interface EventProperties {
  variant?: 'A' | 'B'
  button?: string
  location?: string
  progress_pct?: number
  theorist?: string
  [key: string]: unknown
}

function ph(): any | null {
  if (typeof window === 'undefined') return null
  return (window as any).posthog ?? null
}

export function track(event: EventName, props?: EventProperties): void {
  const posthog = ph()
  if (!posthog) return

  try {
    posthog.capture(event, props)
  } catch {
    // Silencioso — não quebrar a UI por tracking
  }
}

// ─── Helpers específicos para os épicos ─────────────────────────────────────

/** Marca visualização do hero (A/B) */
export function trackHeroViewed(variant: 'A' | 'B'): void {
  track('hero_headline_viewed', { variant })
}

/** Marca clique em CTA do hero */
export function trackHeroCTAClick(button: 'primary' | 'secondary', variant: 'A' | 'B'): void {
  track('hero_cta_clicked', { button, variant })
}

/** Marca quando a Sessão Política entra no viewport */
export function trackPoliticalSectionViewed(): void {
  track('political_section_viewed')
}

/** Marca clique no "Ler artigo completo" */
export function trackArticleLinkClicked(location: string): void {
  track('political_article_link_clicked', { location })
}

/** Marca progresso de leitura (apenas marcos: 25, 50, 75, 100) */
let trackedMilestones = new Set<number>()

export function trackReadingProgress(pct: number): void {
  const milestones = [25, 50, 75, 100]
  for (const m of milestones) {
    if (pct >= m && !trackedMilestones.has(m)) {
      trackedMilestones.add(m)
      track('article_reading_progress', { progress_pct: m })

      if (m === 100) {
        track('article_completed')
      }
    }
  }
}

/** Reset para testes */
export function resetReadingTracking(): void {
  trackedMilestones = new Set()
}
