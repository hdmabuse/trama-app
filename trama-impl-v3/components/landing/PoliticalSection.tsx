'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

// ─── Dados — v3 ───────────────────────────────────────────────────────────────
// Mudanças v2 → v3:
// - Remove cards de autores (TheoristCard com nome/obra/síntese)
// - Substitui por cards de CONCEITO sem name-dropping no corpo
// - Autores movidos para notas de rodapé numeradas [1][2][3]
// - Headline muda de citação de 4 linhas para argumento central
// - Sem travessões em todo o copy

const CONCEPTS = [
  {
    id: 'dado-encontro',
    title: 'O dado não precede o encontro',
    body: 'Registrar, transcrever e codificar são todos atos de produção, não de captura. O que você nomeia como "barreira de acesso" já é resultado de um processo que começou antes da transcrição e continua depois dela. A ferramenta que trata o dado como objeto estável falsifica esse processo.',
    footnoteRef: 1,
    accentColor: '#0D9488',
  },
  {
    id: 'versao-possivel',
    title: 'Toda interpretação é uma versão possível, não a versão correta',
    body: 'Nomear um trecho é construir uma leitura entre outras leituras legítimas. A validade da análise não vem da eliminação das outras leituras possíveis, mas da explicitação de por que esta leitura, feita deste lugar, com estas perguntas. Reflexividade não é confissão, é método.',
    footnoteRef: 2,
    accentColor: '#7C3AED',
  },
  {
    id: 'ferramenta-nao-neutra',
    title: 'A ferramenta não é neutra, e fingir que é custa caro',
    body: 'Uma interface que organiza dados em hierarquias já sugere que o conhecimento é hierárquico. Um sistema que usa IA para sugerir categorias já decidiu que categorias existem antes do encontro. Essas não são escolhas técnicas, são posições epistemológicas inscritas em código. TRAMA recusa essa opacidade.',
    footnoteRef: 3,
    accentColor: '#D97706',
  },
]

const FOOTNOTES = [
  {
    ref: 1,
    text: 'A co-produção do dado no encontro etnográfico é desenvolvida em Ingold, T. Being Alive (2011) e Latour, B. Reassembling the Social (2005). A crítica à separação coleta/análise como ficção metodológica aparece em Clifford, J.; Marcus, G. (orgs.). Writing Culture (1986).',
  },
  {
    ref: 2,
    text: 'O conceito de reflexividade como método está em Braun, V.; Clarke, V. Reflecting on reflexive thematic analysis. Qualitative Research in Sport, Exercise and Health, v. 11, n. 4, p. 589-597, 2019. A impossibilidade de uma versão universal está em Haraway, D. Situated Knowledges. Feminist Studies, v. 14, n. 3, p. 575-599, 1988.',
  },
  {
    ref: 3,
    text: 'A tecnologia como expressão de condições históricas, nunca neutra, está em Vieira Pinto, Á. O Conceito de Tecnologia (2005). A distinção entre consciência ingênua e crítica em relação às ferramentas está em Vieira Pinto, Á. Consciência e Realidade Nacional. ISEB, 1960, v. 1, p. 83.',
  },
]

// ─── Card de conceito ─────────────────────────────────────────────────────────

interface ConceptCardProps {
  id: string
  title: string
  body: string
  footnoteRef: number
  accentColor: string
  delay: number
  visible: boolean
}

function ConceptCard({
  id,
  title,
  body,
  footnoteRef,
  accentColor,
  delay,
  visible,
}: ConceptCardProps) {
  return (
    <article
      id={`concept-${id}`}
      className="border border-[#374151] rounded-lg p-5 bg-[#1F2937] flex flex-col gap-3"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.6s ${delay}ms ease-out, transform 0.6s ${delay}ms ease-out`,
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      <h3 className="text-sm font-medium text-[#D1D5DB] leading-snug">
        {title}
        <sup className="ml-1 text-[10px]" style={{ color: accentColor }}>
          <a href={`#fn${footnoteRef}`} aria-label={`Nota de rodapé ${footnoteRef}`}>
            [{footnoteRef}]
          </a>
        </sup>
      </h3>
      <p className="text-[12px] text-[#9CA3AF] leading-relaxed">{body}</p>
    </article>
  )
}

