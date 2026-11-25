import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, painelHref } from "@/lib/auth/dal";
import { AuthCard } from "@/components/auth-card";
import { CabecalhoCadastro } from "@/components/cabecalho-cadastro";
import { CadastroClienteForm } from "./cadastro-cliente-form";

export const metadata: Metadata = { title: "Cadastro de cliente" };

export default async function CadastroClientePage() {
  const session = await getSession();
  if (session?.user) redirect(painelHref(session.user.role));

  return (
    <AuthCard className="max-w-md">
      <CabecalhoCadastro
        papel="cliente"
        titulo="Criar conta para contratar limpeza"
        descricao="É grátis e não tem mensalidade: você paga só o serviço que agendar."
        outroTexto="Veio para trabalhar como diarista? Este cadastro não é o seu."
        outroHref="/cadastro/profissional"
      />

      <div className="mt-6">
        <CadastroClienteForm />
      </div>

      <p className="mt-6 text-sm text-areia-600">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-marinho-700 hover:underline">
          Entrar
        </Link>
      </p>
    </AuthCard>
  );
}
