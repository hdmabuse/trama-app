import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { join } from "path";

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
  const filename = params.filename;

  // Prevent directory traversal
  if (filename.includes("..") || filename.includes("/")) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const filepath = join(UPLOAD_DIR, filename);

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
