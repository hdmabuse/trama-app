'use client'

import { useEffect, useState } from 'react'

// Wireframe: onboard-1, onboard-2, onboard-3
// [1] Aparece apenas para firstTimeUser. Backdrop 45%.
// [2] 3 slides: Codificação → Tema → Teia. Esc/× salva dismissal.
// [3] SVG anima na entrada de cada slide.

const STORAGE_KEY = 'trama_onboarding_done'

// ─── Slides ──────────────────────────────────────────────────────────────────

const SLIDES = [
  {
    title: 'O que é Codificação?',
    content: (
      <>
        <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed mb-4">
          Você lê uma entrevista e encontra:
        </p>
        <blockquote className="bg-stone-50 dark:bg-stone-800 border-l-[3px] border-teal-500 rounded-r-md px-4 py-3 text-sm italic text-stone-700 dark:text-stone-200 mb-4">
          &ldquo;O preço é alto, mas a qualidade compensa.&rdquo;
        </blockquote>
        <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-3">
          Você poderia nomear esse trecho de três formas:
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { label: 'percepção de valor',          color: '#0D9488' },
            { label: 'contradição preço-qualidade', color: '#7C3AED' },
            { label: 'racionalização do custo',     color: '#D97706' },
          ].map(c => (
            <span key={c.label} style={{ background: c.color }}
              className="px-3 py-1 rounded-full text-xs font-medium text-white">
              {c.label}
            </span>
          ))}
        </div>
        <div className="bg-stone-100 dark:bg-stone-800 rounded-md px-4 py-3 text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
          Cada nome é uma versão possível. O código que você escolhe já é uma interpretação — não existe código neutro.
        </div>
      </>
    ),
  },
  {
    title: 'O que é um Tema?',
    content: (
      <>
        <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed mb-4">
          Depois de codificar, você vai perceber que alguns códigos falam de coisas relacionadas.
        </p>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex flex-col gap-1.5">
            {['CUSTO', 'RENDA', 'VALORIZAÇÃO'].map(c => (
              <span key={c} className="px-3 py-1 bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs rounded-full font-medium">
                {c}
              </span>
            ))}
          </div>
          <span className="text-2xl text-stone-300">→</span>
          <span className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg">
            Economia do Trabalho
          </span>
        </div>
        <div className="bg-stone-100 dark:bg-stone-800 rounded-md px-4 py-3 text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
          Temas não são categorias — são respostas às suas perguntas de pesquisa.
        </div>
      </>
    ),
  },
  {
    title: 'O que é a Teia?',
    content: (
      <>
        <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed mb-4">
          Com temas e documentos, TRAMA mostra como eles se conectam em uma rede visual interativa.
        </p>
        <div className="flex justify-center mb-4">
          <svg width="180" height="120" viewBox="0 0 180 120" aria-hidden="true">
            <style>{`
              @keyframes teiaFade {
                from { opacity: 0; } to { opacity: 1; }
              }
              .teia-el { animation: teiaFade 0.6s ease-out both; }
            `}</style>
            <line x1="90" y1="60" x2="40" y2="25"  stroke="#0D948840" strokeWidth="2" className="teia-el" style={{ animationDelay: '100ms' }}/>
            <line x1="90" y1="60" x2="140" y2="25" stroke="#0D948840" strokeWidth="2" className="teia-el" style={{ animationDelay: '200ms' }}/>
            <line x1="90" y1="60" x2="40" y2="95"  stroke="#D9770640" strokeWidth="1.5" className="teia-el" style={{ animationDelay: '300ms' }}/>
            <line x1="90" y1="60" x2="140" y2="95" stroke="#4F46E540" strokeWidth="1.5" className="teia-el" style={{ animationDelay: '400ms' }}/>
            <circle cx="90" cy="60" r="20" fill="#0D9488" opacity=".9" className="teia-el" style={{ animationDelay: '0ms' }}/>
            <text x="90" y="57" textAnchor="middle" fontSize="8" fill="white" fontWeight="500">Herança</text>
            <text x="90" y="67" textAnchor="middle" fontSize="8" fill="white">Cultural</text>
            <circle cx="40"  cy="25"  r="13" fill="#D97706" opacity=".85" className="teia-el" style={{ animationDelay: '200ms' }}/>
            <text x="40" y="28" textAnchor="middle" fontSize="7" fill="white">Renda</text>
            <circle cx="140" cy="25"  r="15" fill="#4F46E5" opacity=".85" className="teia-el" style={{ animationDelay: '300ms' }}/>
            <text x="140" y="28" textAnchor="middle" fontSize="7" fill="white">Identidade</text>
            <circle cx="40"  cy="95"  r="11" fill="#059669" opacity=".8" className="teia-el" style={{ animationDelay: '400ms' }}/>
            <text x="40" y="98" textAnchor="middle" fontSize="7" fill="white">Turismo</text>
            <circle cx="140" cy="95"  r="12" fill="#7C3AED" opacity=".8" className="teia-el" style={{ animationDelay: '500ms' }}/>
            <text x="140" y="98" textAnchor="middle" fontSize="7" fill="white">Família</text>
          </svg>
        </div>
        <div className="bg-stone-100 dark:bg-stone-800 rounded-md px-4 py-3 text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
          TRAMA não interpreta a teia — você o faz. A ferramenta organiza o que você produziu no encontro com os dados.
        </div>
      </>
    ),
  },
]

// ─── Modal ────────────────────────────────────────────────────────────────────

interface OnboardingModalProps {
  onComplete: () => void
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [slide, setSlide] = useState(0)
  const isLast = slide === SLIDES.length - 1
  const current = SLIDES[slide]

  // Fechar com Esc
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') dismiss() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, 'true')
    onComplete()
  }

  function next() { isLast ? dismiss() : setSlide(s => s + 1) }

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 w-full max-w-lg shadow-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
              Passo {slide + 1} de {SLIDES.length}
            </p>
            <h2 className="text-base font-semibold text-stone-800 dark:text-white">
              {current.title}
            </h2>
          </div>
          <button onClick={dismiss}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xl leading-none"
            aria-label="Fechar tour">
            ×
          </button>
        </div>

        {/* Conteúdo */}
        <div className="px-6 py-5">{current.content}</div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-between">
          <div className="flex gap-1.5 items-center">
            {SLIDES.map((_, i) => (
              <div key={i}
                className="h-1 rounded-full transition-all duration-300"
                style={{ width: i === slide ? 28 : 14, background: i === slide ? '#0D9488' : '#E5E7EB' }}
              />
            ))}
            <span className="text-[10px] text-stone-400 ml-2">{slide + 1}/{SLIDES.length}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={dismiss}
              className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors">
              Pular tour
            </button>
            <button onClick={next}
              className="px-4 py-1.5 text-xs font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
              {isLast ? 'Começar minha análise' : 'Entendi, próximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOnboarding() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY)
    if (!done) setShow(true)
  }, [])

  return { show, complete: () => setShow(false) }
}
