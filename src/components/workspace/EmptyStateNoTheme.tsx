'use client'

import { useMemo, useState } from 'react'

// Wireframe: es-notheme
// Condição: códigos >= 3 E temas === 0
// [1] Lista de códigos à esquerda contextualiza o estado
// [2] Sugestão por prefix matching. Aceitar cria tema + adiciona códigos.

interface Code {
  id: string
  name: string
  color?: string
  _count: { codings: number }
}

interface ThemeSuggestion {
  name: string
  codeIds: string[]
  codeNames: string[]
}

interface EmptyStateNoThemeProps {
  codes: Code[]
  onNewTheme: () => void
  onAcceptSuggestion: (suggestion: ThemeSuggestion) => Promise<void>
}

// Prefix matching: agrupa códigos que compartilham a primeira palavra
function buildSuggestions(codes: Code[]): ThemeSuggestion[] {
  const groups: Record<string, Code[]> = {}
  codes.forEach(c => {
    const first = c.name.split(/\s+/)[0].toLowerCase()
    if (!groups[first]) groups[first] = []
    groups[first].push(c)
  })
  return Object.entries(groups)
    .filter(([, cs]) => cs.length >= 2)
    .map(([prefix, cs]) => ({
      name: prefix.charAt(0).toUpperCase() + prefix.slice(1) + 's',
      codeIds: cs.map(c => c.id),
      codeNames: cs.map(c => c.name),
    }))
    .slice(0, 2)
}

export function EmptyStateNoTheme({ codes, onNewTheme, onAcceptSuggestion }: EmptyStateNoThemeProps) {
  const suggestions = useMemo(() => buildSuggestions(codes), [codes])
  const [accepting, setAccepting] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<string[]>([])

  async function handleAccept(s: ThemeSuggestion) {
    setAccepting(s.name)
    await onAcceptSuggestion(s)
    setAccepting(null)
  }

  const visible = suggestions.filter(s => !dismissed.includes(s.name))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-[340px]">

      {/* Lista de códigos — contexto */}
      <div className="p-5 border-r border-stone-100 dark:border-stone-800 overflow-auto">
        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-4">
          Códigos criados ({codes.length})
        </p>
        <div className="space-y-0">
          {codes.map(c => (
            <div key={c.id} className="flex items-center gap-3 py-2 border-b border-stone-50 dark:border-stone-900">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color || '#0D9488' }} />
              <span className="text-sm text-stone-700 dark:text-stone-300 flex-1">{c.name}</span>
              <span className="text-xs text-stone-400">{c._count.codings}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ação + sugestões */}
      <div className="p-6 flex flex-col items-center justify-center text-center">
        <div className="text-3xl mb-3 text-stone-300">⌘</div>
        <h3 className="text-base font-medium text-stone-800 dark:text-white mb-2">
          Agrupe em narrativas maiores
        </h3>
        <p className="text-sm text-stone-500 dark:text-stone-400 max-w-[220px] leading-relaxed mb-5">
          Temas não são categorias — são respostas às suas perguntas de pesquisa.
        </p>

        <button onClick={onNewTheme}
          className="px-5 py-2 bg-trama-500 hover:bg-trama-600 text-white text-sm font-medium rounded-lg transition-colors mb-5">
          + Novo Tema
        </button>

        {visible.length > 0 && (
          <div className="w-full space-y-3">
            {visible.map(s => (
              <div key={s.name}
                className="bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-lg p-3 text-left">
                <p className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 mb-1">
                  💡 Sugestão automática
                </p>
                <p className="text-xs text-stone-600 dark:text-stone-400 mb-2">
                  {s.codeNames.join(' + ')} → &ldquo;{s.name}&rdquo;?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(s)}
                    disabled={accepting === s.name}
                    className="px-3 py-1 bg-teal-600 text-white text-xs font-medium rounded-md hover:bg-teal-700 disabled:opacity-50 transition-colors">
                    {accepting === s.name ? 'Criando...' : 'Aceitar'}
                  </button>
                  <button
                    onClick={() => setDismissed(d => [...d, s.name])}
                    className="px-3 py-1 border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 text-xs rounded-md hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                    Ignorar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
