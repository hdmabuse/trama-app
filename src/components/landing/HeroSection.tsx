'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher'
import { useTranslations } from 'next-intl'
import { useHeroVariant } from '@/lib/useHeroVariant'

const DIFFERENTIALS = [
  { labelKey: 'differential_no_ai',       descKey: 'differential_no_ai_desc' },
  { labelKey: 'differential_your_data',   descKey: 'differential_your_data_desc' },
  { labelKey: 'differential_language',   descKey: 'differential_language_desc' },
  { labelKey: 'differential_open',       descKey: 'differential_open_desc' },
  { labelKey: 'differential_free',       descKey: 'differential_free_desc' },
]

function TeiaSVG() {
  return (
    <svg
      viewBox="0 0 280 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Diagrama mostrando encontro transformado em teia de temas"
      role="img"
      className="w-full h-full"
    >
      <style>{`
        @keyframes drawLine {
          from { stroke-dashoffset: 300; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes fadeNode {
          from { opacity: 0; transform: scale(0.4); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-4px); }
        }
        .teia-line {
          stroke-dasharray: 300;
          stroke-dashoffset: 300;
          animation: drawLine 1.2s ease-out forwards;
        }
        .teia-node {
          opacity: 0;
          transform-origin: center;
          animation: fadeNode 0.5s ease-out forwards;
        }
        .teia-float {
          animation: floatSlow 4s ease-in-out infinite;
        }
      `}</style>

      <g className="teia-node" style={{ animationDelay: '0ms' }}>
        <rect x="8" y="60" width="64" height="80" rx="4"
          fill="var(--color-bg-2, #f8f9fa)"
          stroke="var(--color-border, #e5e7eb)" strokeWidth="1" />
        <rect x="16" y="72" width="48" height="6" rx="2" fill="var(--color-border, #e5e7eb)" />
        <rect x="16" y="84" width="40" height="6" rx="2" fill="#0D948840" />
        <rect x="16" y="96" width="44" height="6" rx="2" fill="var(--color-border, #e5e7eb)" />
        <rect x="16" y="108" width="36" height="6" rx="2" fill="#D9770640" />
        <rect x="16" y="120" width="42" height="6" rx="2" fill="var(--color-border, #e5e7eb)" />
        <text x="40" y="154" textAnchor="middle" fontSize="9"
          fill="var(--color-text-3, #9ca3af)">encontro</text>
      </g>

      <line x1="72" y1="100" x2="108" y2="100"
        stroke="var(--color-border, #e5e7eb)" strokeWidth="1.5"
        markerEnd="url(#arrowv3)"
        className="teia-line" style={{ animationDelay: '400ms' }} />

      <defs>
        <marker id="arrowv3" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6" fill="none"
            stroke="var(--color-border, #e5e7eb)" strokeWidth="1" />
        </marker>
      </defs>

      <g className="teia-float">
        <line x1="170" y1="100" x2="210" y2="58"  stroke="#0D948840" strokeWidth="1.5" className="teia-line" style={{ animationDelay: '700ms' }} />
        <line x1="170" y1="100" x2="240" y2="100" stroke="#0D948440" strokeWidth="2"   className="teia-line" style={{ animationDelay: '800ms' }} />
        <line x1="170" y1="100" x2="210" y2="142" stroke="#D9770640" strokeWidth="1.5" className="teia-line" style={{ animationDelay: '900ms' }} />
        <line x1="170" y1="100" x2="128" y2="58"  stroke="#4F46E540" strokeWidth="1"   className="teia-line" style={{ animationDelay: '1000ms' }} />
        <line x1="210" y1="58"  x2="240" y2="100" stroke="#0D948430" strokeWidth="1"   className="teia-line" style={{ animationDelay: '1100ms' }} strokeDasharray="4 3" />

        <circle cx="170" cy="100" r="22" fill="#0D9488" opacity="0.9"  className="teia-node" style={{ animationDelay: '600ms' }} />
        <text x="170" y="97"  textAnchor="middle" fontSize="8" fill="white" fontWeight="500">Herança</text>
        <text x="170" y="107" textAnchor="middle" fontSize="8" fill="white">Cultural</text>

        <circle cx="210" cy="58"  r="15" fill="#D97706" opacity="0.85" className="teia-node" style={{ animationDelay: '750ms' }} />
        <text x="210" y="55"  textAnchor="middle" fontSize="7" fill="white">Trabalho</text>
        <text x="210" y="64"  textAnchor="middle" fontSize="7" fill="white">e Renda</text>

        <circle cx="240" cy="100" r="18" fill="#4F46E5" opacity="0.85" className="teia-node" style={{ animationDelay: '850ms' }} />
        <text x="240" y="97"  textAnchor="middle" fontSize="7" fill="white">Identidade</text>
        <text x="240" y="106" textAnchor="middle" fontSize="7" fill="white">Autonomia</text>

        <circle cx="210" cy="142" r="13" fill="#059669" opacity="0.8"  className="teia-node" style={{ animationDelay: '950ms' }} />
        <text x="210" y="145" textAnchor="middle" fontSize="7" fill="white">Turismo</text>

        <circle cx="128" cy="58"  r="12" fill="#7C3AED" opacity="0.8"  className="teia-node" style={{ animationDelay: '1050ms' }} />
        <text x="128" y="61"  textAnchor="middle" fontSize="7" fill="white">Família</text>
      </g>
    </svg>
  )
}

