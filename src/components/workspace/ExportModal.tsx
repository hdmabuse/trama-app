'use client'

import { useState } from 'react'

// Wireframe: export
// [1] Acessível via botão Exportar no dashboard e toolbar
// [2] Gerar PDF: botão vira "Gerando..." + spinner. Download automático.
// [3] Resumo do conteúdo incluído antes de confirmar.

type ExportFormat = 'pdf-full' | 'pdf-themes' | 'csv' | 'md'

interface ExportStats {
  documents: number
  codes: number
  themes: number
}

interface ExportModalProps {
  projetoId: string
  projetoName?: string
  stats: ExportStats
  onClose: () => void
}

const FORMATS: { id: ExportFormat; icon: string; label: string; desc: string }[] = [
  {
    id: 'pdf-full',
    icon: '📄',
    label: 'Relatório Completo (PDF)',
    desc: 'Capa · Resumo Executivo · Análise por Tema · Metodologia',
  },
  {
    id: 'pdf-themes',
    icon: '🗂',
    label: 'Apenas Temas (PDF)',
    desc: 'Versão compacta — sem citações detalhadas, ideal para apresentações',
  },
  {
    id: 'csv',
    icon: '📊',
    label: 'Dados Brutos (CSV)',
    desc: 'Tabela plana: Tema | Código | Documento | Citação | Data',
  },
  {
    id: 'md',
    icon: '📝',
    label: 'Markdown (.md)',
    desc: 'Estrutura com headings — versionável em Git, editável em qualquer editor',
  },
]

export function ExportModal({ projetoId, projetoName, stats, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('pdf-full')
  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleExport() {
    setStatus('generating')
    setErrorMsg('')
    try {
      const res = await fetch(`/api/projetos/${projetoId}/export?format=${format}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Erro ao gerar exportação')
      }
      const blob = await res.blob()
      const ext = { 'pdf-full': 'pdf', 'pdf-themes': 'pdf', csv: 'csv', md: 'md' }[format]
      const name = (projetoName || 'trama').replace(/\s+/g, '-').toLowerCase()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${name}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
      setStatus('done')
      setTimeout(onClose, 1500)
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err.message || 'Erro inesperado')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 w-full max-w-lg shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h2 className="text-base font-semibold text-stone-800 dark:text-white">Exportar Análise</h2>
            {projetoName && <p className="text-xs text-stone-400 mt-0.5">{projetoName}</p>}
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xl leading-none">×</button>
        </div>

        <div className="p-5">
          {/* Formato */}
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
            Formato de exportação
          </p>

          <div className="space-y-2 mb-5">
            {FORMATS.map(f => (
              <label key={f.id}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                  format === f.id
                    ? 'border-trama-500 bg-trama-50 dark:bg-trama-950/20'
                    : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                }`}>
                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  format === f.id ? 'border-trama-500 bg-trama-500' : 'border-stone-300 dark:border-stone-600'
                }`}>
                  {format === f.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <input type="radio" name="format" value={f.id} checked={format === f.id}
                  onChange={() => setFormat(f.id)} className="sr-only" />
                <div>
                  <p className="text-sm font-medium text-stone-700 dark:text-stone-200">{f.icon} {f.label}</p>
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{f.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Resumo do conteúdo */}
          <div className="bg-stone-50 dark:bg-stone-800/50 rounded-lg p-3 mb-5 text-xs text-stone-500 dark:text-stone-400">
            <span className="font-medium text-stone-700 dark:text-stone-300">O relatório incluirá: </span>
            {stats.documents} documentos · {stats.codes} códigos · {stats.themes} temas
            {format === 'pdf-full' && ' · 3–5 citações por tema · metodologia reflexiva'}
          </div>

          {status === 'error' && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-2 mb-4">{errorMsg}</p>
          )}
          {status === 'done' && (
            <p className="text-sm text-green-600 bg-green-50 dark:bg-green-950/20 rounded-lg px-3 py-2 mb-4">✓ Download iniciado</p>
          )}

          {/* Botões */}
          <div className="flex gap-3 justify-end">
            <button onClick={onClose}
              className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 transition-colors">
              Cancelar
            </button>
            <button onClick={handleExport}
              disabled={status === 'generating' || status === 'done'}
              className="px-5 py-2 text-sm font-medium bg-trama-500 hover:bg-trama-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
              {status === 'generating' && (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              )}
              {status === 'generating' ? 'Gerando...' : 'Gerar exportação'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
