import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    plan: "FREE" | "PRO" | "TEAM";
    isAdmin: boolean;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      plan: "FREE" | "PRO" | "TEAM";
      isAdmin: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    plan: "FREE" | "PRO" | "TEAM";
    isAdmin: boolean;
  }
}
