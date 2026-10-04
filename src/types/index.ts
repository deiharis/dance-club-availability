import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      category?: string | null;
    } & DefaultSession["user"];
  }

  interface JWT {
    id: string;
    role: string;
    category?: string | null;
    mustChangePassword?: boolean;
  }
}