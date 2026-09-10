import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { auth, signIn, signOut, handlers, unstable_update: update } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const creds = credentials as Record<string, string | undefined>;
        const rawEmail = creds?.email;
        const password = creds?.password;

        if (!rawEmail || !password) return null;

        const email = rawEmail.toLowerCase().trim();

        const user = await prisma.user.findFirst({
          where: { email },
        });

        if (!user) return null;

        const passwordsMatch = await bcrypt.compare(password, user.passwordHash);

        if (passwordsMatch) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.avatarInitials,
          };
        }

        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
});
