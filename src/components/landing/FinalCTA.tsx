'use client'

import Link from 'next/link'

export function FinalCTA() {
  return (
    <section
      className="py-20 px-6 md:px-12 bg-white dark:bg-neutral-950 text-center"
      aria-labelledby="final-cta-headline"
    >
      <div className="max-w-xl mx-auto">
        <h2
          id="final-cta-headline"
          className="text-3xl md:text-4xl font-medium text-neutral-900 dark:text-white mb-4"
        >
          Comece sua análise hoje.
        </h2>
        <p className="text-base text-neutral-500 dark:text-neutral-400 mb-8 leading-relaxed">
          Gratuito. Em português. Seus dados ficam com você.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link
            href="/cadastro"
            className="
              px-8 py-3.5 text-sm font-medium
              bg-teal-600 text-white rounded-lg
              hover:bg-teal-700 transition-colors
            "
            data-analytics-id="final-cta-primary"
          >
            Criar conta gratuita
          </Link>
          <Link
            href="/epistemologia"
            className="
              px-8 py-3.5 text-sm font-medium
              border border-neutral-200 dark:border-neutral-700
              text-neutral-600 dark:text-neutral-300
              rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800
              transition-colors
            "
            data-analytics-id="final-cta-article"
          >
            Ler o artigo →
          </Link>
        </div>
      </div>
    </section>
  )
}

export default FinalCTA
