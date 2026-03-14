import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        login: { label: "Login", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) return null;

        const loginValue = (credentials.login as string).trim();
        const passwordValue = credentials.password as string;

        // Try to find user by FIN code first, then by email
        let user = await prisma.user.findUnique({
          where: { fin: loginValue },
          include: { group: true },
        });

        if (!user) {
          user = await prisma.user.findUnique({
            where: { email: loginValue },
            include: { group: true },
          });
        }

        if (!user) return null;

        const isValid = await bcrypt.compare(passwordValue, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          fin: user.fin,
          groupName: user.group?.name || null,
        };
      },
    }),
  ],
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
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
