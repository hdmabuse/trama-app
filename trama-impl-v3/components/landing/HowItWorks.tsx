'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const STEPS = [
  {
    n: '1',
    title: 'Importe',
    desc: 'Cole sua transcrição, carregue um PDF ou arquivo de texto. Seus dados nunca saem do servidor.',
    formats: ['TXT', 'MD', 'PDF', 'DOCX'],
    color: '#0D9488',
  },
  {
    n: '2',
    title: 'Codifique',
    desc: 'Selecione trechos e atribua códigos que você cria. Você escolhe os nomes — e essa escolha já é uma interpretação.',
    color: '#4F46E5',
  },
  {
    n: '3',
    title: 'Tematize',
    desc: 'Agrupe códigos em temas. Temas não são categorias — são respostas às suas perguntas de pesquisa.',
    color: '#D97706',
  },
  {
    n: '4',
    title: 'Visualize',
    desc: 'Explore a teia de relações entre temas, documentos e códigos. Exporte SVG, PNG ou relatório narrativo.',
    color: '#059669',
  },
]

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, visible }
}

export function HowItWorks() {
  const { ref, visible } = useInView(0.15)

  return (
    <section
      ref={ref}
      aria-labelledby="how-it-works-headline"
      className="py-20 px-6 md:px-12 lg:px-20 bg-neutral-50 dark:bg-neutral-900"
    >
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div
          className="text-center mb-14"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-teal-600 dark:text-teal-400 mb-4">
            4 passos
          </p>
          <h2
            id="how-it-works-headline"
            className="text-3xl md:text-4xl font-medium text-neutral-900 dark:text-white mb-3"
          >
            Da transcrição ao insight,<br className="hidden md:block" /> em um único lugar.
          </h2>
          <p className="text-base text-neutral-500 dark:text-neutral-400">
            Você controla cada decisão interpretativa.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((step, i) => (
            <div
              key={step.n}
              className="
                bg-white dark:bg-neutral-950
                border border-neutral-100 dark:border-neutral-800
                rounded-xl p-5
                flex flex-col gap-4
              "
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.5s ${200 + i * 100}ms ease-out, transform 0.5s ${200 + i * 100}ms ease-out`,
              }}
            >
              {/* Número */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                style={{ background: step.color }}
              >
                {step.n}
              </div>

              {/* Placeholder de animação */}
              <div
                className="h-20 rounded-lg flex items-center justify-center"
                style={{ background: `${step.color}10`, border: `1px dashed ${step.color}40` }}
                aria-hidden="true"
              >
                <span className="text-[10px]" style={{ color: step.color }}>screencast loop</span>
              </div>

              {/* Texto */}
              <div>
                <h3 className="text-[13px] font-medium text-neutral-900 dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-[12px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              {/* Formatos (só step 1) */}
              {step.formats && (
                <div className="flex gap-1.5 flex-wrap">
                  {step.formats.map(f => (
                    <span
                      key={f}
                      className="text-[10px] px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div
          className="flex justify-center gap-4 mt-12"
          style={{
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.6s 700ms ease-out',
          }}
        >
          <Link
            href="/auth/signup"
            className="
              px-6 py-3 text-sm font-medium
              bg-teal-600 text-white rounded-lg
              hover:bg-teal-700 transition-colors
            "
          >
            Começar agora
          </Link>
          <Link
            href="/demo"
            className="
              px-6 py-3 text-sm font-medium
              border border-neutral-200 dark:border-neutral-700
              text-neutral-600 dark:text-neutral-300
              rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800
              transition-colors
            "
          >
            ▶ Assistir vídeo (60s)
          </Link>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
