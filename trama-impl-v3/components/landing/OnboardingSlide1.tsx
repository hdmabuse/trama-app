'use client'

// ─── OnboardingSlide1 v3 ──────────────────────────────────────────────────────
// Mudanças v2 → v3:
// - Exemplo mostra três leituras possíveis do mesmo trecho
// - Adiciona frase sobre "versão possível" derivada da etnografia contemporânea
// - Remove afirmação "nenhum nome é mais verdadeiro"
//   → substitui por "o código que você escolhe já é uma versão possível"
// - Sem travessões

interface OnboardingSlide1Props {
  onNext: () => void
  onSkip: () => void
}

const EXAMPLE_CODES = [
  { label: 'percepção de valor',      color: '#0D9488' },
  { label: 'contradição preço-qualidade', color: '#7C3AED' },
  { label: 'racionalização do custo', color: '#D97706' },
]

export function OnboardingSlide1({ onNext, onSkip }: OnboardingSlide1Props) {
  return (
    <div className="flex flex-col h-full">

      {/* Corpo principal */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-0 flex-1">

        {/* Texto */}
        <div className="p-6 md:p-7">
          <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4">
            Você lê uma entrevista e encontra a frase:
          </p>

          {/* Citação */}
          <blockquote className="bg-neutral-50 dark:bg-neutral-900 border-l-[3px] border-teal-500 rounded-r-md px-4 py-3 text-sm italic text-neutral-700 dark:text-neutral-200 mb-5">
            &ldquo;O preço é alto, mas a qualidade compensa.&rdquo;
          </blockquote>

          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">
            Você poderia nomear esse trecho de três formas diferentes:
          </p>

          {/* Três exemplos de código */}
          <div className="flex flex-wrap gap-2 mb-5">
            {EXAMPLE_CODES.map((code) => (
              <span
                key={code.label}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white"
                style={{ background: code.color }}
              >
                {code.label}
              </span>
            ))}
          </div>

          {/* Argumento central — v3 */}
          <div className="bg-neutral-100 dark:bg-neutral-900 rounded-md px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Cada nome é uma versão possível de um encontro que poderia ter gerado outro nome, ou um conceito que ainda não existe. O código que você escolhe já é uma interpretação: não existe código neutro.
          </div>
        </div>

        {/* Visual lateral */}
        <div
          className="hidden md:flex flex-col items-center justify-center gap-4 p-5 border-l border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
          aria-hidden="true"
        >
          {/* Representação visual do trecho sendo codificado */}
          <div className="w-24 bg-white dark:bg-neutral-950 rounded-md border border-neutral-200 dark:border-neutral-700 p-2.5">
            <div className="text-[8px] text-neutral-400 mb-2 font-medium">Trecho</div>
            <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded mb-1.5 w-full" />
            <div className="h-1.5 rounded mb-1.5 w-11/12" style={{ background: '#0D948840' }} />
            <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded w-10/12" />
          </div>

          <div className="text-neutral-300 dark:text-neutral-600 text-lg">↓</div>

          {/* Badge do código escolhido */}
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium text-white bg-teal-600">
            percepção de valor
          </span>

          <p className="text-[9px] text-neutral-400 text-center leading-snug">
            sua escolha,<br />sua interpretação
          </p>
        </div>
      </div>

      {/* Rodapé do slide */}
      <div className="px-6 md:px-7 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
        {/* Indicadores de progresso */}
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-1 rounded-full"
              style={{
                width: i === 0 ? 28 : 14,
                background: i === 0 ? '#0D9488' : '#E5E7EB',
              }}
            />
          ))}
          <span className="text-[10px] text-neutral-400 ml-2">1 de 3</span>
        </div>

        {/* Botões */}
        <div className="flex gap-2">
          <button
            onClick={onSkip}
            className="px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
          >
            Pular tour
          </button>
          <button
            onClick={onNext}
            className="px-4 py-1.5 text-xs font-medium bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
          >
            Entendi, próximo
          </button>
        </div>
      </div>
    </div>
  )
}

export default OnboardingSlide1
