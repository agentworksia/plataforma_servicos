import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">{children}</main>
      <footer className="border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-500">
          © {new Date().getFullYear()} Plataforma de Limpeza · Curitiba e RMC
        </div>
      </footer>
    </>
  );
}