export function HeroSection({ variant = 'A' }: { variant?: 'A' | 'B' }) {
  const t = useTranslations('hero')
  const [mounted, setMounted] = useState(false)
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => { setMounted(true) }, [])

  const headline = t(`headline_${variant === 'A' ? 'a' : 'b'}_1`)
  const sub1 = t(`sub1_${variant === 'A' ? 'a' : 'b'}`)
  const sub2 = t(`sub2_${variant === 'A' ? 'a' : 'b'}`)
  const cta1 = t(`cta_primary_${variant === 'A' ? 'a' : 'b'}`)
  const microcopy = t('microcopy')

  return (
    <section
      ref={heroRef}
      aria-labelledby="hero-headline"
      className={`
        relative overflow-hidden
        px-6 md:px-12 lg:px-20 pt-20 pb-16
        bg-white dark:bg-neutral-950
        transition-opacity duration-300
        ${mounted ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 60% 40%, rgba(13,148,136,0.04) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-6xl mx-auto">

        <nav className="flex items-center justify-between mb-16" aria-label="Navegação principal">
          <span className="text-[15px] font-medium text-teal-600 dark:text-teal-400 tracking-tight">
            TRAMA
          </span>
          <div className="hidden md:flex items-center gap-8 text-sm text-neutral-500 dark:text-neutral-400">
            <a href="https://github.com/hdmabuse/trama-app" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 dark:hover:text-white transition-colors">GitHub</a>
            <Link href="/epistemologia" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Construção do conhecimento</Link>
          </div>
          <div className="flex items-center gap-3">
            <LocaleSwitcher variant="light" />
            <Link href="/cadastro" className="px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
              Começar
            </Link>
          </div>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          <div>
            <h1
              id="hero-headline"
              className="text-4xl md:text-5xl font-medium leading-[1.15] text-neutral-900 dark:text-white mb-6"
              style={{ animation: mounted ? 'fadeSlideUp 0.6s 80ms ease-out both' : 'none' }}
            >
              {headline}
            </h1>

            <p
              className="text-base text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4"
              style={{ animation: mounted ? 'fadeSlideUp 0.6s 160ms ease-out both' : 'none' }}
            >
              {sub1}
            </p>

            {sub2 && (
              <p
                className="text-base text-neutral-600 dark:text-neutral-300 leading-relaxed mb-8"
                style={{ animation: mounted ? 'fadeSlideUp 0.6s 200ms ease-out both' : 'none' }}
              >
                {sub2}
              </p>
            )}

            <div
              className="flex flex-wrap items-center gap-3 mb-5"
              style={{ animation: mounted ? 'fadeSlideUp 0.6s 260ms ease-out both' : 'none' }}
            >
              <Link
                href="/cadastro"
                className="px-6 py-3 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 active:scale-[0.98] transition-all duration-150"
                data-analytics-id="hero-cta-primary"
                data-variant={variant}
              >
                {cta1}
              </Link>
            </div>

            <p
              className="text-xs text-neutral-400 dark:text-neutral-500"
              style={{ animation: mounted ? 'fadeSlideUp 0.6s 300ms ease-out both' : 'none' }}
            >
              {microcopy}
            </p>
          </div>

          <div
            className="relative h-56 md:h-72 lg:h-80"
            style={{ animation: mounted ? 'fadeSlideUp 0.6s 120ms ease-out both' : 'none' }}
            aria-hidden="true"
          >
            <TeiaSVG />
          </div>
        </div>

        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-14 pt-10 border-t border-neutral-100 dark:border-neutral-800"
          style={{ animation: mounted ? 'fadeSlideUp 0.6s 360ms ease-out both' : 'none' }}
        >
          {DIFFERENTIALS.map((d, i) => (
            <div
              key={d.labelKey}
              className="text-center px-3 py-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800 hover:border-teal-200 dark:hover:border-teal-800 transition-colors duration-150"
              style={{ animation: mounted ? `fadeSlideUp 0.5s ${360 + i * 50}ms ease-out both` : 'none' }}
            >
              <p className="text-xs font-medium text-neutral-700 dark:text-neutral-200 mb-1">{t(d.labelKey)}</p>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-snug hidden sm:block">{t(d.descKey)}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  )
}

export default HeroSection