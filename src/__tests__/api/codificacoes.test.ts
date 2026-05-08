import { describe, it, expect, beforeEach } from "vitest";
import { GET, POST, DELETE } from "@/app/api/codificacoes/route";
import { mockPrisma, mockSession, mockNoSession, jsonRequest } from "../helpers";

vi.mock("@/lib/ownership", async (importOriginal) => ({
  ...(await importOriginal() as any),
  userCanAccessDocument: vi.fn(),
}));

import { userCanAccessDocument } from "@/lib/ownership";
const mockCanAccessDoc = vi.mocked(userCanAccessDocument);

describe("GET /api/codificacoes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 401 sem autenticação", async () => {
    mockNoSession();
    const req = new Request("http://localhost/api/codificacoes?documentId=d1");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("retorna 400 sem documentId", async () => {
    mockSession();
    const req = new Request("http://localhost/api/codificacoes");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("retorna 403 sem acesso ao documento", async () => {
    mockSession();
    mockCanAccessDoc.mockResolvedValue(false);
    const req = new Request("http://localhost/api/codificacoes?documentId=d1");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("retorna codificações com sucesso", async () => {
    mockSession();
    mockCanAccessDoc.mockResolvedValue(true);
    mockPrisma.coding.findMany.mockResolvedValue([
      { id: "cod1", selectedText: "Muito lento", code: { name: "Frustração" } },
    ] as any);

    const req = new Request("http://localhost/api/codificacoes?documentId=d1");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
  });
});

describe("POST /api/codificacoes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 400 com dados inválidos", async () => {
    mockSession();
    const req = jsonRequest("http://localhost/api/codificacoes", {
      method: "POST",
      body: { documentId: "not-a-cuid" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("retorna 403 sem acesso ao documento", async () => {
    mockSession();
    mockCanAccessDoc.mockResolvedValue(false);
    const req = jsonRequest("http://localhost/api/codificacoes", {
      method: "POST",
      body: {
        documentId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
        codeId: "clyyyyyyyyyyyyyyyyyyyyyyyy",
        startOffset: 0,
        endOffset: 10,
        selectedText: "Texto selecionado",
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("cria codificação com sucesso", async () => {
    const user = mockSession();
    mockCanAccessDoc.mockResolvedValue(true);
    mockPrisma.coding.create.mockResolvedValue({
      id: "new-coding",
      selectedText: "Texto selecionado",
      authorId: user.id,
      code: { name: "Frustração" },
    } as any);

    const req = jsonRequest("http://localhost/api/codificacoes", {
      method: "POST",
      body: {
        documentId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
        codeId: "clyyyyyyyyyyyyyyyyyyyyyyyy",
        startOffset: 0,
        endOffset: 10,
        selectedText: "Texto selecionado",
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    // Verifica que o authorId é do usuário da sessão
    expect(mockPrisma.coding.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ authorId: user.id }),
      }),
    );
  });
});

describe("DELETE /api/codificacoes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 400 sem id", async () => {
    mockSession();
    const req = new Request("http://localhost/api/codificacoes", { method: "DELETE" });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });

  it("retorna 404 quando codificação não existe", async () => {
    mockSession();
    mockPrisma.coding.findUnique.mockResolvedValue(null);
    const req = new Request("http://localhost/api/codificacoes?id=x", { method: "DELETE" });
    const res = await DELETE(req);
    expect(res.status).toBe(404);
  });

  it("permite deleção pelo autor", async () => {
    mockSession({ id: "author-1" });
    mockPrisma.coding.findUnique.mockResolvedValue({
      id: "cod1",
      authorId: "author-1",
      document: { project: { ownerId: "owner-1" } },
    } as any);
    mockPrisma.coding.delete.mockResolvedValue({} as any);

    const req = new Request("http://localhost/api/codificacoes?id=cod1", { method: "DELETE" });
    const res = await DELETE(req);
    expect(res.status).toBe(200);
  });

  it("permite deleção pelo dono do projeto", async () => {
    mockSession({ id: "owner-1" });
    mockPrisma.coding.findUnique.mockResolvedValue({
      id: "cod1",
      authorId: "author-1",
      document: { project: { ownerId: "owner-1" } },
    } as any);
    mockPrisma.coding.delete.mockResolvedValue({} as any);

    const req = new Request("http://localhost/api/codificacoes?id=cod1", { method: "DELETE" });
    const res = await DELETE(req);
    expect(res.status).toBe(200);
  });

  it("retorna 403 quando não é autor nem dono", async () => {
    mockSession({ id: "random-user" });
    mockPrisma.coding.findUnique.mockResolvedValue({
      id: "cod1",
      authorId: "author-1",
      document: { project: { ownerId: "owner-1" } },
    } as any);

    const req = new Request("http://localhost/api/codificacoes?id=cod1", { method: "DELETE" });
    const res = await DELETE(req);
    expect(res.status).toBe(403);
  });
});
