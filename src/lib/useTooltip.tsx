// Wireframe: tooltips
// [1] Trigger: onMouseEnter + delay 1000ms. Estado em localStorage.
// [2] Redefinir tooltips: limpar localStorage. Confirmação necessária.
// [3] Views 0-2: conteúdo simples. Views 3-4: conteúdo aprofundado. 5+: desaparece.

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Catálogo de tooltips ─────────────────────────────────────────────────────

export const TOOLTIP_CATALOG: Record<string, { simple: string; deep: string }> = {
  'new-code': {
    simple: 'Criar código para categorizar trechos',
    deep: 'O nome que você escolhe já é uma interpretação. Nomes descritivos, não avaliativos.',
  },
  'new-theme': {
    simple: 'Agrupar códigos em narrativas de sentido',
    deep: 'Temas são respostas a perguntas de pesquisa, não agrupamentos por semelhança.',
  },
  'export': {
    simple: 'Gerar relatório da análise',
    deep: 'O relatório inclui metodologia reflexiva: onde você estava, não só o que encontrou.',
  },
  'memo': {
    simple: 'Adicionar nota à codificação',
    deep: 'Memos documentam seu raciocínio interpretativo. São parte da análise, não margem do dado.',
  },
  'search': {
    simple: 'Busca global em docs, códigos e temas',
    deep: 'Buscar em toda a análise ao mesmo tempo é ver como suas interpretações se conectam.',
  },
  'filter-theme': {
    simple: 'Ver apenas trechos de um tema',
    deep: 'Filtrar por tema revela onde o mesmo código aparece em contextos diferentes.',
  },
}

const STORAGE_PREFIX = 'trama_tooltip_views_'
const THRESHOLD_DEEP = 3   // a partir desta view: mostra conteúdo aprofundado
const THRESHOLD_HIDE = 5   // a partir desta view: desaparece permanentemente

// ─── Hook individual ─────────────────────────────────────────────────────────

export function useTooltip(id: string) {
  const [views, setViews] = useState<number>(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  // Carregar views do localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${id}`)
    setViews(stored ? parseInt(stored, 10) : 0)
  }, [id])

  const content = TOOLTIP_CATALOG[id]
  const shouldShow = views < THRESHOLD_HIDE && !!content

  const text = shouldShow
    ? (views >= THRESHOLD_DEEP ? content.deep : content.simple)
    : null

  const onMouseEnter = useCallback(() => {
    if (!shouldShow) return
    timerRef.current = setTimeout(() => {
      const newViews = views + 1
      setViews(newViews)
      localStorage.setItem(`${STORAGE_PREFIX}${id}`, String(newViews))
      setVisible(true)
    }, 1000)
  }, [id, views, shouldShow])

  const onMouseLeave = useCallback(() => {
    clearTimeout(timerRef.current)
    setVisible(false)
  }, [])

  const dismiss = useCallback(() => {
    clearTimeout(timerRef.current)
    setVisible(false)
    // Forçar hide permanente
    localStorage.setItem(`${STORAGE_PREFIX}${id}`, String(THRESHOLD_HIDE))
    setViews(THRESHOLD_HIDE)
  }, [id])

  return { visible: visible && !!text, text, onMouseEnter, onMouseLeave, dismiss }
}

// ─── Componente de tooltip ────────────────────────────────────────────────────

interface TooltipProps {
  id: string
  children: React.ReactNode
  side?: 'top' | 'bottom'
}

export function Tooltip({ id, children, side = 'bottom' }: TooltipProps) {
  const { visible, text, onMouseEnter, onMouseLeave, dismiss } = useTooltip(id)

  return (
    <div className="relative inline-flex" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {children}

      {visible && text && (
        <div
          className={`
            absolute z-50 w-52 px-3 py-2
            bg-stone-900 dark:bg-stone-100
            text-stone-100 dark:text-stone-900
            text-xs rounded-lg shadow-lg
            ${side === 'bottom' ? 'top-full mt-2 left-1/2 -translate-x-1/2' : 'bottom-full mb-2 left-1/2 -translate-x-1/2'}
          `}
          role="tooltip"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="leading-relaxed">{text}</span>
            <button
              onClick={dismiss}
              className="text-stone-400 dark:text-stone-600 hover:text-stone-200 dark:hover:text-stone-800 flex-shrink-0 mt-0.5 leading-none"
              aria-label="Dispensar tooltip"
            >
              ×
            </button>
          </div>

          {/* Seta */}
          <div className={`
            absolute left-1/2 -translate-x-1/2 w-2 h-2
            bg-stone-900 dark:bg-stone-100
            rotate-45
            ${side === 'bottom' ? '-top-1' : '-bottom-1'}
          `} aria-hidden="true" />
        </div>
      )}
    </div>
  )
}

// ─── Utilitário: redefinir todos os tooltips ──────────────────────────────────

export function resetAllTooltips(): void {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX))
  keys.forEach(k => localStorage.removeItem(k))
}
