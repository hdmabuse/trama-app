import { describe, it, expect, beforeEach } from "vitest";
import { GET, POST, DELETE } from "@/app/api/codigos/route";
import { mockPrisma, mockSession, mockNoSession, jsonRequest } from "../helpers";

vi.mock("@/lib/ownership", async (importOriginal) => ({
  ...(await importOriginal() as any),
  userCanAccessProject: vi.fn(),
}));

import { userCanAccessProject } from "@/lib/ownership";
const mockCanAccess = vi.mocked(userCanAccessProject);

describe("GET /api/codigos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 401 sem autenticação", async () => {
    mockNoSession();
    const req = new Request("http://localhost/api/codigos?projectId=p1");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("retorna 400 sem projectId", async () => {
    mockSession();
    const req = new Request("http://localhost/api/codigos");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("retorna 403 sem acesso ao projeto", async () => {
    mockSession();
    mockCanAccess.mockResolvedValue(false);
    const req = new Request("http://localhost/api/codigos?projectId=p1");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("retorna lista de códigos", async () => {
    mockSession();
    mockCanAccess.mockResolvedValue(true);
    mockPrisma.code.findMany.mockResolvedValue([
      { id: "c1", name: "Frustração", color: "#ef4444" },
    ] as any);

    const req = new Request("http://localhost/api/codigos?projectId=p1");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
  });
});

describe("POST /api/codigos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 400 com dados inválidos", async () => {
    mockSession();
    const req = jsonRequest("http://localhost/api/codigos", {
      method: "POST",
      body: { name: "" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("retorna 403 sem acesso ao projeto", async () => {
    mockSession();
    mockCanAccess.mockResolvedValue(false);
    const req = jsonRequest("http://localhost/api/codigos", {
      method: "POST",
      body: { name: "Novo Código", color: "#6366f1", projectId: "clxxxxxxxxxxxxxxxxxxxxxxxxx" },
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("cria código com sucesso", async () => {
    mockSession();
    mockCanAccess.mockResolvedValue(true);
    mockPrisma.code.create.mockResolvedValue({
      id: "new-code",
      name: "Novo Código",
    } as any);

    const req = jsonRequest("http://localhost/api/codigos", {
      method: "POST",
      body: { name: "Novo Código", color: "#6366f1", projectId: "clxxxxxxxxxxxxxxxxxxxxxxxxx" },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});

describe("DELETE /api/codigos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 400 sem id", async () => {
    mockSession();
    const req = new Request("http://localhost/api/codigos", { method: "DELETE" });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });

  it("retorna 404 quando código não existe", async () => {
    mockSession();
    mockPrisma.code.findUnique.mockResolvedValue(null);
    const req = new Request("http://localhost/api/codigos?id=nonexistent", { method: "DELETE" });
    const res = await DELETE(req);
    expect(res.status).toBe(404);
  });

  it("retorna 403 quando não é dono do projeto", async () => {
    mockSession({ id: "other-user" });
    mockPrisma.code.findUnique.mockResolvedValue({
      id: "c1",
      project: { ownerId: "user-1" },
    } as any);
    mockCanAccess.mockResolvedValue(false);

    const req = new Request("http://localhost/api/codigos?id=c1", { method: "DELETE" });
    const res = await DELETE(req);
    expect(res.status).toBe(403);
  });

  it("deleta código quando é dono do projeto", async () => {
    mockSession({ id: "owner-1" });
    mockPrisma.code.findUnique.mockResolvedValue({
      id: "c1",
      projectId: "project-1",
      project: { ownerId: "owner-1" },
    } as any);
    mockPrisma.code.delete.mockResolvedValue({} as any);

    const req = new Request("http://localhost/api/codigos?id=c1", { method: "DELETE" });
    const res = await DELETE(req);
    expect(res.status).toBe(200);
  });

  it("DELETE não chama mais userCanAccessProject com codeId (bug corrigido)", async () => {
    mockSession({ id: "owner-1" });
    mockPrisma.code.findUnique.mockResolvedValue({
      id: "code-123",
      projectId: "project-abc",
      project: { ownerId: "owner-1" },
    } as any);
    mockPrisma.code.delete.mockResolvedValue({} as any);

    const req = new Request("http://localhost/api/codigos?id=code-123", { method: "DELETE" });
    await DELETE(req);

    // Correção: userCanAccessProject não é mais chamado na rota DELETE
    // A verificação agora é feita diretamente pelo ownerId do projeto
    expect(mockCanAccess).not.toHaveBeenCalled();
  });
});
