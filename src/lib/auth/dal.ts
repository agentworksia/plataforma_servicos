import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Role } from "@/generated/prisma/enums";

/** Sessão atual (ou null). Memoizada por render. */
export const getSession = cache(async () => auth());

/** Exige usuário logado; redireciona pro login caso contrário. */
export async function requireUser() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  return session.user;
}

/** Exige um papel específico. ADMIN passa em qualquer verificação. */
export async function requireRole(role: Role) {
  const user = await requireUser();
  if (user.role !== role && user.role !== "ADMIN") {
    redirect("/login");
  }
  return user;
}

/** Rota inicial do painel conforme o papel. */
export function painelHref(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "PROFISSIONAL":
      return "/profissional";
    default:
      return "/cliente";
  }
}
