import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validation/auth";
import type { Role } from "@/generated/prisma/enums";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // O adapter fica pronto para provedores OAuth/e-mail no futuro. Com Credentials + JWT
  // a sessão não toca o banco a cada request.
  adapter: PrismaAdapter(db as never),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, senha: {} },
      authorize: async (raw) => {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, senha } = parsed.data;
        const user = await db.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(senha, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as { role: Role }).role;
      return token;
    },
    session({ session, token }) {
      const role = (token as { role?: Role }).role;
      if (token.sub) session.user.id = token.sub;
      if (role) session.user.role = role;
      return session;
    },
  },
});
