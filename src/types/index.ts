import { DefaultSession } from "next-auth";

// The extra fields we put on the login user, the JWT and the session (see lib/auth.ts).
// Declared once here so no code needs `(session.user as any)`.
declare module "next-auth" {
  interface User {
    role: string;
    category?: string | null;
    mustChangePassword?: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      category?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    category?: string | null;
    mustChangePassword?: boolean;
  }
}
