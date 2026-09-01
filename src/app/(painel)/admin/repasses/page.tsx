import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { formatData, formatBRL } from "@/lib/format";
import { STATUS_PAYOUT } from "@/lib/bookings/display";
import { liberarElegiveis, liberarRepasse } from "@/lib/admin/payouts-actions";
import { ActionForm } from "@/components/action-form";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Repasses" };

export default async function AdminRepassesPage() {
  await requireRole("ADMIN");
  const payouts = await db.payout.findMany({
    orderBy: [{ status: "asc" }, { liberadoEm: "asc" }],
    select: {
      id: true,
      valor: true,
      status: true,
      liberadoEm: true,
      pagoEm: true,
      professional: { select: { user: { select: { name: true } } }, },
      booking: { select: { data: true, tipoServico: true, concluidoEm: true } },
    },
  });

  const pendentes = payouts.filter((p) => p.status === "PENDENTE");
  const totalPendente = pendentes.reduce((s, p) => s + p.valor, 0);

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Repasses</h1>
          <p className="mt-1 text-slate-600">
            {pendentes.length} pendente(s) · {formatBRL(totalPendente)} a liberar.
          </p>
        </div>
        {pendentes.length > 0 && (
          <ActionForm action={liberarElegiveis} submitLabel="Liberar elegíveis" className="space-y-0" />
        )}
      </div>

      <div className="mt-6">
        {payouts.length === 0 ? (
          <EmptyState titulo="Nenhum repasse" descricao="Repasses são criados quando um serviço é concluído." />
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
            {payouts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <div className="font-medium text-slate-900">
                    {p.professional.user.name} · {formatBRL(p.valor)}
                  </div>
                  <div className="text-slate-500">
                    {p.booking.tipoServico} em {formatData(p.booking.data)} · previsto {p.liberadoEm ? formatData(p.liberadoEm) : "—"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">{STATUS_PAYOUT[p.status]}</span>
                  {p.status === "PENDENTE" && (
                    <ActionForm action={liberarRepasse} submitLabel="Liberar" size="sm" className="space-y-0">
                      <input type="hidden" name="payoutId" value={p.id} />
                    </ActionForm>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
