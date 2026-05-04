import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userCanAccessProject } from "@/lib/ownership";
import { checkPlanLimit } from "@/lib/plans";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = join(process.cwd(), "uploads");

const MIME_MAP: Record<string, { type: string; category: "text" | "audio" | "video" }> = {
  "text/plain": { type: "TXT", category: "text" },
  "text/markdown": { type: "MARKDOWN", category: "text" },
  "application/pdf": { type: "PDF", category: "text" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { type: "DOCX", category: "text" },
  "audio/mpeg": { type: "AUDIO", category: "audio" },
  "audio/mp4": { type: "AUDIO", category: "audio" },
  "audio/wav": { type: "AUDIO", category: "audio" },
  "audio/ogg": { type: "AUDIO", category: "audio" },
  "audio/webm": { type: "AUDIO", category: "audio" },
  "video/mp4": { type: "VIDEO", category: "video" },
  "video/webm": { type: "VIDEO", category: "video" },
  "video/quicktime": { type: "VIDEO", category: "video" },
};

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;
    const title = formData.get("title") as string | null;

    if (!file || !projectId) {
      return NextResponse.json({ error: "Arquivo e projectId são obrigatórios" }, { status: 400 });
    }

    // Verificar acesso ao projeto
    const hasAccess = await userCanAccessProject(session.user.id, projectId);
    if (!hasAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

    // Verificar limite de documentos do plano
    const check = await checkPlanLimit(session.user.id, "documents", projectId);
    if (!check.allowed) {
      return NextResponse.json(
        { error: "PLAN_LIMIT", resource: "documents", current: check.current, limit: check.limit, plan: check.plan },
        { status: 403 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Arquivo excede o limite de 50MB (${(file.size / 1024 / 1024).toFixed(1)}MB)` },
        { status: 400 }
      );
    }

    const mime = file.type || "application/octet-stream";
    const mapped = MIME_MAP[mime];

    if (!mapped) {
      const allowed = Array.from(new Set(Object.values(MIME_MAP).map((m) => m.type)));
      return NextResponse.json({ error: `Tipo não suportado: ${mime}. Use: ${allowed.join(", ")}` }, { status: 400 });
    }

    // Salvar arquivo no disco
    await mkdir(UPLOAD_DIR, { recursive: true });
    const ext = file.name.split(".").pop() || "bin";
    const storedName = `${randomUUID()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    await writeFile(join(UPLOAD_DIR, storedName), bytes);

    // Extrair conteúdo de texto
    let content = "";
    let wordCount = 0;

    if (mapped.category === "text" && (mime === "text/plain" || mime === "text/markdown")) {
      content = new TextDecoder("utf-8").decode(bytes);
      wordCount = content.split(/\s+/).filter(Boolean).length;
    } else if (mapped.category === "audio" || mapped.category === "video") {
      content = `[Arquivo de ${mapped.category === "audio" ? "áudio" : "vídeo"}: ${file.name}]\n\nTranscrição pendente — cole o texto abaixo:\n\n`;
    } else {
      content = `[Arquivo ${mapped.type}: ${file.name}]\n\nTexto extraído pendente — cole o conteúdo abaixo:\n\n`;
    }

    const doc = await prisma.document.create({
      data: {
        title: title || file.name.replace(/\.[^.]+$/, ""),
        content,
        type: mapped.type as any,
        mimeType: mime,
        fileUrl: `/api/files/${storedName}`,
        fileName: file.name,
        wordCount,
        projectId,
      },
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Erro no upload: " + err.message }, { status: 500 });
  }
}
