import Link from "next/link";
import { getSession, painelHref } from "@/lib/auth/dal";
import { logoutAction } from "@/lib/auth/actions";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/marca";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/como-funciona", label: "Como funciona" },
  { href: "/#precos", label: "Preços" },
  { href: "/seja-profissional", label: "Trabalhar conosco" },
];

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-30 border-b border-pedra-200 bg-pedra-50/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />

        <nav className="hidden items-center gap-1 text-sm md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-botao px-3 py-2 text-pedra-600 hover:bg-pedra-100 hover:text-pinho-800"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 text-sm">
          {session?.user ? (
            <>
              <Link
                href={painelHref(session.user.role)}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
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
              <Link href="/agendar" className={cn(buttonVariants({ variant: "primary", size: "sm" }))}>
                Agendar
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
