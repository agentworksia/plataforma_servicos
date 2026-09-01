import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Visão geral" };

export default function AdminPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">Visão geral</h1>
      <p className="mt-1 text-slate-600">
        Aprovação de profissionais, agendamentos, repasses, tabela de preços e regiões atendidas.
      </p>
      <div className="mt-6">
        <EmptyState
          titulo="Painel administrativo"
          descricao="As telas mínimas do admin (aprovar/suspender profissionais, reatribuir serviços, disparar repasses, editar preços e regiões) entram nas próximas etapas."
        />
      </div>
    </section>
  );
}
