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
      <h1 className="titulo-secao text-xl text-areia-900">Criar conta</h1>
      <p className="mt-1 text-sm text-areia-600">Para agendar serviços de limpeza.</p>
      <p className="mt-2 text-sm leading-relaxed text-areia-600">
        Criar conta é grátis e <strong>não tem mensalidade</strong>: você paga só o serviço que
        agendar. A mensalidade existe apenas para quem trabalha como diarista.
      </p>

      <div className="mt-6">
        <CadastroClienteForm />
      </div>

      <div className="mt-6 space-y-1 text-sm text-areia-600">
        <p>
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-marinho-700 hover:underline">
            Entrar
          </Link>
        </p>
        <p>
          Quer trabalhar como diarista?{" "}
          <Link href="/cadastro/profissional" className="font-medium text-marinho-700 hover:underline">
            Cadastre-se aqui
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
