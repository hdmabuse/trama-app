import { describe, it, expect, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/convite/[token]/route";
import { mockPrisma, jsonRequest } from "../helpers";

const params = { params: { token: "valid-token-123" } };

describe("GET /api/convite/[token]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 404 para token inexistente", async () => {
    mockPrisma.adminInvite.findUnique.mockResolvedValue(null);
    const res = await GET(new Request("http://localhost"), params);
    expect(res.status).toBe(404);
  });

  it("retorna 410 para convite já aceito", async () => {
    mockPrisma.adminInvite.findUnique.mockResolvedValue({
      id: "inv-1",
      token: "valid-token-123",
      status: "ACCEPTED",
    } as any);
    const res = await GET(new Request("http://localhost"), params);
    expect(res.status).toBe(410);
  });

  it("retorna 410 para convite expirado", async () => {
    mockPrisma.adminInvite.findUnique.mockResolvedValue({
      id: "inv-1",
      token: "valid-token-123",
      status: "PENDING",
      expiresAt: new Date("2020-01-01"), // expirado
    } as any);
    const res = await GET(new Request("http://localhost"), params);
    expect(res.status).toBe(410);
  });

  it("retorna dados do convite válido", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    mockPrisma.adminInvite.findUnique.mockResolvedValue({
      id: "inv-1",
      token: "valid-token-123",
      status: "PENDING",
      expiresAt: futureDate,
      email: "convidado@x.com",
      plan: "PRO",
      message: "Bem-vindo!",
      invitedById: "admin-1",
    } as any);
    mockPrisma.user.findUnique.mockResolvedValue({ name: "Admin" } as any);

    const res = await GET(new Request("http://localhost"), params);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.email).toBe("convidado@x.com");
    expect(data.plan).toBe("PRO");
    expect(data.inviterName).toBe("Admin");
  });
});

describe("POST /api/convite/[token]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 410 para convite inválido ou expirado", async () => {
    mockPrisma.adminInvite.findUnique.mockResolvedValue(null);
    const req = jsonRequest("http://localhost", {
      method: "POST",
      body: { name: "Novo", password: "Abcdef1x" },
    });
    const res = await POST(req, params);
    expect(res.status).toBe(410);
  });

  it("retorna 400 sem nome", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    mockPrisma.adminInvite.findUnique.mockResolvedValue({
      id: "inv-1",
      status: "PENDING",
      expiresAt: futureDate,
      email: "convidado@x.com",
      plan: "PRO",
    } as any);

    const req = jsonRequest("http://localhost", {
      method: "POST",
      body: { password: "Abcdef1x" },
    });
    const res = await POST(req, params);
    expect(res.status).toBe(400);
  });

  it("retorna 400 com senha curta (< 8 chars)", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    mockPrisma.adminInvite.findUnique.mockResolvedValue({
      id: "inv-1",
      status: "PENDING",
      expiresAt: futureDate,
      email: "convidado@x.com",
      plan: "PRO",
    } as any);

    const req = jsonRequest("http://localhost", {
      method: "POST",
      body: { name: "Test", password: "Ab1" },
    });
    const res = await POST(req, params);
    expect(res.status).toBe(400);
  });

  it("rejeita senha sem maiúscula (mesma validação do registro)", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    mockPrisma.adminInvite.findUnique.mockResolvedValue({
      id: "inv-1",
      status: "PENDING",
      expiresAt: futureDate,
      email: "convidado@x.com",
      plan: "PRO",
    } as any);

    const req = jsonRequest("http://localhost", {
      method: "POST",
      body: { name: "Test", password: "abcdefg1" },
    });
    const res = await POST(req, params);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("maiúscula");
  });

  it("rejeita senha sem número (mesma validação do registro)", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    mockPrisma.adminInvite.findUnique.mockResolvedValue({
      id: "inv-1",
      status: "PENDING",
      expiresAt: futureDate,
      email: "convidado@x.com",
      plan: "PRO",
    } as any);

    const req = jsonRequest("http://localhost", {
      method: "POST",
      body: { name: "Test", password: "Abcdefgh" },
    });
    const res = await POST(req, params);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("número");
  });

  it("cria usuário e aceita convite com sucesso", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    mockPrisma.adminInvite.findUnique.mockResolvedValue({
      id: "inv-1",
      status: "PENDING",
      expiresAt: futureDate,
      email: "convidado@x.com",
      plan: "PRO",
    } as any);
    mockPrisma.user.create.mockResolvedValue({
      id: "new-user",
      email: "convidado@x.com",
      plan: "PRO",
    } as any);
    mockPrisma.adminInvite.update.mockResolvedValue({} as any);

    const req = jsonRequest("http://localhost", {
      method: "POST",
      body: { name: "Convidado", password: "Abcdef1x" },
    });
    const res = await POST(req, params);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.plan).toBe("PRO");

    // Verifica que o convite foi marcado como ACCEPTED
    expect(mockPrisma.adminInvite.update).toHaveBeenCalledWith({
      where: { id: "inv-1" },
      data: expect.objectContaining({ status: "ACCEPTED" }),
    });
  });
});
