import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { formatData, formatBRL } from "@/lib/format";
import { STATUS_PAYOUT } from "@/lib/bookings/display";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Ganhos" };

export default async function GanhosPage() {
  const user = await requireRole("PROFISSIONAL");
  const perfil = await db.professionalProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  const payouts = perfil
    ? await db.payout.findMany({
        where: { professionalId: perfil.id },
        orderBy: { criadoEm: "desc" },
        select: {
          id: true,
          valor: true,
          status: true,
          liberadoEm: true,
          pagoEm: true,
          booking: { select: { id: true, data: true, tipoServico: true } },
        },
      })
    : [];

  const recebido = payouts.filter((p) => p.status === "PAGO").reduce((s, p) => s + p.valor, 0);
  const aReceber = payouts.filter((p) => p.status !== "PAGO" && p.status !== "CANCELADO").reduce((s, p) => s + p.valor, 0);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Ganhos</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-5">
          <p className="text-3xl font-bold text-slate-900">{formatBRL(recebido)}</p>
          <p className="mt-1 text-sm text-slate-600">já recebido</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-5">
          <p className="text-3xl font-bold text-slate-900">{formatBRL(aReceber)}</p>
          <p className="mt-1 text-sm text-slate-600">a receber</p>
        </div>
      </div>

      {payouts.length === 0 ? (
        <EmptyState titulo="Sem repasses ainda" descricao="Cada serviço concluído gera um repasse, liberado alguns dias depois." />
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
          {payouts.map((p) => (
            <li key={p.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-slate-800">
                {formatData(p.booking.data)} · {p.booking.tipoServico}
              </span>
              <span className="flex items-center gap-3">
                <span className="text-slate-600">{formatBRL(p.valor)}</span>
                <span className="text-slate-400">{STATUS_PAYOUT[p.status]}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
