"use client";

import React, { useState, useRef } from "react";
import { Ic, ic } from "./icons";

interface UploadModalProps {
  projectId: string;
  onClose: () => void;
  onDone: () => void;
}

const ACCEPT = ".txt,.md,.pdf,.docx,.mp3,.m4a,.wav,.ogg,.webm,.mp4,.mov";

const STATUS_COLOR: Record<string, string> = {
  uploading: "text-trama-500",
  done: "text-green-600",
  error: "text-red-500",
};

const STATUS_LABEL: Record<string, string> = {
  uploading: "Enviando...",
  done: "Pronto",
  error: "Erro",
};

function fileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["mp3", "m4a", "wav", "ogg"].includes(ext)) return ic.music;
  if (["mp4", "webm", "mov"].includes(ext)) return ic.film;
  return ic.doc;
}

export function UploadModal({ projectId, onClose, onDone }: UploadModalProps) {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(f: FileList | File[]) {
    const a = Array.from(f);
    setFiles((p) => [...p, ...a]);
    a.forEach((f) => setProgress((p) => ({ ...p, [f.name]: "pending" })));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }

  async function uploadAll() {
    setUploading(true);

    for (const f of files) {
      setProgress((p) => ({ ...p, [f.name]: "uploading" }));
      try {
        const fd = new FormData();
        fd.append("file", f);
        fd.append("projectId", projectId);
        fd.append("title", f.name.replace(/\.[^.]+$/, ""));
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        setProgress((p) => ({ ...p, [f.name]: r.ok ? "done" : "error" }));
      } catch {
        setProgress((p) => ({ ...p, [f.name]: "error" }));
      }
    }

    setUploading(false);
    setTimeout(onDone, 500);
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-semibold text-stone-800">Upload de arquivos</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <Ic d={ic.x} className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-stone-400 mb-4">
          Texto: TXT, MD, PDF, DOCX · Áudio: MP3, M4A, WAV, OGG · Vídeo: MP4, WebM, MOV · Máx: 50MB
        </p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition mb-4 ${
            dragging ? "border-trama-500 bg-trama-50" : "border-stone-200 hover:border-stone-300"
          }`}
        >
          <Ic d={ic.upload} className="w-8 h-8 text-stone-300 mx-auto mb-3" />
          <p className="text-sm text-stone-500 mb-1">Arraste arquivos aqui</p>
          <p className="text-xs text-stone-400">ou clique para selecionar</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="max-h-48 overflow-y-auto mb-4 space-y-1 scrollbar-thin">
            {files.map((f) => (
              <div key={f.name} className="flex items-center gap-2 px-3 py-2 bg-stone-50 rounded-lg">
                <Ic d={fileIcon(f.name)} className="w-4 h-4 text-stone-400 shrink-0" />
                <span className="text-sm text-stone-700 flex-1 truncate">{f.name}</span>
                <span className="text-[11px] text-stone-400">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                {progress[f.name] && progress[f.name] !== "pending" && (
                  <span className={`text-[11px] font-medium ${STATUS_COLOR[progress[f.name]] || ""}`}>
                    {STATUS_LABEL[progress[f.name]] || ""}
                  </span>
                )}
                {!uploading && (
                  <button
                    onClick={() => {
                      setFiles((p) => p.filter((x) => x.name !== f.name));
                      setProgress((p) => {
                        const n = { ...p };
                        delete n[f.name];
                        return n;
                      });
                    }}
                    className="text-stone-400 hover:text-stone-600 shrink-0"
                  >
                    <Ic d={ic.x} className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-stone-500">
            Cancelar
          </button>
          <button
            onClick={uploadAll}
            disabled={files.length === 0 || uploading}
            className="px-4 py-1.5 bg-trama-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition flex items-center gap-1.5"
          >
            <Ic d={ic.upload} className="w-3.5 h-3.5" />
            {uploading ? "Enviando..." : `Enviar ${files.length} arquivo${files.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
