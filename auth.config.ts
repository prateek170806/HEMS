import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      
      const isPublicPath = 
        nextUrl.pathname === "/login" || 
        nextUrl.pathname === "/register" ||
        nextUrl.pathname.startsWith("/_next") ||
        nextUrl.pathname.startsWith("/api/auth"); // Allow auth callbacks

      if (isPublicPath) {
        // If logged in and trying to go to login/register, redirect to home
        if (isLoggedIn && (nextUrl.pathname === "/login" || nextUrl.pathname === "/register")) {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      // If not logged in and requesting a protected route, redirect to login
      if (!isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl));
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image; // image stores avatarInitials
      }
      if (trigger === "update" && session) {
        token.name = session.name;
        token.picture = session.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub;
        session.user.name = token.name;
        session.user.email = token.email as string;
        session.user.image = token.picture as string | null;
      }
      return session;
    },
  },
  providers: [], // Add providers in auth.ts
} satisfies NextAuthConfig;
