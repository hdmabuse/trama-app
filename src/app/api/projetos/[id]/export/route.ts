// API: GET /api/projetos/[id]/export?format=pdf-full|pdf-themes|csv|md
// Wireframe: export — download automático após geração

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

type ExportFormat = 'pdf-full' | 'pdf-themes' | 'csv' | 'md'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const format = (searchParams.get('format') || 'md') as ExportFormat

  // Verificar acesso ao projeto
  const projeto = await prisma.project.findFirst({
    where: {
      id: params.id,
      OR: [
        { ownerId: (session.user as any).id },
        { members: { some: { userId: (session.user as any).id } } },
      ],
    },
    include: {
      documents: {
        include: {
          codings: {
            include: {
              code: true,
            },
          },
        },
      },
      codes: {
        include: {
          _count: { select: { codings: true } },
        },
      },
      themes: {
        include: {
          themeCodes: { include: { code: true } },
        },
      },
    },
  })

  if (!projeto) {
    return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
  }

  // ─── Gerar Markdown ──────────────────────────────────────────────────────────
  if (format === 'md') {
    const md = buildMarkdown(projeto)
    return new NextResponse(md, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${slugify(projeto.name)}.md"`,
      },
    })
  }

  // ─── Gerar CSV ───────────────────────────────────────────────────────────────
  if (format === 'csv') {
    const csv = buildCSV(projeto)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${slugify(projeto.name)}.csv"`,
      },
    })
  }

  // ─── PDF (narrativo ou só temas) ────────────────────────────────────────────
  // Retorna Markdown enquanto não há gerador de PDF integrado.
  // Para PDF real: integrar @react-pdf/renderer ou puppeteer.
  const md = buildMarkdown(projeto, format === 'pdf-themes')
  return new NextResponse(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slugify(projeto.name)}.md"`,
      'X-Export-Note': 'PDF rendering requires server-side integration',
    },
  })
}

// ─── Builders ────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function buildMarkdown(projeto: any, themesOnly = false): string {
  const lines: string[] = []
  const now = new Date().toLocaleDateString('pt-BR')

  lines.push(`# ${projeto.name}`)
  lines.push(``)
  lines.push(`**Exportado em:** ${now}  `)
  lines.push(`**Documentos:** ${projeto.documents.length} · **Códigos:** ${projeto.codes.length} · **Temas:** ${projeto.themes.length}`)
  lines.push(``)

  if (projeto.themes.length > 0) {
    lines.push(`## Temas`)
    lines.push(``)
    for (const theme of projeto.themes) {
      lines.push(`### ${theme.name}`)
      lines.push(``)
      if (theme.description) {
        lines.push(theme.description)
        lines.push(``)
      }
      if (theme.themeCodes.length > 0) {
        lines.push(`**Códigos:** ${theme.themeCodes.map((tc: any) => tc.code.name).join(', ')}`)
        lines.push(``)
      }

      if (!themesOnly) {
        // Citações por código deste tema
        for (const themeCode of theme.themeCodes) {
          const code = themeCode.code
          const codings = projeto.documents.flatMap((d: any) =>
            d.codings.filter((c: any) => c.codeId === code.id)
          )
          if (codings.length > 0) {
            lines.push(`#### ${code.name}`)
            lines.push(``)
            for (const coding of codings.slice(0, 5)) {
              if (coding.text) {
                lines.push(`> "${coding.text}"`)
                lines.push(``)
              }
            }
          }
        }
      }
    }
  }

  if (!themesOnly && projeto.codes.length > 0) {
    lines.push(`## Todos os Códigos`)
    lines.push(``)
    lines.push(`| Código | Menções |`)
    lines.push(`|--------|---------|`)
    for (const code of projeto.codes) {
      lines.push(`| ${code.name} | ${code._count.codings} |`)
    }
    lines.push(``)
  }

  lines.push(`---`)
  lines.push(``)
  lines.push(`*Gerado pelo TRAMA — Análise Qualitativa Reflexiva*`)
  lines.push(`*A interpretação é sua. A ferramenta apenas organiza.*`)

  return lines.join('\n')
}

function buildCSV(projeto: any): string {
  const rows: string[][] = [
    ['Tema', 'Código', 'Documento', 'Citação', 'Data'],
  ]

  for (const theme of projeto.themes) {
    for (const themeCode of theme.themeCodes) {
      const code = themeCode.code
      const codings = projeto.documents.flatMap((d: any) =>
        d.codings
          .filter((c: any) => c.codeId === code.id)
          .map((c: any) => ({ ...c, documentName: d.title || d.filename || 'Documento' }))
      )
      for (const coding of codings) {
        rows.push([
          theme.name,
          code.name,
          coding.documentName,
          (coding.text || '').replace(/"/g, '""'),
          coding.createdAt ? new Date(coding.createdAt).toLocaleDateString('pt-BR') : '',
        ])
      }
    }
  }

  return rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n')
}
