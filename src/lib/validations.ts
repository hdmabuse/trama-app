import { z } from "zod";

/* ── Projetos ── */
export const createProjectSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(200),
  description: z.string().max(2000).nullish(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida")
    .default("#6366f1"),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullish(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

/* ── Documentos ── */
export const createDocumentSchema = z.object({
  title: z.string().min(1, "Título obrigatório").max(500),
  content: z.string().min(1, "Conteúdo obrigatório"),
  type: z.enum(["TXT", "PDF", "DOCX", "MARKDOWN", "AUDIO", "VIDEO", "MEMO"]).default("TXT"),
  projectId: z.string().cuid("projectId inválido"),
});

/* ── Códigos ── */
export const createCodeSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(200),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#6366f1"),
  description: z.string().max(1000).nullish(),
  projectId: z.string().cuid("projectId inválido"),
  parentId: z.string().cuid().nullish(),
});

/* ── Codificações ── */
export const createCodingSchema = z.object({
  documentId: z.string().cuid("documentId inválido"),
  codeId: z.string().cuid("codeId inválido"),
  startOffset: z.number().int().min(0),
  endOffset: z.number().int().min(1),
  selectedText: z.string().min(1),
  memo: z.string().max(2000).nullish(),
});

/* ── Temas ── */
export const createThemeSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(200),
  description: z.string().max(2000).nullish(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#8b5cf6"),
  projectId: z.string().cuid("projectId inválido"),
});

export const updateThemeSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullish(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const themeCodesSchema = z.object({
  codeIds: z.array(z.string().cuid()).min(1),
});

/* ── Memorandos ── */
export const createMemoSchema = z.object({
  title: z.string().min(1, "Título obrigatório").max(500),
  content: z.string().min(1, "Conteúdo obrigatório"),
  projectId: z.string().cuid("projectId inválido"),
  linkedDocumentId: z.string().cuid("linkedDocumentId inválido").nullish(),
});

export const updateMemoSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1).optional(),
});

/* ── Auth / Registro ── */
export const registerSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(200),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .refine((p) => /[A-Z]/.test(p), "Deve conter letra maiúscula")
    .refine((p) => /[a-z]/.test(p), "Deve conter letra minúscula")
    .refine((p) => /[0-9]/.test(p), "Deve conter número"),
});

/* ── Helper para validar e retornar erro ── */
export function parseBody<T>(schema: z.ZodSchema<T>, data: unknown): { data: T } | { error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const msg = result.error.issues.map((i) => i.message).join("; ");
    return { error: msg };
  }
  return { data: result.data };
}
