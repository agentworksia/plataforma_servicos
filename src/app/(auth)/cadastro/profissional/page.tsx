import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession, painelHref } from "@/lib/auth/dal";
import { AuthCard } from "@/components/auth-card";
import { CadastroProfissionalForm } from "./cadastro-profissional-form";

export const metadata: Metadata = { title: "Cadastro de profissional" };

export default async function CadastroProfissionalPage() {
  const session = await getSession();
  if (session?.user) redirect(painelHref(session.user.role));

  const regioes = await db.serviceArea.findMany({
    where: { ativo: true },
    orderBy: [{ cidade: "asc" }, { bairro: "asc" }],
    select: { id: true, cidade: true, bairro: true },
  });

  return (
    <AuthCard className="max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900">Cadastro de profissional</h1>
      <p className="mt-1 text-sm text-slate-600">
        Após o envio, sua conta fica <strong>em análise</strong>. Avisamos por e-mail quando for aprovada.
      </p>

      <div className="mt-6">
        <CadastroProfissionalForm regioes={regioes} />
      </div>

      <p className="mt-6 text-sm text-slate-600">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-teal-700 hover:underline">
          Entrar
        </Link>
      </p>
    </AuthCard>
  );
}
