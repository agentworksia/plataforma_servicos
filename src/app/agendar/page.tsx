import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/dal";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { profissionaisJaAtenderam } from "@/lib/professionals/historico";
import { ehTipoValido } from "@/lib/servicos";
import { CIDADES_PR, CIDADES_SC } from "@/lib/regioes";
import { AgendarForm } from "./agendar-form";

export const metadata: Metadata = { title: "Agendar um serviço" };

export default async function AgendarPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const session = await getSession();
  // Preserva o serviço escolhido na capa ao passar pelo login.
  const destino = tipo ? `/agendar?tipo=${encodeURIComponent(tipo)}` : "/agendar";
  if (!session?.user) redirect(`/login?next=${encodeURIComponent(destino)}`);
  if (session.user.role !== "CLIENTE" && session.user.role !== "ADMIN") redirect("/");

  const cliente = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, addresses: { orderBy: { criadoEm: "desc" } } },
  });
  const enderecos = cliente?.addresses ?? [];
  const profissionais = cliente ? await profissionaisJaAtenderam(cliente.id) : [];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
        <h1 className="titulo text-3xl text-mar-900 sm:text-4xl">Agendar um serviço</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-pedra-600">
          Atendemos {CIDADES_PR.slice(0, 3).join(", ")} e mais {CIDADES_PR.length - 3} cidades da Região
          Metropolitana, além de {CIDADES_SC.length} cidades do litoral de Santa Catarina. O preço aparece
          aqui do lado e não muda depois.
        </p>

        <div className="mt-8">
          <AgendarForm
            enderecos={enderecos}
            profissionais={profissionais}
            tipoInicial={ehTipoValido(tipo) ? tipo : "DIARIA_PADRAO"}
          />
        </div>

        <p className="mt-8 text-sm">
          <Link href="/cliente" className="text-mar-700 hover:underline">
            Ver meus agendamentos
          </Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
