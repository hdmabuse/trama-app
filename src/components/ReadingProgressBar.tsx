/**
 * ReadingProgressBar — barra de progresso de leitura (fixed top)
 * StickyArticleCTA   — CTA que aparece após 60% de scroll
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// ─── Reading Progress Bar ────────────────────────────────────────────────────

export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function update() {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const pct = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0
      setProgress(Math.min(100, pct))
    }

    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-transparent"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${progress}% do artigo lido`}
    >
      <div
        className="h-full bg-teal-600 transition-[width] duration-100"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

// ─── Sticky Article CTA ──────────────────────────────────────────────────────

export function StickyArticleCTA() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function check() {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      setVisible(pct >= 60)
    }

    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [])

  if (!visible) return null

  return (
    <div
      className="
        fixed bottom-6 left-1/2 -translate-x-1/2
        z-50
        flex items-center gap-3
        bg-white dark:bg-neutral-900
        border border-neutral-200 dark:border-neutral-700
        rounded-full px-5 py-3
        shadow-lg shadow-neutral-200/50 dark:shadow-neutral-900/50
      "
      role="complementary"
      aria-label="Ação relacionada ao artigo"
    >
      <span className="text-sm text-neutral-600 dark:text-neutral-300 hidden sm:block">
        Gostou do argumento?
      </span>
      <Link
        href="/auth/signup"
        className="
          px-4 py-1.5 text-sm font-medium
          bg-teal-600 text-white rounded-full
          hover:bg-teal-700 transition-colors
          whitespace-nowrap
        "
        data-analytics-id="article-sticky-cta"
      >
        Usar o TRAMA →
      </Link>
    </div>
  )
}
