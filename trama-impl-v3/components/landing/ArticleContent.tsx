/**
 * ArticleContent — renderiza o markdown do artigo com tipografia de leitura
 *
 * Para usar: coloque o artigo em /public/content/codificar-e-interpretar.md
 * ou configure o caminho em ARTICLE_PATH abaixo.
 *
 * Dependências: npm install react-markdown remark-gfm
 */

import { readFile } from 'fs/promises'
import path from 'path'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const ARTICLE_PATH = path.join(process.cwd(), 'public', 'content', 'codificar-e-interpretar.md')

async function getArticleContent(): Promise<string> {
  try {
    return await readFile(ARTICLE_PATH, 'utf-8')
  } catch {
    return `# Artigo temporariamente indisponível\n\nO arquivo do artigo não foi encontrado em \`/public/content/codificar-e-interpretar.md\`.\n\nCopie o arquivo markdown do artigo para esse caminho.`
  }
}

export async function ArticleContent() {
  const content = await getArticleContent()

  return (
    <article
      className="
        max-w-2xl mx-auto px-6 pb-10
        prose prose-neutral dark:prose-invert
        prose-headings:font-medium
        prose-h1:text-2xl prose-h1:mt-10
        prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
        prose-h3:text-base prose-h3:mt-6
        prose-p:text-[15px] prose-p:leading-[1.85]
        prose-p:text-neutral-700 dark:prose-p:text-neutral-300
        prose-blockquote:border-l-teal-500
        prose-blockquote:bg-neutral-50 dark:prose-blockquote:bg-neutral-900
        prose-blockquote:px-5 prose-blockquote:py-3 prose-blockquote:rounded-r-lg
        prose-blockquote:not-italic prose-blockquote:font-normal
        prose-code:text-teal-700 dark:prose-code:text-teal-400
        prose-strong:font-medium
        prose-a:text-teal-600 dark:prose-a:text-teal-400
        prose-a:no-underline hover:prose-a:underline
        max-w-none
      "
      lang="pt-BR"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </article>
  )
}
