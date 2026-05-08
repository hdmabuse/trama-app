import path from 'path'
import { readFile } from 'fs/promises'
import ReactMarkdown from 'react-markdown'
import { getLocale } from 'next-intl/server'

export async function ArticleContent() {
  const locale = await getLocale()

  // Tentar arquivo do locale atual, fallback para pt
  const filenames = [
    `codificar-e-interpretar.${locale}.md`,
    'codificar-e-interpretar.pt.md',
    'codificar-e-interpretar.md',
  ]

  let content = ''
  for (const filename of filenames) {
    try {
      const filePath = path.join(process.cwd(), 'public', 'content', filename)
      content = await readFile(filePath, 'utf-8')
      break
    } catch {
      continue
    }
  }

  if (!content) {
    content = '# Artigo temporariamente indisponível\n\nColoque o arquivo em `/public/content/codificar-e-interpretar.pt.md`.'
  }

  return (
    <article className="prose prose-stone dark:prose-invert max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </article>
  )
}
