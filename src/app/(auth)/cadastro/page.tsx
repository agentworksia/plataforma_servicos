import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, painelHref } from "@/lib/auth/dal";
import { AuthCard } from "@/components/auth-card";
import { CadastroClienteForm } from "./cadastro-cliente-form";

export const metadata: Metadata = { title: "Criar conta" };

export default async function CadastroPage() {
  const session = await getSession();
  if (session?.user) redirect(painelHref(session.user.role));

  return (
    <AuthCard className="max-w-md">
      <h1 className="text-xl font-semibold text-slate-900">Criar conta</h1>
      <p className="mt-1 text-sm text-slate-600">Para agendar serviços de limpeza.</p>

      <div className="mt-6">
        <CadastroClienteForm />
      </div>

      <div className="mt-6 space-y-1 text-sm text-slate-600">
        <p>
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-teal-700 hover:underline">
            Entrar
          </Link>
        </p>
        <p>
          Quer trabalhar como diarista?{" "}
          <Link href="/cadastro/profissional" className="font-medium text-teal-700 hover:underline">
            Cadastre-se aqui
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
