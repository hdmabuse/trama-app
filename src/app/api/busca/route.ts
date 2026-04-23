import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const q = searchParams.get("q")?.trim();

  if (!projectId || !q || q.length < 2) {
    return NextResponse.json({ error: "projectId e q (mín. 2 caracteres) obrigatórios" }, { status: 400 });
  }

  const docs = await prisma.document.findMany({
    where: { projectId, content: { contains: q, mode: "insensitive" } },
    select: { id: true, title: true, content: true },
  });

  const results = docs.flatMap((doc) => {
    const matches: { documentId: string; documentTitle: string; excerpt: string; offset: number }[] = [];
    const lower = doc.content.toLowerCase();
    const term = q.toLowerCase();
    let idx = lower.indexOf(term);
    while (idx !== -1) {
      const start = Math.max(0, idx - 60);
      const end = Math.min(doc.content.length, idx + term.length + 60);
      const prefix = start > 0 ? "..." : "";
      const suffix = end < doc.content.length ? "..." : "";
      matches.push({
        documentId: doc.id,
        documentTitle: doc.title,
        excerpt: prefix + doc.content.slice(start, end) + suffix,
        offset: idx,
      });
      idx = lower.indexOf(term, idx + 1);
      if (matches.length >= 5) break; // max 5 per doc
    }
    return matches;
  });

  return NextResponse.json({ results, total: results.length });
}
