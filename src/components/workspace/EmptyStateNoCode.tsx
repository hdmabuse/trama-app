'use client'

// Wireframe: es-nocode
// Condição: documento carregado E codificações === 0
// [1] Texto com opacity .4, overlay central com passos
// [2] Desaparece no primeiro mouseup de seleção de texto. Não volta.

interface EmptyStateNoCodeProps {
  onDismiss: () => void
}

export function EmptyStateNoCode({ onDismiss }: EmptyStateNoCodeProps) {
  return (
    // pointer-events-none para não bloquear seleção de texto no documento
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-md p-5 text-center w-60 pointer-events-auto">

        <p className="text-sm font-medium text-stone-800 dark:text-white mb-3">
          Comece a codificar
        </p>

        <div className="flex gap-1.5 justify-center mb-3 flex-wrap">
          {['1 · Selecione', '2 · Nomeie', '3 · Aqui →'].map(s => (
            <span key={s} className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded px-1.5 py-1">
              {s}
            </span>
          ))}
        </div>

        <p className="text-[11px] text-stone-400 dark:text-stone-500 leading-relaxed mb-3">
          O nome que você escolhe já é uma interpretação. Não existe código neutro.
        </p>

        <button
          onClick={onDismiss}
          className="text-[11px] text-trama-500 hover:text-trama-700 font-medium transition-colors"
        >
          Entendi, vou codificar
        </button>
      </div>
    </div>
  )
}
