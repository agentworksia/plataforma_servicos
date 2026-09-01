import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Ofertas de serviço" };

export default function ProfissionalPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">Ofertas de serviço</h1>
      <p className="mt-1 text-slate-600">Aceite ou recuse cada oferta dentro do prazo.</p>
      <div className="mt-6">
        <EmptyState
          titulo="Sem ofertas no momento"
          descricao="Cadastro completo, agenda de disponibilidade e recebimento de ofertas entram nas próximas etapas. Sua conta ainda passa por aprovação manual antes de ficar visível."
        />
      </div>
    </section>
  );
}
