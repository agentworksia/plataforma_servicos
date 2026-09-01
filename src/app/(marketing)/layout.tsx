import type { ReactNode } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">{children}</main>
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-8 text-sm text-slate-500">
          <span>© {new Date().getFullYear()} Plataforma de Limpeza · Curitiba e RMC</span>
          <span className="flex gap-4">
            <Link href="/termos" className="hover:text-slate-700">
              Termos
            </Link>
            <Link href="/privacidade" className="hover:text-slate-700">
              Privacidade
            </Link>
          </span>
        </div>
      </footer>
    </>
  );
}
