import { vi } from "vitest";

// ── Mock: Prisma ──
vi.mock("@/lib/db", () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    projectMember: {
      count: vi.fn(),
    },
    document: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    code: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    coding: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    adminInvite: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    subscription: {
      findFirst: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

// ── Mock: NextAuth ──
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

// ── Mock: Activity logging ──
vi.mock("@/lib/activity", () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

// ── Mock: bcryptjs ──
vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("$2a$12$hashedpassword"),
  compare: vi.fn(),
}));

// ── Mock: Mercado Pago processors ──
vi.mock("@/lib/mercadopago", () => ({
  processPaymentCreated: vi.fn().mockResolvedValue(undefined),
  processPaymentUpdated: vi.fn().mockResolvedValue(undefined),
  processSubscriptionAuthorized: vi.fn().mockResolvedValue(undefined),
  processSubscriptionCancelled: vi.fn().mockResolvedValue(undefined),
  processSubscriptionSuspended: vi.fn().mockResolvedValue(undefined),
}));
