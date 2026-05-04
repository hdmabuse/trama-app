'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface HeroVariant {
  headline: string[]
  sub1: string
  sub2: string
  cta1: string
  cta2: string
}

// ─── Copy v3 ─────────────────────────────────────────────────────────────────
// Fundamentação: etnografia contemporânea (Ingold 2011, Latour 2005,
// Clifford & Marcus 1986) + Braun & Clarke (2006/2019) + Haraway (1988)
//
// Mudanças v2 → v3:
// A: headline incorpora co-produção do dado no encontro (Ingold/Latour)
//    sub1: adiciona "versão possível" e "conceito que ainda não tem nome"
//    sub2: "campo não precede a análise" como formulação central
// Sem travessões em todo o copy (substituídos por vírgulas ou ponto final)

const VARIANTS: Record<'A' | 'B', HeroVariant> = {
  A: {
    headline: [
      'O dado não existia antes do encontro.',
      'Você o produziu.',
    ],
    sub1:
      'Quando você escreve "barreira de acesso" ao lado de um trecho, não está apenas interpretando o que o interlocutor disse. Está construindo uma versão possível de um encontro que poderia ter gerado "pragmatismo adaptativo", "resistência velada", ou um conceito que ainda não tem nome.',
    sub2:
      'TRAMA foi feito para pesquisadores que sabem que o campo não precede a análise. E querem uma ferramenta que não finja o contrário.',
    cta1: 'Começar gratuitamente',
    cta2: 'Ver demonstração',
  },
  B: {
    headline: [
      'Análise qualitativa em que',
      'você constrói o sentido.',
    ],
    sub1:
      'Suas entrevistas, suas interpretações. TRAMA não usa IA para categorizar por você, porque isso já seria uma escolha epistemológica que não é sua.',
    sub2: 'Sem IA. Seus dados ficam com você. Em português.',
    cta1: 'Começar a analisar',
    cta2: 'Ver como funciona',
  },
}

// Ordem epistêmica: "Sem IA" primeiro porque é o argumento central,
// não apenas uma feature de privacidade
const DIFFERENTIALS = [
  { label: 'Sem IA',        desc: 'Você interpreta. A ferramenta organiza.' },
  { label: 'Seus dados',    desc: 'AGPL. Self-hostável. Zero telemetria.' },
  { label: 'PT-BR',         desc: 'Interface e suporte em português.' },
  { label: 'Código aberto', desc: 'github.com/hdmabuse/trama-app' },
  { label: 'Gratuito',      desc: 'Sem plano pago nem cartão.' },
]

// ─── SVG animado da teia ─────────────────────────────────────────────────────

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

      {/* Documento que representa o encontro */}
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

      {/* Seta */}
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

      {/* Teia */}
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

// ─── Componente principal ─────────────────────────────────────────────────────

interface HeroSectionProps {
  variant?: 'A' | 'B'
}

export function HeroSection({ variant = 'A' }: HeroSectionProps) {
  const copy = VARIANTS[variant]
  const [mounted, setMounted] = useState(false)
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => { setMounted(true) }, [])

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

        {/* Nav */}
        <nav className="flex items-center justify-between mb-16" aria-label="Navegação principal">
          <span className="text-[15px] font-medium text-teal-600 dark:text-teal-400 tracking-tight">
            TRAMA
          </span>
          <div className="hidden md:flex items-center gap-8 text-sm text-neutral-500 dark:text-neutral-400">
            <Link href="/documentacao" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Documentação</Link>
            <a href="https://github.com/hdmabuse/trama-app" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 dark:hover:text-white transition-colors">GitHub</a>
            <Link href="/epistemologia" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Epistemologia</Link>
          </div>
          <Link href="/auth/signup" className="px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
            Começar
          </Link>
        </nav>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Copy */}
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-[0.1em] text-teal-600 dark:text-teal-400 mb-5"
              style={{ animation: mounted ? 'fadeSlideUp 0.6s 0ms ease-out both' : 'none' }}
            >
              Análise Qualitativa Reflexiva
            </p>

            <h1
              id="hero-headline"
              className="text-4xl md:text-5xl font-medium leading-[1.15] text-neutral-900 dark:text-white mb-6"
              style={{ animation: mounted ? 'fadeSlideUp 0.6s 80ms ease-out both' : 'none' }}
            >
              {copy.headline.map((line, i) => (
                <span key={i} className={i < copy.headline.length - 1 ? 'block' : ''}>
                  {line}
                </span>
              ))}
            </h1>

            <p
              className="text-base text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4"
              style={{ animation: mounted ? 'fadeSlideUp 0.6s 160ms ease-out both' : 'none' }}
            >
              {copy.sub1}
            </p>

            <p
              className="text-base text-neutral-600 dark:text-neutral-300 leading-relaxed mb-8"
              style={{ animation: mounted ? 'fadeSlideUp 0.6s 200ms ease-out both' : 'none' }}
            >
              {copy.sub2}
            </p>

            <div
              className="flex flex-wrap items-center gap-3 mb-5"
              style={{ animation: mounted ? 'fadeSlideUp 0.6s 260ms ease-out both' : 'none' }}
            >
              <Link
                href="/auth/signup"
                className="px-6 py-3 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 active:scale-[0.98] transition-all duration-150"
                data-analytics-id="hero-cta-primary"
                data-variant={variant}
              >
                {copy.cta1}
              </Link>
              <Link
                href="/demo"
                className="px-6 py-3 text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                data-analytics-id="hero-cta-secondary"
                data-variant={variant}
              >
                {copy.cta2}
              </Link>
            </div>

            <p
              className="text-xs text-neutral-400 dark:text-neutral-500"
              style={{ animation: mounted ? 'fadeSlideUp 0.6s 300ms ease-out both' : 'none' }}
            >
              Sem cartão de crédito · sem IA · seus dados ficam com você · AGPL-3.0
            </p>
          </div>

          {/* SVG teia */}
          <div
            className="relative h-56 md:h-72 lg:h-80"
            style={{ animation: mounted ? 'fadeSlideUp 0.6s 120ms ease-out both' : 'none' }}
            aria-hidden="true"
          >
            <TeiaSVG />
          </div>
        </div>

        {/* Diferenciais */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-14 pt-10 border-t border-neutral-100 dark:border-neutral-800"
          style={{ animation: mounted ? 'fadeSlideUp 0.6s 360ms ease-out both' : 'none' }}
        >
          {DIFFERENTIALS.map((d, i) => (
            <div
              key={d.label}
              className="text-center px-3 py-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800 hover:border-teal-200 dark:hover:border-teal-800 transition-colors duration-150"
              style={{ animation: mounted ? `fadeSlideUp 0.5s ${360 + i * 50}ms ease-out both` : 'none' }}
            >
              <p className="text-xs font-medium text-neutral-700 dark:text-neutral-200 mb-1">{d.label}</p>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-snug hidden sm:block">{d.desc}</p>
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
