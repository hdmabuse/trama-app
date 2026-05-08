'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

type ExportFormat = 'pdf-full' | 'pdf-themes' | 'csv' | 'md'
interface ExportStats { documents: number; codes: number; themes: number }
interface ExportModalProps { projetoId: string; projetoName?: string; stats: ExportStats; onClose: () => void }

export function ExportModal({ projetoId, projetoName, stats, onClose }: ExportModalProps) {
  const t = useTranslations('export')
  const [format, setFormat] = useState<ExportFormat>('pdf-full')
  const [status, setStatus] = useState<'idle'|'generating'|'done'|'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const FORMATS = [
    { id: 'pdf-full'   as ExportFormat, icon: '📄', label: t('format_pdf_full'),    desc: t('format_pdf_full_desc') },
    { id: 'pdf-themes' as ExportFormat, icon: '🗂', label: t('format_pdf_themes'),  desc: t('format_pdf_themes_desc') },
    { id: 'csv'        as ExportFormat, icon: '📊', label: t('format_csv'),          desc: t('format_csv_desc') },
    { id: 'md'         as ExportFormat, icon: '📝', label: t('format_md'),           desc: t('format_md_desc') },
  ]

  async function handleExport() {
    setStatus('generating'); setErrorMsg('')
    try {
      const res = await fetch(`/api/projetos/${projetoId}/export?format=${format}`)
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Erro') }
      const blob = await res.blob()
      const ext = { 'pdf-full': 'pdf', 'pdf-themes': 'pdf', csv: 'csv', md: 'md' }[format]
      const name = (projetoName || 'trama').replace(/\s+/g, '-').toLowerCase()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `${name}.${ext}`; a.click()
      URL.revokeObjectURL(url)
      setStatus('done'); setTimeout(onClose, 1500)
    } catch (e: any) { setStatus('error'); setErrorMsg(e.message || 'Erro inesperado') }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h2 className="text-base font-semibold text-stone-800 dark:text-white">{t('title')}</h2>
            {projetoName && <p className="text-xs text-stone-400 mt-0.5">{projetoName}</p>}
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xl leading-none">×</button>
        </div>
        <div className="p-5">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">{t('format_label')}</p>
          <div className="space-y-2 mb-5">
            {FORMATS.map(f => (
              <label key={f.id} className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${format === f.id ? 'border-trama-500 bg-trama-50 dark:bg-trama-950/20' : 'border-stone-200 dark:border-stone-700 hover:border-stone-300'}`}>
                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${format === f.id ? 'border-trama-500 bg-trama-500' : 'border-stone-300'}`}>
                  {format === f.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <input type="radio" name="format" value={f.id} checked={format === f.id} onChange={() => setFormat(f.id)} className="sr-only" />
                <div>
                  <p className="text-sm font-medium text-stone-700 dark:text-stone-200">{f.icon} {f.label}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{f.desc}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="bg-stone-50 dark:bg-stone-800/50 rounded-lg p-3 mb-5 text-xs text-stone-500">
            {t('summary', { documents: stats.documents, codes: stats.codes, themes: stats.themes })}
            {format === 'pdf-full' && t('summary_methodology')}
          </div>
          {status === 'error' && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-4">{errorMsg}</p>}
          {status === 'done'  && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2 mb-4">{t('success')}</p>}
          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700 transition-colors">Cancelar</button>
            <button onClick={handleExport} disabled={status === 'generating' || status === 'done'}
              className="px-5 py-2 text-sm font-medium bg-trama-500 hover:bg-trama-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
              {status === 'generating' && (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              )}
              {status === 'generating' ? t('button_loading') : t('button')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
