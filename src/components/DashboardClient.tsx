"use client"

// src/components/DashboardClient.tsx — versão i18n
// Substitui o arquivo existente integralmente

import Link from "next/link"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { OnboardingModal } from "@/components/workspace/OnboardingModal"
import { TemplateSelector } from "@/components/workspace/TemplateSelector"
import { ExportModal } from "@/components/workspace/ExportModal"

type Project = {
  id: string
  name: string
  description: string | null
  color: string
  updatedAt: string
  owner: { name: string | null }
  _count: { documents: number; codes: number }
}

function MiniTeia({ color }: { color: string }) {
  return (
    <svg width="80" height="60" viewBox="0 0 80 60" aria-hidden="true">
      <line x1="40" y1="30" x2="15" y2="12" stroke={color} strokeWidth="1.5" opacity=".4" />
      <line x1="40" y1="30" x2="65" y2="12" stroke={color} strokeWidth="2" opacity=".4" />
      <line x1="40" y1="30" x2="15" y2="48" stroke={color} strokeWidth="1" opacity=".4" />
      <line x1="40" y1="30" x2="65" y2="48" stroke={color} strokeWidth="1.5" opacity=".4" />
      <circle cx="40" cy="30" r="9" fill={color} opacity=".88" />
      <circle cx="15" cy="12" r="6" fill="#D97706" opacity=".85" />
      <circle cx="65" cy="12" r="7" fill="#4F46E5" opacity=".85" />
      <circle cx="15" cy="48" r="5" fill="#059669" opacity=".8" />
      <circle cx="65" cy="48" r="6" fill="#7C3AED" opacity=".8" />
    </svg>
  )
}

function IconTour() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  )
}

const PLAN_LIMITS: Record<string, number> = { FREE: 3, PRO: 20, TEAM: Infinity }

