import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { formatData, formatBRL, minutosParaHora } from "@/lib/format";
import { LABEL_SERVICO, STATUS_BOOKING } from "@/lib/bookings/display";
import { RECORRENCIAS } from "@/lib/validation/agendamento";
import { cancelarSerie } from "@/lib/bookings/series-actions";
import { ActionForm } from "@/components/action-form";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Série recorrente" };

const LABEL_REC = Object.fromEntries(RECORRENCIAS.map((r) => [r.value, r.label]));

export default async function SerieDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("CLIENTE");
  const cliente = await db.clientProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  const { id } = await params;

  const serie = await db.bookingSeries.findFirst({
    where: { id, clientId: cliente?.id },
    select: {
      id: true,
      tipoServico: true,
      recorrencia: true,
      inicioMin: true,
      duracaoHoras: true,
      ativo: true,
      titular: { select: { user: { select: { name: true } } } },
      address: { select: { bairro: true, cidade: true } },
      bookings: {
        orderBy: { data: "asc" },
        select: { id: true, data: true, status: true, valorTotal: true, professional: { select: { user: { select: { name: true } } } } },
      },
    },
  });
  if (!serie) notFound();

  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);
  const temFuturas = serie.bookings.some(
    (b) => b.data >= hoje && (b.status === "AGUARDANDO_PROFISSIONAL" || b.status === "AGENDADO"),
  );

  return (
    <section className="space-y-6">
      <div>
        <Link href="/cliente" className="text-sm text-teal-700 hover:underline">
          ← Meus agendamentos
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">
            {LABEL_SERVICO[serie.tipoServico] ?? serie.tipoServico} · {LABEL_REC[serie.recorrencia]}
          </h1>
          <Badge cor={serie.ativo ? "verde" : "neutro"}>{serie.ativo ? "Ativa" : "Cancelada"}</Badge>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {minutosParaHora(serie.inicioMin)} · {serie.duracaoHoras}h · {serie.address.bairro}, {serie.address.cidade}
          {serie.titular ? ` · profissional fixa: ${serie.titular.user.name}` : ""}
        </p>
      </div>

      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
        {serie.bookings.map((b) => {
          const st = STATUS_BOOKING[b.status];
          return (
            <li key={b.id}>
              <Link href={`/cliente/agendamentos/${b.id}`} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50">
                <span className="text-slate-800">
                  {formatData(b.data)}
                  {b.professional ? ` · ${b.professional.user.name}` : ""}
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-slate-600">{formatBRL(b.valorTotal)}</span>
                  <Badge cor={st.cor}>{st.label}</Badge>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {serie.ativo && temFuturas && (
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-600">
            Cancelar a série encerra as ocorrências futuras ainda não realizadas e reembolsa os valores retidos.
          </p>
          <div className="mt-3">
            <ActionForm
              action={cancelarSerie}
              submitLabel="Cancelar série"
              variant="danger"
              confirm="Cancelar todas as ocorrências futuras desta série?"
            >
              <input type="hidden" name="seriesId" value={serie.id} />
            </ActionForm>
          </div>
        </div>
      )}
    </section>
  );
}
