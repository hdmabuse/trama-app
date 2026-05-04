'use client'

// Wireframe: es-nodocs
// Condição: documentos === 0. Desaparece quando primeiro doc é importado.
// [1] SVG com stroke animation
// [2] "Usar exemplo" carrega dataset por perfil
// [3] Badges de formato + "Áudio/Vídeo em breve"

interface EmptyStateDocumentsProps {
  onNewDocument: () => void
  onLoadExample: () => void
}

function DocSVG() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <style>{`
        @keyframes strokeIn {
          from { stroke-dashoffset: 200; opacity: 0; }
          to   { stroke-dashoffset: 0;   opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .doc-rect  { stroke-dasharray: 200; stroke-dashoffset: 200; animation: strokeIn 1.1s ease-out 0.1s forwards; }
        .doc-l1    { stroke-dasharray: 50;  stroke-dashoffset: 50;  animation: strokeIn 0.5s ease-out 0.7s forwards; }
        .doc-l2    { stroke-dasharray: 40;  stroke-dashoffset: 40;  animation: strokeIn 0.5s ease-out 0.9s forwards; }
        .doc-l3    { stroke-dasharray: 44;  stroke-dashoffset: 44;  animation: strokeIn 0.5s ease-out 1.1s forwards; }
        .doc-badge { animation: fadeUp 0.5s ease-out 1.4s both; }
      `}</style>

      <rect className="doc-rect" x="10" y="6" width="36" height="46" rx="4"
        stroke="#0D9488" strokeWidth="2" fill="#F0FDF9" />
      <line className="doc-l1" x1="18" y1="20" x2="38" y2="20"
        stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round" />
      <line className="doc-l2" x1="18" y1="29" x2="34" y2="29"
        stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round" />
      <line className="doc-l3" x1="18" y1="38" x2="36" y2="38"
        stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round" />
      <g className="doc-badge">
        <rect x="31" y="42" width="26" height="14" rx="7" fill="#0D9488" />
        <text x="44" y="52" textAnchor="middle" fontSize="7" fill="white" fontWeight="600">código</text>
      </g>
    </svg>
  )
}

export function EmptyStateDocuments({ onNewDocument, onLoadExample }: EmptyStateDocumentsProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center min-h-[400px]">
      <div className="mb-6"><DocSVG /></div>

      <h2 className="text-xl font-medium text-stone-800 dark:text-white mb-2">
        Importe sua primeira transcrição
      </h2>
      <p className="text-sm text-stone-500 dark:text-stone-400 max-w-sm leading-relaxed mb-2">
        Cole uma entrevista transcrita, carregue um arquivo ou comece com nosso exemplo.
        TRAMA suporta TXT, MD, PDF e DOCX.
      </p>
      <p className="text-xs text-stone-400 dark:text-stone-500 max-w-xs leading-relaxed mb-8">
        Dica: importe todos os documentos antes de começar a codificar — fica mais fácil
        identificar padrões quando se tem o material completo.
      </p>

      <div className="flex gap-3 flex-wrap justify-center mb-6">
        <button onClick={onNewDocument}
          className="px-5 py-2.5 bg-trama-500 hover:bg-trama-600 text-white text-sm font-medium rounded-lg transition-colors">
          + Novo Documento
        </button>
        <button onClick={onLoadExample}
          className="px-5 py-2.5 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-sm font-medium rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
          Usar exemplo de pesquisa
        </button>
      </div>

      <div className="flex gap-2 flex-wrap justify-center">
        {['TXT', 'MD', 'PDF', 'DOCX'].map(f => (
          <span key={f} className="px-2.5 py-1 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 text-xs rounded border border-stone-200 dark:border-stone-700">
            {f}
          </span>
        ))}
        <span className="px-2.5 py-1 bg-stone-50 dark:bg-stone-900 text-stone-400 dark:text-stone-600 text-xs rounded border border-dashed border-stone-200 dark:border-stone-700">
          Áudio/Vídeo em breve
        </span>
      </div>
    </div>
  )
}