export function DashboardClient({ projects }: { projects: Project[] }) {
  const t = useTranslations('dashboard')
  const { data: session } = useSession()
  const plan = (session?.user as any)?.plan || "FREE"
  const limit = PLAN_LIMITS[plan] || 3
  const pct = limit === Infinity ? 0 : Math.round((projects.length / limit) * 100)
  const barColor = pct >= 100 ? "bg-red-400" : pct >= 80 ? "bg-yellow-400" : "bg-trama-500"

  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showTemplate, setShowTemplate] = useState(false)
  const [exportProjetoId, setExportProjetoId] = useState<string | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  const focal = projects[0] || null
  const totalDocs = projects.reduce((s, p) => s + p._count.documents, 0)
  const totalCodes = projects.reduce((s, p) => s + p._count.codes, 0)

  // Dica do dia — usa o array do locale corrente via next-intl
  const tips = t.raw('tips') as string[]
  const dica = tips[Math.floor(Date.now() / 86400000) % tips.length]

  useEffect(() => {
    const done = localStorage.getItem("trama_onboarding_done")
    if (!done) { setShowBanner(true); setShowOnboarding(true) }
  }, [])

  function completeTour() {
    localStorage.setItem("trama_onboarding_done", "true")
    setShowOnboarding(false); setShowBanner(false)
  }

  return (
    <main className="flex-1 overflow-y-auto bg-stone-50">

      {showOnboarding && <OnboardingModal onComplete={completeTour} />}
      {showTemplate && <TemplateSelector onClose={() => setShowTemplate(false)} />}
      {exportProjetoId && (() => {
        const p = projects.find(x => x.id === exportProjetoId)
        if (!p) return null
        return (
          <ExportModal
            projetoId={p.id} projetoName={p.name}
            stats={{ documents: p._count.documents, codes: p._count.codes, themes: 0 }}
            onClose={() => setExportProjetoId(null)}
          />
        )
      })()}

      {/* Banner de boas-vindas */}
      {showBanner && (
        <div className="bg-gradient-to-r from-trama-500 to-indigo-500 px-6 md:px-8 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 text-white">
                <IconTour />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{t('banner_title')}</p>
                <p className="text-xs text-white/75">{t('banner_body')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setShowOnboarding(true)}
                className="px-4 py-1.5 bg-white text-trama-600 text-xs font-semibold rounded-lg hover:bg-white/90 transition">
                {t('banner_cta')}
              </button>
              <button onClick={completeTour}
                className="text-white/60 hover:text-white/90 text-2xl leading-none transition"
                aria-label="Dispensar">×</button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 md:p-8">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-stone-800">
              {session?.user?.name ? t('greeting', { name: session.user.name.split(" ")[0] }) : "Painel"}
            </h1>
            <p className="text-sm text-stone-400 mt-0.5">
              {t('projects_count', { count: projects.length })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowOnboarding(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-stone-500 hover:text-trama-500 border border-stone-200 hover:border-trama-300 bg-white rounded-lg transition">
              <IconTour />
              <span className="hidden sm:inline font-medium">{t('tour_button')}</span>
            </button>
            <button onClick={() => setShowTemplate(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-trama-500 hover:bg-trama-600 text-white text-sm font-medium rounded-lg transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
              </svg>
              {t('new_project')}
            </button>
          </div>
        </div>

        {/* Usage bar */}
        {limit !== Infinity && (
          <div className="mb-5 bg-white rounded-lg border border-stone-200 px-4 py-3 flex items-center gap-4">
            <span className="text-xs text-stone-500">
              {t('stat_projects')}: {projects.length}/{limit}
            </span>
            <div className="flex-1 bg-stone-100 rounded-full h-1.5 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            {pct >= 80 && (
              <Link href="/billing/upgrade" className="text-xs text-trama-500 font-medium shrink-0">
                {t('upgrade')}
              </Link>
            )}
          </div>
        )}

        {/* Projeto em foco */}
        {focal && (
          <div className="bg-white rounded-xl border border-stone-200 p-5 mb-5">
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-3">
              {t('focus_label')}
            </p>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded flex-shrink-0" style={{ background: focal.color }} />
                  <span className="font-semibold text-stone-800">{focal.name}</span>
                </div>
                {focal._count.documents > 0 && (
                  <>
                    <div className="bg-stone-100 rounded-full h-1.5 mb-1.5 overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        background: focal.color,
                        width: `${Math.min(Math.round((focal._count.codes / Math.max(focal._count.documents * 5, 1)) * 100), 100)}%`,
                      }} />
                    </div>
                    <p className="text-xs text-stone-400 mb-3">
                      {focal._count.documents} docs · {focal._count.codes} {t('stat_codes').toLowerCase()}
                    </p>
                  </>
                )}
                <div className="flex gap-2 flex-wrap">
                  <Link href={`/projeto/${focal.id}`}
                    className="px-3 py-1.5 bg-trama-500 hover:bg-trama-600 text-white text-xs font-medium rounded-lg transition">
                    {t('continue_analysis')}
                  </Link>
                  <button onClick={() => setExportProjetoId(focal.id)}
                    className="px-3 py-1.5 border border-stone-200 text-stone-600 text-xs font-medium rounded-lg hover:bg-stone-50 transition">
                    {t('export_button')}
                  </button>
                </div>
              </div>
              <div className="hidden sm:flex items-center justify-center w-20 h-16 border border-dashed border-stone-200 rounded-lg">
                <MiniTeia color={focal.color} />
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: t('stat_projects'),   value: projects.length },
            { label: t('stat_documents'),  value: totalDocs },
            { label: t('stat_codes'),      value: totalCodes },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-stone-200 p-4 text-center">
              <p className="text-2xl font-semibold text-stone-800">{s.value}</p>
              <p className="text-xs text-stone-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Dica do dia */}
        <div className="bg-white border-l-4 border-amber-400 rounded-r-xl px-4 py-3 mb-6 text-sm text-stone-600">
          <span className="font-medium text-stone-800">{t('tip_label')} </span>
          {dica}
        </div>

        {/* Grid de projetos */}
        {projects.length > 0 && (
          <>
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-3">
              {t('all_projects')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {projects.map((p) => (
                <div key={p.id}
                  className="bg-white rounded-xl border border-stone-200 p-5 hover:shadow-sm hover:border-stone-300 transition group relative">
                  <Link href={`/projeto/${p.id}`} className="absolute inset-0 rounded-xl" aria-label={p.name} />
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded flex-shrink-0" style={{ background: p.color }} />
                    <span className="font-medium text-stone-800 group-hover:text-trama-500 transition text-sm">
                      {p.name}
                    </span>
                  </div>
                  {p.description && (
                    <p className="text-xs text-stone-400 mb-3 line-clamp-2">{p.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3 text-xs text-stone-400">
                      <span><strong className="text-stone-600">{p._count.documents}</strong> docs</span>
                      <span><strong className="text-stone-600">{p._count.codes}</strong> {t('stat_codes').toLowerCase()}</span>
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); setExportProjetoId(p.id) }}
                      className="relative z-10 text-xs text-stone-400 hover:text-trama-500 transition opacity-0 group-hover:opacity-100">
                      {t('export_button')}
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={() => setShowTemplate(true)}
                className="rounded-xl border-2 border-dashed border-stone-200 hover:border-trama-500 p-5 flex flex-col items-center justify-center min-h-[120px] transition group">
                <div className="w-10 h-10 rounded-xl bg-stone-50 group-hover:bg-trama-50 flex items-center justify-center mb-2 transition">
                  <svg className="w-5 h-5 text-stone-400 group-hover:text-trama-500 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                <span className="text-sm text-stone-400 group-hover:text-trama-500 transition">
                  {t('new_project')}
                </span>
              </button>
            </div>
          </>
        )}

        {/* Empty state */}
        {projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-stone-800 mb-2">{t('empty_title')}</h2>
            <p className="text-sm text-stone-400 max-w-xs mb-6">{t('empty_body')}</p>
            <button onClick={() => setShowTemplate(true)}
              className="px-5 py-2.5 bg-trama-500 hover:bg-trama-600 text-white text-sm font-medium rounded-lg transition mb-3">
              {t('empty_cta')}
            </button>
            <button onClick={() => setShowOnboarding(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-trama-600 hover:text-trama-700 border border-trama-200 hover:border-trama-400 bg-trama-50 hover:bg-trama-100 rounded-lg transition">
              <IconTour />
              {t('empty_tour')}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
