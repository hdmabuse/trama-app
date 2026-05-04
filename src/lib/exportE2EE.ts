/**
 * src/lib/exportE2EE.ts
 *
 * Exportação client-side para projetos com E2EE.
 * O servidor NÃO participa da descriptografia — todo o processamento
 * ocorre no browser com as chaves em memória.
 *
 * Formatos: Markdown, CSV
 * Para PDF: usar jsPDF no browser (instalação: npm install jspdf)
 */

'use client'

import { keyStore } from './keyStore'
import { decrypt } from './crypto'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface EncryptedDocument {
  id: string
  title: string
  filename: string | null
  contentEncrypted: string | null
  contentIv: string | null
  content: string | null
  isEncrypted: boolean
  codings: EncryptedCoding[]
}

interface EncryptedCoding {
  id: string
  textEncrypted: string | null
  textIv: string | null
  text: string | null
  isEncrypted: boolean
  code: { id: string; name: string; nameEncrypted: string | null; nameIv: string | null; isEncrypted: boolean }
}

interface EncryptedTheme {
  id: string
  nameEncrypted: string | null
  nameIv: string | null
  name: string
  isEncrypted: boolean
  description: string | null
  descriptionEncrypted: string | null
  descriptionIv: string | null
  themeCodes: { code: { id: string; name: string } }[]
}

interface ProjectData {
  id: string
  name: string
  documents: EncryptedDocument[]
  themes: EncryptedTheme[]
  codes: { id: string; name: string; _count: { codings: number } }[]
}

// ─── Descriptografar dados do projeto ────────────────────────────────────────

async function decryptProjectData(
  project: ProjectData,
  projectId: string
): Promise<{
  documents: Array<{ title: string; content: string; codings: Array<{ text: string; codeName: string }> }>
  themes: Array<{ name: string; description: string | null; codes: string[] }>
  codes: Array<{ name: string; count: number }>
}> {
  const key = keyStore.getProjectKey(projectId)
  if (!key) throw new Error('Chave do projeto não disponível')

  // Descriptografar documentos e codificações
  const documents = await Promise.all(
    project.documents.map(async (doc) => {
      const content = doc.isEncrypted && doc.contentEncrypted && doc.contentIv
        ? await decrypt({ ciphertext: doc.contentEncrypted, iv: doc.contentIv }, key)
        : (doc.content ?? '')

      const codings = await Promise.all(
        doc.codings.map(async (c) => {
          const text = c.isEncrypted && c.textEncrypted && c.textIv
            ? await decrypt({ ciphertext: c.textEncrypted, iv: c.textIv }, key)
            : (c.text ?? '')

          const codeName = c.code.isEncrypted && c.code.nameEncrypted && c.code.nameIv
            ? await decrypt({ ciphertext: c.code.nameEncrypted, iv: c.code.nameIv }, key)
            : c.code.name

          return { text, codeName }
        })
      )

      return {
        title: doc.title || doc.filename || 'Documento',
        content,
        codings,
      }
    })
  )

  // Descriptografar temas
  const themes = await Promise.all(
    project.themes.map(async (theme) => {
      const name = theme.isEncrypted && theme.nameEncrypted && theme.nameIv
        ? await decrypt({ ciphertext: theme.nameEncrypted, iv: theme.nameIv }, key)
        : theme.name

      const description = theme.isEncrypted && theme.descriptionEncrypted && theme.descriptionIv
        ? await decrypt({ ciphertext: theme.descriptionEncrypted, iv: theme.descriptionIv }, key)
        : theme.description

      return {
        name,
        description,
        codes: theme.themeCodes.map(tc => tc.code.name),
      }
    })
  )

  const codes = project.codes.map(c => ({ name: c.name, count: c._count.codings }))

  return { documents, themes, codes }
}

// ─── Gerar Markdown ───────────────────────────────────────────────────────────

