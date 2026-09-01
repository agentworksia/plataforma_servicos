import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Meus agendamentos" };

export default function ClientePage() {
  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">Meus agendamentos</h1>
      <p className="mt-1 text-slate-600">Próximos e passados, com status de cada serviço.</p>
      <div className="mt-6">
        <EmptyState
          titulo="Nenhum agendamento ainda"
          descricao="O fluxo de agendamento (tipo de serviço, endereço, data, duração, recorrência e pagamento) entra na próxima etapa."
        />
      </div>
    </section>
  );
}
