import { vi } from "vitest";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";

// Re-export typed mocks for convenience
export const mockPrisma = vi.mocked(prisma);
export const mockGetSession = vi.mocked(getServerSession);

/** Simulates an authenticated session */
export function mockSession(overrides: Partial<{
  id: string;
  name: string;
  email: string;
  plan: string;
  isAdmin: boolean;
}> = {}) {
  const user = {
    id: "user-1",
    name: "Test User",
    email: "test@trama.app",
    plan: "FREE",
    isAdmin: false,
    ...overrides,
  };
  mockGetSession.mockResolvedValue({ user, expires: "" });
  return user;
}

/** Simulates an unauthenticated session */
export function mockNoSession() {
  mockGetSession.mockResolvedValue(null);
}

/** Creates a JSON request */
export function jsonRequest(url: string, options: {
  method?: string;
  body?: unknown;
} = {}): Request {
  const { method = "GET", body } = options;
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