export async function exportToMarkdown(
  project: ProjectData,
  projectId: string
): Promise<void> {
  const { documents, themes, codes } = await decryptProjectData(project, projectId)
  const now = new Date().toLocaleDateString('pt-BR')

  const lines: string[] = [
    `# ${project.name}`,
    ``,
    `**Exportado em:** ${now}  `,
    `**Documentos:** ${documents.length} · **Códigos:** ${codes.length} · **Temas:** ${themes.length}`,
    ``,
    `> ⚠️ Este arquivo foi gerado por exportação E2EE. O conteúdo foi descriptografado localmente no seu browser.`,
    ``,
  ]

  if (themes.length > 0) {
    lines.push(`## Análise Temática`, ``)
    for (const theme of themes) {
      lines.push(`### ${theme.name}`, ``)
      if (theme.description) { lines.push(theme.description, ``) }
      if (theme.codes.length > 0) {
        lines.push(`**Códigos:** ${theme.codes.join(', ')}`, ``)
      }

      // Citações por tema
      for (const doc of documents) {
        const relevant = doc.codings.filter(c => theme.codes.includes(c.codeName))
        for (const coding of relevant.slice(0, 5)) {
          if (coding.text) {
            lines.push(`> "${coding.text}"`, ``)
            lines.push(`*${doc.title}*`, ``)
          }
        }
      }
    }
  }

  if (codes.length > 0) {
    lines.push(`## Todos os Códigos`, ``)
    lines.push(`| Código | Menções |`)
    lines.push(`|--------|---------|`)
    for (const code of codes) {
      lines.push(`| ${code.name} | ${code.count} |`)
    }
    lines.push(``)
  }

  lines.push(`---`, ``)
  lines.push(`*Gerado pelo TRAMA — Análise Qualitativa Reflexiva*`)
  lines.push(`*A interpretação é sua. A ferramenta apenas organiza.*`)

  downloadText(lines.join('\n'), `${slugify(project.name)}.md`, 'text/markdown')
}

// ─── Gerar CSV ────────────────────────────────────────────────────────────────

export async function exportToCSV(
  project: ProjectData,
  projectId: string
): Promise<void> {
  const { documents, themes } = await decryptProjectData(project, projectId)

  const rows: string[][] = [
    ['Tema', 'Código', 'Documento', 'Citação'],
  ]

  for (const theme of themes) {
    for (const codeName of theme.codes) {
      for (const doc of documents) {
        const codings = doc.codings.filter(c => c.codeName === codeName)
        for (const coding of codings) {
          rows.push([
            theme.name,
            codeName,
            doc.title,
            (coding.text || '').replace(/"/g, '""'),
          ])
        }
      }
    }
  }

  const csv = rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n')
  downloadText(csv, `${slugify(project.name)}.csv`, 'text/csv')
}

// ─── Gerar PDF (via jsPDF no browser) ────────────────────────────────────────

export async function exportToPDF(
  project: ProjectData,
  projectId: string
): Promise<void> {
  const { documents, themes, codes } = await decryptProjectData(project, projectId)

  try {
    // Importação dinâmica — jsPDF não é necessário se PDF não for usado
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ format: 'a4', unit: 'mm' })

    const margin = 20
    const pageWidth = 210
    const maxWidth = pageWidth - margin * 2
    let y = margin

    const addLine = (text: string, size = 11, bold = false): void => {
      doc.setFontSize(size)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      const lines = doc.splitTextToSize(text, maxWidth)
      for (const line of lines) {
        if (y > 270) { doc.addPage(); y = margin }
        doc.text(line, margin, y)
        y += size * 0.4 + 1
      }
      y += 2
    }

    // Capa
    addLine(project.name, 20, true)
    addLine(`Análise Qualitativa Reflexiva — TRAMA`, 12)
    addLine(new Date().toLocaleDateString('pt-BR'), 10)
    addLine(`${documents.length} documentos · ${codes.length} códigos · ${themes.length} temas`, 10)
    y += 10

    // Temas
    if (themes.length > 0) {
      addLine('Análise Temática', 16, true)
      y += 4

      for (const theme of themes) {
        addLine(theme.name, 14, true)
        if (theme.description) addLine(theme.description, 11)
        addLine(`Códigos: ${theme.codes.join(', ')}`, 10)
        y += 4

        for (const doc of documents) {
          const relevant = doc.codings.filter(c => theme.codes.includes(c.codeName))
          for (const coding of relevant.slice(0, 3)) {
            if (coding.text) {
              addLine(`"${coding.text}"`, 10)
              addLine(`— ${doc.title}`, 9)
              y += 2
            }
          }
        }
        y += 4
      }
    }

    doc.save(`${slugify(project.name)}.pdf`)
  } catch (err) {
    // jsPDF não instalado — fallback para Markdown
    console.warn('[E2EE Export] jsPDF não disponível, usando Markdown')
    await exportToMarkdown(project, projectId)
  }
}

// ─── Utilitários ─────────────────────────────────────────────────────────────

function downloadText(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType}; charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}
