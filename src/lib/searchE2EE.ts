/**
 * src/lib/searchE2EE.ts
 *
 * Busca client-side para projetos E2EE.
 * O índice é construído na memória após descriptografar os documentos.
 * O índice é destruído ao fechar o modal de busca.
 * Nenhuma query é enviada ao servidor.
 */

'use client'

import { keyStore } from './keyStore'
import { decrypt } from './crypto'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface SearchDocument {
  id: string
  title: string
  content: string
  filename: string | null
}

interface SearchResult {
  documentId: string
  documentTitle: string
  snippet: string
  score: number
}

// ─── Índice em memória ────────────────────────────────────────────────────────

class E2EESearchIndex {
  private documents: SearchDocument[] = []
  private built = false

  async build(
    rawDocuments: Array<{
      id: string
      title: string
      filename: string | null
      content: string | null
      contentEncrypted: string | null
      contentIv: string | null
      isEncrypted: boolean
    }>,
    projectId: string
  ): Promise<void> {
    const key = keyStore.getProjectKey(projectId)
    if (!key) throw new Error('Chave do projeto não disponível para busca')

    this.documents = await Promise.all(
      rawDocuments.map(async (doc) => {
        const content = doc.isEncrypted && doc.contentEncrypted && doc.contentIv
          ? await decrypt({ ciphertext: doc.contentEncrypted, iv: doc.contentIv }, key)
          : (doc.content ?? '')

        return {
          id: doc.id,
          title: doc.title || doc.filename || 'Documento',
          filename: doc.filename,
          content,
        }
      })
    )

    this.built = true
  }

  search(query: string, maxResults = 20): SearchResult[] {
    if (!this.built || !query.trim()) return []

    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const results: SearchResult[] = []

    for (const doc of this.documents) {
      const content = doc.content.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const title = doc.title.toLowerCase()

      // Score simples: título bate mais forte que conteúdo
      let score = 0
      if (title.includes(q)) score += 10

      const matches: number[] = []
      let idx = content.indexOf(q)
      while (idx !== -1) {
        matches.push(idx)
        score += 1
        idx = content.indexOf(q, idx + 1)
      }

      if (score > 0) {
        // Extrair snippet ao redor da primeira ocorrência
        const firstMatch = matches[0] ?? 0
        const start = Math.max(0, firstMatch - 80)
        const end = Math.min(doc.content.length, firstMatch + q.length + 80)
        let snippet = doc.content.slice(start, end)
        if (start > 0) snippet = '...' + snippet
        if (end < doc.content.length) snippet = snippet + '...'

        results.push({
          documentId: doc.id,
          documentTitle: doc.title,
          snippet: snippet.replace(/\n+/g, ' '),
          score,
        })
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
  }

  clear(): void {
    this.documents = []
    this.built = false
  }

  isBuilt(): boolean {
    return this.built
  }
}

// ─── Hook de busca E2EE ───────────────────────────────────────────────────────

import { useCallback, useRef, useState } from 'react'

interface UseE2EESearchReturn {
  search: (query: string) => SearchResult[]
  buildIndex: (documents: Parameters<E2EESearchIndex['build']>[0], projectId: string) => Promise<void>
  indexReady: boolean
  indexing: boolean
  clear: () => void
}

export function useE2EESearch(): UseE2EESearchReturn {
  const indexRef = useRef(new E2EESearchIndex())
  const [indexReady, setIndexReady] = useState(false)
  const [indexing, setIndexing] = useState(false)

  const buildIndex = useCallback(async (
    documents: Parameters<E2EESearchIndex['build']>[0],
    projectId: string
  ) => {
    setIndexing(true)
    try {
      await indexRef.current.build(documents, projectId)
      setIndexReady(true)
    } catch (e) {
      console.error('[E2EE Search] Erro ao construir índice:', e)
    } finally {
      setIndexing(false)
    }
  }, [])

  const search = useCallback((query: string): SearchResult[] => {
    return indexRef.current.search(query)
  }, [])

  const clear = useCallback(() => {
    indexRef.current.clear()
    setIndexReady(false)
  }, [])

  return { search, buildIndex, indexReady, indexing, clear }
}
