import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readFile, stat } from "fs/promises";
import { join, resolve } from "path";

const UPLOAD_DIR = join(process.cwd(), "uploads");

const CONTENT_TYPES: Record<string, string> = {
  txt: "text/plain",
  md: "text/markdown",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  wav: "audio/wav",
  ogg: "audio/ogg",
  webm: "video/webm",
  mp4: "video/mp4",
  mov: "video/quicktime",
};

export async function GET(_: Request, { params }: { params: { filename: string } }) {
  // Autenticação obrigatória
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const filename = params.filename;

  // Proteção contra path traversal (dupla verificação)
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\") || filename.includes("\0")) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const filepath = resolve(UPLOAD_DIR, filename);

  // Garantir que o caminho resolvido está dentro do UPLOAD_DIR
  if (!filepath.startsWith(resolve(UPLOAD_DIR))) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    await stat(filepath);
  } catch {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
  }

  const buffer = await readFile(filepath);
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const contentType = CONTENT_TYPES[ext] || "application/octet-stream";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": buffer.length.toString(),
      "Cache-Control": "private, max-age=86400",
    },
  });
}
