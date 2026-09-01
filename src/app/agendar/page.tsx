import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/dal";
import { SiteHeader } from "@/components/site-header";
import { CIDADES_ATENDIDAS } from "@/lib/regioes";
import { AgendarForm } from "./agendar-form";

export const metadata: Metadata = { title: "Agendar um serviço" };

export default async function AgendarPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login?next=/agendar");
  if (session.user.role !== "CLIENTE" && session.user.role !== "ADMIN") redirect("/");

  const cliente = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: { addresses: { orderBy: { criadoEm: "desc" } } },
  });
  const enderecos = cliente?.addresses ?? [];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900">Agendar um serviço</h1>
        <p className="mt-2 text-sm text-slate-600">
          Atendemos {CIDADES_ATENDIDAS.slice(0, 4).join(", ")} e outras cidades da RMC. O sistema atribui
          automaticamente uma profissional verificada.
        </p>

        <div className="mt-8">
          <AgendarForm enderecos={enderecos} />
        </div>

        <p className="mt-6 text-sm text-slate-500">
          <Link href="/cliente" className="text-teal-700 hover:underline">
            Ver meus agendamentos
          </Link>
        </p>
      </main>
    </>
  );
}
