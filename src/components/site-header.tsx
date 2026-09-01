import Link from "next/link";
import { getSession, painelHref } from "@/lib/auth/dal";
import { logoutAction } from "@/lib/auth/actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="border-b border-slate-200">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-teal-700">
          Plataforma de Limpeza
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          <Link href="/como-funciona" className="hidden px-3 py-2 text-slate-600 hover:text-slate-900 sm:block">
            Como funciona
          </Link>
          <Link
            href="/seja-profissional"
            className="hidden px-3 py-2 text-slate-600 hover:text-slate-900 sm:block"
          >
            Seja profissional
          </Link>

          {session?.user ? (
            <>
              <Link href={painelHref(session.user.role)} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                Meu painel
              </Link>
              <form action={logoutAction}>
                <button type="submit" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                  Sair
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                Entrar
              </Link>
              <Link href="/cadastro" className={cn(buttonVariants({ variant: "primary", size: "sm" }))}>
                Criar conta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
