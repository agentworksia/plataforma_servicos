import type { ReactNode } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { logoutAction } from "@/lib/auth/actions";
import { PainelNav, type NavItem } from "@/components/painel-nav";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Role } from "@/generated/prisma/enums";

const NAV_POR_PAPEL: Record<Role, NavItem[]> = {
  CLIENTE: [
    { href: "/cliente", label: "Agendamentos" },
    { href: "/cliente/enderecos", label: "Endereços" },
    { href: "/cliente/pagamentos", label: "Pagamentos" },
  ],
  PROFISSIONAL: [
    { href: "/profissional", label: "Ofertas" },
    { href: "/profissional/agenda", label: "Agenda" },
    { href: "/profissional/ganhos", label: "Ganhos" },
    { href: "/profissional/avaliacoes", label: "Avaliações" },
  ],
  ADMIN: [
    { href: "/admin", label: "Visão geral" },
    { href: "/admin/profissionais", label: "Profissionais" },
    { href: "/admin/agendamentos", label: "Agendamentos" },
    { href: "/admin/repasses", label: "Repasses" },
    { href: "/admin/precos", label: "Preços" },
    { href: "/admin/regioes", label: "Regiões" },
  ],
};

export default async function PainelLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold text-teal-700">
            Plataforma de Limpeza
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-500 sm:inline">{user.email}</span>
            <form action={logoutAction}>
              <button type="submit" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6">
          <PainelNav items={NAV_POR_PAPEL[user.role]} />
        </div>
        {children}
      </div>
    </div>
  );
}
