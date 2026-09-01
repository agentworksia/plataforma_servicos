import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-slate-50 px-4 py-12">
      <Link href="/" className="mb-8 text-lg font-bold text-teal-700">
        Plataforma de Limpeza
      </Link>
      {children}
    </div>
  );
}
