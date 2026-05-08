'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface TemplateSelectorProps { onClose: () => void }

export function TemplateSelector({ onClose }: TemplateSelectorProps) {
  const t = useTranslations('templates')
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const TEMPLATES = [
    { id: 'pesquisa-usuario',    icon: '👥', name: t('t1_name'), desc: t('t1_desc'), codes: ['Dor','Ganho','Tarefa','Contexto'] },
    { id: 'analise-feedback',    icon: '💬', name: t('t2_name'), desc: t('t2_desc'), codes: ['Problema','Sugestão','Elogio'] },
    { id: 'pesquisa-etnografica',icon: '🔭', name: t('t3_name'), desc: t('t3_desc'), codes: ['Prática','Artefato','Narrativa','Valor'] },
    { id: 'analise-futuro',      icon: '🌀', name: t('t4_name'), desc: t('t4_desc'), codes: ['Tendência','Oportunidade','Ameaça'] },
  ]

  async function create(templateId: string | null) {
    if (!nome.trim()) { setError(t('error_name')); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/projetos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nome.trim(), templateId }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || t('error_create')) }
      const projeto = await res.json()
      router.push(`/projeto/${projeto.id}`)
    } catch (e: any) { setError(e.message); setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 w-full max-w-2xl shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h2 className="text-base font-semibold text-stone-800 dark:text-white">{t('title')}</h2>
            <p className="text-xs text-stone-400 mt-0.5">{t('subtitle')}</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xl leading-none">×</button>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-3 mb-5">
            {TEMPLATES.map(tmpl => (
              <button key={tmpl.id} onClick={() => setSelected(selected === tmpl.id ? null : tmpl.id)}
                className={`text-left p-4 rounded-xl border-2 transition-all relative ${selected === tmpl.id ? 'border-trama-500 bg-trama-50 dark:bg-trama-950/20' : 'border-stone-200 dark:border-stone-700 hover:border-stone-300'}`}>
                {selected === tmpl.id && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-trama-500 flex items-center justify-center">
                    <span className="text-white text-xs leading-none">✓</span>
                  </div>
                )}
                <div className="text-2xl mb-2">{tmpl.icon}</div>
                <p className="text-sm font-medium text-stone-800 dark:text-white mb-1">{tmpl.name}</p>
                <p className="text-xs text-stone-400 mb-3">{tmpl.desc}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {tmpl.codes.map(c => (
                    <span key={c} className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 text-[10px] rounded-full border border-stone-200 dark:border-stone-700">{c}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
          <div className="flex gap-3 items-center mb-2">
            <input type="text" value={nome} onChange={e => { setNome(e.target.value); setError('') }}
              placeholder={t('name_placeholder')} autoFocus
              onKeyDown={e => e.key === 'Enter' && create(selected)}
              className="flex-1 px-3.5 py-2.5 border border-stone-200 dark:border-stone-700 rounded-lg text-sm bg-white dark:bg-stone-800 text-stone-800 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-trama-500/30 focus:border-trama-500 transition" />
            <button onClick={() => create(selected)} disabled={loading}
              className="px-5 py-2.5 text-sm font-medium bg-trama-500 hover:bg-trama-600 text-white rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap">
              {loading ? '...' : t('create_button')}
            </button>
          </div>
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
          <p className="text-xs text-stone-400">
            Ou <button onClick={() => create(null)} className="text-trama-500 hover:text-trama-700 font-medium transition-colors">{t('blank_canvas')}</button>
          </p>
        </div>
      </div>
    </div>
  )
}
