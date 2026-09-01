import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { formatData, formatBRL, minutosParaHora } from "@/lib/format";
import { LABEL_SERVICO, STATUS_BOOKING } from "@/lib/bookings/display";
import { atribuirManualmente, reprocessarFila } from "@/lib/admin/bookings-actions";
import { ActionForm } from "@/components/action-form";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Agendamentos" };

const FILTROS: { label: string; status?: BookingStatus }[] = [
  { label: "Aguardando", status: "AGUARDANDO_PROFISSIONAL" },
  { label: "Agendados", status: "AGENDADO" },
  { label: "Em andamento", status: "EM_ANDAMENTO" },
  { label: "Concluídos", status: "CONCLUIDO" },
  { label: "Cancelados", status: "CANCELADO" },
  { label: "Todos", status: undefined },
];

export default async function AdminAgendamentosPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireRole("ADMIN");
  const { status } = await searchParams;
  const filtro = FILTROS.find((f) => f.status === status)?.status ?? (status === "TODOS" ? undefined : "AGUARDANDO_PROFISSIONAL");

  const bookings = await db.booking.findMany({
    where: filtro ? { status: filtro } : undefined,
    orderBy: { data: "asc" },
    select: {
      id: true,
      tipoServico: true,
      data: true,
      inicioMin: true,
      duracaoHoras: true,
      status: true,
      valorTotal: true,
      address: { select: { bairro: true, cidade: true } },
      client: { select: { user: { select: { name: true } } } },
      professional: { select: { user: { select: { name: true } } } },
      offers: { where: { status: "PENDENTE" }, select: { professional: { select: { user: { select: { name: true } } } } } },
    },
  });

  const aprovadas = await db.professionalProfile.findMany({
    where: { status: "APROVADA" },
    select: { id: true, user: { select: { name: true } } },
    orderBy: { user: { name: "asc" } },
  });

  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">Agendamentos</h1>
      <p className="mt-1 text-slate-600">Acompanhe e reatribua os serviços que estão aguardando profissional.</p>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {FILTROS.map((f) => {
          const ativo = f.status === filtro || (f.status === undefined && !filtro);
          return (
            <Link
              key={f.label}
              href={f.status ? `/admin/agendamentos?status=${f.status}` : "/admin/agendamentos?status=TODOS"}
              className={cn(
                "rounded-lg px-3 py-1.5 font-medium",
                ativo ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 space-y-3">
        {bookings.length === 0 && <EmptyState titulo="Nada aqui" descricao="Ajuste o filtro acima." />}
        {bookings.map((b) => {
          const st = STATUS_BOOKING[b.status];
          return (
            <div key={b.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="text-sm">
                  <div className="font-medium text-slate-900">
                    {LABEL_SERVICO[b.tipoServico] ?? b.tipoServico} · {formatBRL(b.valorTotal)}
                  </div>
                  <div className="text-slate-500">
                    {formatData(b.data)} · {minutosParaHora(b.inicioMin)} · {b.duracaoHoras}h · {b.address.bairro}, {b.address.cidade}
                  </div>
                  <div className="text-slate-500">
                    Cliente: {b.client.user.name} · Profissional: {b.professional?.user.name ?? "—"}
                    {b.offers[0] ? ` (oferta pendente p/ ${b.offers[0].professional.user.name})` : ""}
                  </div>
                </div>
                <Badge cor={st.cor}>{st.label}</Badge>
              </div>

              {b.status === "AGUARDANDO_PROFISSIONAL" && (
                <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-3">
                  <ActionForm action={reprocessarFila} submitLabel="Reprocessar fila" variant="outline" size="sm" className="space-y-0">
                    <input type="hidden" name="bookingId" value={b.id} />
                  </ActionForm>
                  <ActionForm action={atribuirManualmente} submitLabel="Atribuir" size="sm" className="flex items-end gap-2 space-y-0">
                    <input type="hidden" name="bookingId" value={b.id} />
                    <select
                      name="professionalId"
                      className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Escolher profissional…
                      </option>
                      {aprovadas.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.user.name}
                        </option>
                      ))}
                    </select>
                  </ActionForm>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
