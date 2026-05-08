import { describe, it, expect, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/projetos/route";
import { mockPrisma, mockGetSession, mockSession, mockNoSession, jsonRequest } from "../helpers";

// Mock plan limits
vi.mock("@/lib/plans", () => ({
  checkPlanLimit: vi.fn(),
  PLAN_LIMITS: {
    FREE: { projects: 3, docsPerProject: 20, membersPerProject: 1, storageMB: 500, exports: ["md"] },
    PRO: { projects: 20, docsPerProject: 100, membersPerProject: 5, storageMB: 5120, exports: ["pdf", "md", "json", "csv"] },
    TEAM: { projects: Infinity, docsPerProject: 500, membersPerProject: 20, storageMB: 20480, exports: ["pdf", "md", "json", "csv"] },
  },
}));

import { checkPlanLimit } from "@/lib/plans";
const mockCheckPlanLimit = vi.mocked(checkPlanLimit);

describe("GET /api/projetos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 401 sem autenticação", async () => {
    mockNoSession();
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("retorna lista de projetos do usuário", async () => {
    const user = mockSession();
    const projects = [
      { id: "p1", name: "Projeto 1", ownerId: user.id, _count: { documents: 2, codes: 3 }, owner: { name: "Test" } },
    ];
    mockPrisma.project.findMany.mockResolvedValue(projects as any);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("Projeto 1");
  });
});

describe("POST /api/projetos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 401 sem autenticação", async () => {
    mockNoSession();
    const req = jsonRequest("http://localhost/api/projetos", {
      method: "POST",
      body: { name: "Test", color: "#6366f1" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("retorna 400 com dados inválidos", async () => {
    mockSession();
    const req = jsonRequest("http://localhost/api/projetos", {
      method: "POST",
      body: { name: "" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("retorna 403 quando limite do plano atingido", async () => {
    mockSession();
    mockCheckPlanLimit.mockResolvedValue({
      allowed: false, current: 3, limit: 3, plan: "FREE",
    });

    const req = jsonRequest("http://localhost/api/projetos", {
      method: "POST",
      body: { name: "Novo Projeto", color: "#6366f1" },
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe("PLAN_LIMIT");
  });

  it("cria projeto com sucesso", async () => {
    const user = mockSession();
    mockCheckPlanLimit.mockResolvedValue({
      allowed: true, current: 1, limit: 3, plan: "FREE",
    });
    mockPrisma.project.create.mockResolvedValue({
      id: "new-project",
      name: "Novo Projeto",
      ownerId: user.id,
    } as any);

    const req = jsonRequest("http://localhost/api/projetos", {
      method: "POST",
      body: { name: "Novo Projeto", color: "#6366f1" },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    // Verifica que criou membership OWNER junto
    expect(mockPrisma.project.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ownerId: user.id,
        members: { create: { userId: user.id, role: "OWNER" } },
      }),
    });
  });
});
