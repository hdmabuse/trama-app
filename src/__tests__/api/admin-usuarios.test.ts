import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "@/app/api/admin/usuarios/route";
import { mockPrisma, mockSession, mockNoSession } from "../helpers";

describe("GET /api/admin/usuarios", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 sem autenticação", async () => {
    mockNoSession();
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("retorna 403 para usuário não-admin", async () => {
    mockSession({ isAdmin: false });
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("retorna lista de usuários e stats para admin", async () => {
    mockSession({ isAdmin: true });
    const users = [
      { id: "u1", name: "Admin", email: "admin@x.com", plan: "PRO", isAdmin: true, isActive: true, _count: { ownedProjects: 5, codings: 50 } },
      { id: "u2", name: "User", email: "user@x.com", plan: "FREE", isAdmin: false, isActive: true, _count: { ownedProjects: 1, codings: 10 } },
      { id: "u3", name: "Inactive", email: "off@x.com", plan: "FREE", isAdmin: false, isActive: false, _count: { ownedProjects: 0, codings: 0 } },
    ];
    mockPrisma.user.findMany.mockResolvedValue(users as any);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.users).toHaveLength(3);
    expect(data.stats.total).toBe(3);
    expect(data.stats.byPlan.FREE).toBe(2);
    expect(data.stats.byPlan.PRO).toBe(1);
    expect(data.stats.active).toBe(2);
  });
});
