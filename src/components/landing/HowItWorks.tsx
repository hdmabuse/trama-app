'use client'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

export function HowItWorks() {
  const t = useTranslations('how_it_works')
  const steps = [
    { n: '01', title: t('step1_title'), desc: t('step1_desc'), color: 'bg-teal-500' },
    { n: '02', title: t('step2_title'), desc: t('step2_desc'), color: 'bg-indigo-500' },
    { n: '03', title: t('step3_title'), desc: t('step3_desc'), color: 'bg-amber-500' },
    { n: '04', title: t('step4_title'), desc: t('step4_desc'), color: 'bg-violet-500' },
  ]
  return (
    <section aria-labelledby="how-headline" className="px-6 md:px-12 lg:px-20 py-24 bg-stone-50 dark:bg-neutral-900">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-teal-600 mb-4">{t('overline')}</p>
        <h2 id="how-headline" className="text-3xl md:text-4xl font-medium text-neutral-900 dark:text-white mb-3 max-w-2xl leading-[1.2]">{t('headline')}</h2>
        <p className="text-base text-neutral-500 dark:text-neutral-400 mb-12">{t('sub')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 mb-12">
          {steps.map(step => (
            <div key={step.n} className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-700 p-5">
              <div className={`w-7 h-7 rounded-lg ${step.color} flex items-center justify-center mb-4`}>
                <span className="text-white text-[10px] font-bold">{step.n}</span>
              </div>
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-white mb-2">{step.title}</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/cadastro" className="px-5 py-2.5 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">{t('cta_primary')}</Link>
          
        </div>
      </div>
    </section>
  )
}
