import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Visão geral" };

export default async function AdminPage() {
  await requireRole("ADMIN");
  const pendentes = await db.professionalProfile.count({ where: { status: "PENDENTE" } });

  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">Visão geral</h1>
      <p className="mt-1 text-slate-600">
        Aprovação de profissionais, agendamentos, repasses, tabela de preços e regiões atendidas.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/profissionais?status=PENDENTE"
          className="rounded-xl border border-slate-200 p-5 transition-colors hover:border-teal-300 hover:bg-teal-50/40"
        >
          <p className="text-3xl font-bold text-slate-900">{pendentes}</p>
          <p className="mt-1 text-sm text-slate-600">
            {pendentes === 1 ? "profissional aguardando aprovação" : "profissionais aguardando aprovação"}
          </p>
        </Link>
      </div>

      <div className="mt-6">
        <EmptyState
          titulo="Demais telas do admin"
          descricao="Agendamentos, repasses, tabela de preços e regiões atendidas entram nas próximas etapas."
        />
      </div>
    </section>
  );
}
