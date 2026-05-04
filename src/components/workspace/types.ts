export type Code = {
  id: string;
  name: string;
  color: string;
  description: string | null;
  _count: { codings: number };
  children?: Code[];
};

export type Doc = {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  type: string;
  mimeType?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  linkedDocumentId?: string | null;
  linkedDocument?: { id: string; title: string } | null;
  _count: { codings: number; linkedMemos?: number };
};

export type Coding = {
  id: string;
  startOffset: number;
  endOffset: number;
  selectedText: string;
  memo: string | null;
  code: { id: string; name: string; color: string };
};

export type ThemeCode = {
  code: { id: string; name: string; color: string };
};

export type Theme = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  sortOrder: number;
  themeCodes: ThemeCode[];
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  documents: Doc[];
  codes: Code[];
  themes: Theme[];
};

export type WorkspaceView = "document" | "themes" | "graph";
