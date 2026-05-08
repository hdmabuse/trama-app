import { describe, it, expect, beforeEach } from "vitest";
import { GET, PATCH, DELETE } from "@/app/api/projetos/[id]/route";
import { mockPrisma, mockSession, mockNoSession, jsonRequest } from "../helpers";

// Mock ownership
vi.mock("@/lib/ownership", async (importOriginal) => ({
  ...(await importOriginal() as any),
  userCanAccessProject: vi.fn(),
  userOwnsProject: vi.fn(),
}));

import { userCanAccessProject, userOwnsProject } from "@/lib/ownership";
const mockCanAccess = vi.mocked(userCanAccessProject);
const mockOwns = vi.mocked(userOwnsProject);

const params = { params: { id: "project-1" } };

describe("GET /api/projetos/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 401 sem autenticação", async () => {
    mockNoSession();
    const res = await GET(new Request("http://localhost"), params);
    expect(res.status).toBe(401);
  });

  it("retorna 403 sem acesso ao projeto", async () => {
    mockSession();
    mockCanAccess.mockResolvedValue(false);
    const res = await GET(new Request("http://localhost"), params);
    expect(res.status).toBe(403);
  });

  it("retorna 404 quando projeto não existe", async () => {
    mockSession();
    mockCanAccess.mockResolvedValue(true);
    mockPrisma.project.findUnique.mockResolvedValue(null);
    const res = await GET(new Request("http://localhost"), params);
    expect(res.status).toBe(404);
  });

  it("retorna projeto com sucesso", async () => {
    mockSession();
    mockCanAccess.mockResolvedValue(true);
    const project = { id: "project-1", name: "Test", documents: [], codes: [] };
    mockPrisma.project.findUnique.mockResolvedValue(project as any);

    const res = await GET(new Request("http://localhost"), params);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("project-1");
  });
});

describe("PATCH /api/projetos/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 401 sem autenticação", async () => {
    mockNoSession();
    const req = jsonRequest("http://localhost", { method: "PATCH", body: { name: "X" } });
    const res = await PATCH(req, params);
    expect(res.status).toBe(401);
  });

  it("retorna 403 quando não é dono", async () => {
    mockSession();
    mockOwns.mockResolvedValue(false);
    const req = jsonRequest("http://localhost", { method: "PATCH", body: { name: "X" } });
    const res = await PATCH(req, params);
    expect(res.status).toBe(403);
  });

  it("atualiza projeto com sucesso", async () => {
    mockSession();
    mockOwns.mockResolvedValue(true);
    mockPrisma.project.update.mockResolvedValue({ id: "project-1", name: "Updated" } as any);

    const req = jsonRequest("http://localhost", { method: "PATCH", body: { name: "Updated" } });
    const res = await PATCH(req, params);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe("Updated");
  });
});

describe("DELETE /api/projetos/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 quando não é dono", async () => {
    mockSession();
    mockOwns.mockResolvedValue(false);
    const res = await DELETE(new Request("http://localhost"), params);
    expect(res.status).toBe(403);
  });

  it("deleta projeto com sucesso", async () => {
    mockSession();
    mockOwns.mockResolvedValue(true);
    mockPrisma.project.delete.mockResolvedValue({} as any);

    const res = await DELETE(new Request("http://localhost"), params);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });
});