// ─── Notas de rodapé ─────────────────────────────────────────────────────────

function SectionFootnotes({
  notes,
  visible,
}: {
  notes: typeof FOOTNOTES
  visible: boolean
}) {
  return (
    <ol
      className="mt-10 border-t border-[#1F2937] pt-6 space-y-3"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s 900ms ease-out',
      }}
      aria-label="Referências bibliográficas"
    >
      {notes.map((note) => (
        <li key={note.ref} id={`fn${note.ref}`} className="flex gap-3">
          <span
            className="text-[11px] font-medium flex-shrink-0"
            style={{ color: '#6B7280' }}
            aria-hidden="true"
          >
            [{note.ref}]
          </span>
          <p className="text-[11px] text-[#6B7280] leading-relaxed">{note.text}</p>
        </li>
      ))}
    </ol>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function PoliticalSection() {
  const [visible, setVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      aria-labelledby="political-headline"
      className="bg-[#0F1117] py-20 px-6 md:px-12 lg:px-20"
    >
      <div className="max-w-3xl mx-auto">

        {/* Overline */}
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.1em] text-teal-500 mb-6 text-center"
          style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s 0ms ease-out' }}
        >
          Posicionamento epistemológico
        </p>

        {/* Headline — argumento, não citação */}
        <h2
          id="political-headline"
          className="text-center mb-6"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.7s 80ms ease-out, transform 0.7s 80ms ease-out',
          }}
        >
          <span className="block text-[26px] md:text-[30px] font-medium text-[#F9FAFB] leading-[1.45]">
            Toda ferramenta de análise<br />
            pressupõe uma teoria do dado.
          </span>
        </h2>

        {/* Corpo */}
        <div
          className="space-y-4 text-[13px] text-[#9CA3AF] leading-[1.8] text-center max-w-xl mx-auto mb-12"
          style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s 200ms ease-out' }}
        >
          <p>
            A maioria pressupõe que o dado existe antes de você chegar, que a análise vem depois do campo, e que interpretar é encontrar o que já estava lá. Esse pressuposto está errado, e as consequências de aceitá-lo sem exame aparecem nos resultados.
          </p>
          <p>
            O dado é co-produzido no encontro entre pesquisadora, interlocutor e contexto. A separação entre coleta e análise é uma ficção metodológica conveniente, não uma descrição do que acontece. E a ferramenta que você usa para organizar sua análise já carrega uma teoria sobre o que o dado é, mesmo que não diga isso em nenhum lugar.
          </p>
          <p className="font-medium text-[#D1D5DB]">TRAMA diz.</p>
        </div>

        {/* Cards de conceito */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {CONCEPTS.map((concept, i) => (
            <ConceptCard
              key={concept.id}
              {...concept}
              delay={300 + i * 120}
              visible={visible}
            />
          ))}
        </div>

        {/* Blockquote */}
        <blockquote
          className="bg-[#111827] border-l-[3px] border-teal-600 rounded-r-lg px-5 py-4 mb-10 max-w-2xl mx-auto"
          style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s 680ms ease-out' }}
        >
          <p className="text-[12px] text-[#E5E7EB] leading-[1.8] italic">
            &ldquo;Você não encontra o dado. Você o produz: no campo, na transcrição, na leitura. A ferramenta que não reconhece isso não é neutra, é ingênua.&rdquo;
          </p>
          <footer className="mt-2 text-[11px] text-[#6B7280]">
            Do artigo <cite>Codificar é Interpretar</cite>, baseado em Ingold (2011), Braun &amp; Clarke (2019) e Haraway (1988)
          </footer>
        </blockquote>

        {/* CTA */}
        <div
          className="text-center mb-2"
          style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s 780ms ease-out' }}
        >
          <Link
            href="/epistemologia"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm border border-[#374151] text-[#9CA3AF] rounded-lg hover:border-[#4B5563] hover:text-[#D1D5DB] transition-all duration-150"
            data-analytics-id="political-section-article-link"
          >
            Ler o artigo completo
            <span aria-hidden="true">&#8594;</span>
          </Link>
        </div>

        {/* Notas de rodapé */}
        <SectionFootnotes notes={FOOTNOTES} visible={visible} />

      </div>
    </section>
  )
}

export default PoliticalSection
