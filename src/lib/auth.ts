import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        // Case-insensitive, so "Name@vitstudent.ac.in" finds "name@vitstudent.ac.in".
        const user = await db.user.findFirst({
          where: { email: { equals: credentials.email.trim(), mode: "insensitive" } },
          include: { member: true },
        });

        if (!user) {
          throw new Error("No account found with this email");
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) {
          throw new Error("Incorrect password");
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.member?.fullName ?? user.email,
          category: user.member?.category ?? null,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.category = (user as any).category;
        token.mustChangePassword = (user as any).mustChangePassword;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).category = token.category;
      }
      return session;
    },
  },
};