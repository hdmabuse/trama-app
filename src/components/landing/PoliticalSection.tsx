'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export function PoliticalSection() {
  const t = useTranslations('political_section')
  const sectionRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  const concepts = [
    { title: t('concept1_title'), body: t('concept1_body'), ref: t('concept1_ref') },
    { title: t('concept2_title'), body: t('concept2_body'), ref: t('concept2_ref') },
    { title: t('concept3_title'), body: t('concept3_body'), ref: t('concept3_ref') },
  ]

  return (
    <section ref={sectionRef} aria-labelledby="political-headline" className="bg-[#0F1117] px-6 md:px-12 lg:px-20 py-24">
      <div className="max-w-5xl mx-auto">
        <p className={`text-xs font-semibold uppercase tracking-[0.1em] text-teal-500 mb-5 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {t('overline')}
        </p>
        <h2 id="political-headline" className={`text-3xl md:text-4xl font-medium text-white leading-[1.2] mb-8 max-w-2xl transition-all duration-700 delay-75 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {t('headline')}
        </h2>
        <div className={`space-y-4 mb-12 max-w-2xl transition-all duration-700 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-base text-neutral-400 leading-relaxed">{t('body1')}</p>
          <p className="text-base text-neutral-400 leading-relaxed">{t('body2')}</p>
          <p className="text-base text-white font-medium">{t('body3')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {concepts.map((concept, i) => (
            <div key={concept.title}
              className={`border border-neutral-800 rounded-xl p-5 hover:border-teal-800 transition-colors duration-200 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{ transitionDelay: `${150 + i * 80}ms` }}>
              <div className="w-8 h-px bg-teal-600 mb-4" />
              <h3 className="text-sm font-semibold text-white mb-3 leading-snug">{concept.title}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed mb-3">{concept.body}</p>
              <p className="text-[10px] text-neutral-600 leading-snug">{concept.ref}</p>
            </div>
          ))}
        </div>
        <blockquote className={`border-l-2 border-teal-700 pl-6 mb-8 max-w-2xl transition-all duration-700 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-base text-neutral-300 italic leading-relaxed mb-2">{t('blockquote')}</p>
          <cite className="text-xs text-neutral-600 not-italic">{t('blockquote_source')}</cite>
        </blockquote>
        <Link href="/epistemologia"
          className={`inline-flex items-center gap-2 text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors duration-150 transition-all duration-700 delay-350 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {t('cta')}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </section>
  )
}
