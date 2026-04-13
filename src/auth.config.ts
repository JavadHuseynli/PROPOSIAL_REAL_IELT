import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { role: string; fin?: string; groupName?: string };
        token.role = u.role;
        token.id = user.id;
        token.fin = u.fin;
        token.groupName = u.groupName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).fin = token.fin;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).groupName = token.groupName;
      }
      return session;
    },
  },
  providers: [], // Credentials provider is added in lib/auth.ts
} satisfies NextAuthConfig;
