import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession, painelHref } from "@/lib/auth/dal";
import { AuthCard } from "@/components/auth-card";
import { PlanosResumo } from "@/components/planos-resumo";
import { getSettingNumber } from "@/lib/settings";
import { CadastroProfissionalForm } from "./cadastro-profissional-form";

export const metadata: Metadata = { title: "Cadastro de profissional" };

export default async function CadastroProfissionalPage() {
  const session = await getSession();
  if (session?.user) redirect(painelHref(session.user.role));

  const taxaPct = await getSettingNumber("TAXA_PLATAFORMA_PCT", 15);

  // Agrupa por estado: com o litoral de SC aberto, são mais de 30 cidades na lista.
  const regioes = await db.serviceArea.findMany({
    where: { ativo: true },
    orderBy: [{ uf: "asc" }, { cidade: "asc" }, { bairro: "asc" }],
    select: { id: true, cidade: true, bairro: true, uf: true },
  });

  return (
    <AuthCard className="max-w-2xl">
      <h1 className="titulo-secao text-xl text-areia-900">Cadastro de profissional</h1>
      <p className="mt-1 text-sm text-areia-600">
        Após o envio, sua conta fica <strong>em análise</strong>. Avisamos por e-mail quando for aprovada.
      </p>
      <PlanosResumo taxaPct={taxaPct} className="mt-5" />
      <p className="mt-3 text-sm leading-relaxed text-areia-600">
        Você escolhe o plano depois da aprovação — nada é cobrado agora.
      </p>

      <div className="mt-6">
        <CadastroProfissionalForm regioes={regioes} />
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
