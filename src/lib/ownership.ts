import { prisma } from "./db";

/**
 * Verifica se o usuário tem acesso ao projeto (dono ou membro).
 * Retorna true se tem acesso.
 */
export async function userCanAccessProject(userId: string, projectId: string): Promise<boolean> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    select: { id: true },
  });
  return !!project;
}

/**
 * Verifica se o usuário é dono do projeto.
 */
export async function userOwnsProject(userId: string, projectId: string): Promise<boolean> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
    select: { id: true },
  });
  return !!project;
}

/**
 * Verifica se o usuário tem acesso a um documento (via projeto).
 */
export async function userCanAccessDocument(userId: string, documentId: string): Promise<boolean> {
  const doc = await prisma.document.findFirst({
    where: {
      id: documentId,
      project: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
    },
    select: { id: true },
  });
  return !!doc;
}

/**
 * Retorna o projectId de um documento, ou null.
 */
export async function getDocumentProjectId(documentId: string): Promise<string | null> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { projectId: true },
  });
  return doc?.projectId ?? null;
}
