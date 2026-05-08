'use client'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

export function FinalCTA() {
  const t = useTranslations('final_cta')
  return (
    <section aria-labelledby="final-cta-headline" className="px-6 md:px-12 lg:px-20 py-24 bg-white dark:bg-neutral-950 text-center">
      <div className="max-w-2xl mx-auto">
        <h2 id="final-cta-headline" className="text-3xl md:text-4xl font-medium text-neutral-900 dark:text-white mb-4 leading-[1.2]">{t('headline')}</h2>
        <p className="text-base text-neutral-500 dark:text-neutral-400 mb-8">{t('sub')}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/cadastro" className="px-6 py-3 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all">{t('cta_primary')}</Link>
          <Link href="/epistemologia" className="px-6 py-3 text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors">{t('cta_secondary')}</Link>
        </div>
      </div>
    </section>
  )
}
