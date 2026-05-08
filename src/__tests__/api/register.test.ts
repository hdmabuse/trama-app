import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/register/route";
import { mockPrisma, jsonRequest } from "../helpers";

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejeita body inválido (sem campos)", async () => {
    const res = await POST(jsonRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: {},
    }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("rejeita email inválido", async () => {
    const res = await POST(jsonRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: { name: "Test", email: "not-an-email", password: "Abcdef1x" },
    }));
    expect(res.status).toBe(400);
  });

  it("rejeita senha fraca (sem maiúscula)", async () => {
    const res = await POST(jsonRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: { name: "Test", email: "test@x.com", password: "abcdefg1" },
    }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("maiúscula");
  });

  it("rejeita senha fraca (sem número)", async () => {
    const res = await POST(jsonRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: { name: "Test", email: "test@x.com", password: "Abcdefgh" },
    }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("número");
  });

  it("rejeita senha curta (< 8 caracteres)", async () => {
    const res = await POST(jsonRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: { name: "Test", email: "test@x.com", password: "Ab1" },
    }));
    expect(res.status).toBe(400);
  });

  it("retorna 409 quando email já existe", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: "existing" } as any);

    const res = await POST(jsonRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: { name: "Test", email: "test@x.com", password: "Abcdef1x" },
    }));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toContain("email");
  });

  it("cria usuário com sucesso", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: "new-user",
      email: "new@x.com",
    } as any);

    const res = await POST(jsonRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: { name: "New User", email: "new@x.com", password: "Abcdef1x" },
    }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBe("new-user");
    expect(data.email).toBe("new@x.com");

    // Verifica que foi criado com plano FREE
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        plan: "FREE",
        isActive: true,
      }),
    });
  });
});
