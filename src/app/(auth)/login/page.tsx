import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, painelHref } from "@/lib/auth/dal";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage() {
  const session = await getSession();
  if (session?.user) redirect(painelHref(session.user.role));

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Entrar</h1>
      <p className="mt-1 text-sm text-slate-600">Acesse seu painel de cliente ou profissional.</p>

      <div className="mt-6">
        <LoginForm />
      </div>

      <p className="mt-6 text-sm text-slate-600">
        Não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-teal-700 hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
