import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { formatData, formatBRL, minutosParaHora } from "@/lib/format";
import { LABEL_SERVICO, STATUS_BOOKING, STATUS_PAGAMENTO } from "@/lib/bookings/display";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Agendamento" };

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-0">
      <span className="text-slate-500">{rotulo}</span>
      <span className="text-right text-slate-900">{children}</span>
    </div>
  );
}

export default async function AgendamentoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("CLIENTE");
  const cliente = await db.clientProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  const { id } = await params;

  const b = await db.booking.findFirst({
    where: { id, clientId: cliente?.id },
    select: {
      id: true,
      tipoServico: true,
      data: true,
      inicioMin: true,
      duracaoHoras: true,
      status: true,
      seriesId: true,
      valorServico: true,
      valorExtras: true,
      taxaPlataforma: true,
      valorTotal: true,
      observacoesCliente: true,
      criadoEm: true,
      address: true,
      professional: { select: { user: { select: { name: true } } } },
      payment: { select: { status: true, metodo: true, pixCopiaCola: true } },
      offers: { where: { status: "PENDENTE" }, select: { id: true } },
      review: { select: { nota: true } },
    },
  });
  if (!b) notFound();

  const st = STATUS_BOOKING[b.status];

  return (
    <section className="space-y-6">
      <div>
        <Link href="/cliente" className="text-sm text-teal-700 hover:underline">
          ← Meus agendamentos
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{LABEL_SERVICO[b.tipoServico] ?? b.tipoServico}</h1>
          <Badge cor={st.cor}>{st.label}</Badge>
        </div>
      </div>

      {b.seriesId && (
        <p className="text-sm text-slate-600">
          Parte de uma série recorrente ·{" "}
          <Link href={`/cliente/series/${b.seriesId}`} className="text-teal-700 hover:underline">
            ver todas as ocorrências
          </Link>
        </p>
      )}

      {b.status === "AGUARDANDO_PROFISSIONAL" && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Estamos procurando uma profissional para o seu horário
          {b.offers.length > 0 ? " — já enviamos uma oferta e aguardamos a resposta." : "."}
        </p>
      )}

      <div className="rounded-xl border border-slate-200 p-5">
        <Linha rotulo="Data">{formatData(b.data)}</Linha>
        <Linha rotulo="Horário">
          {minutosParaHora(b.inicioMin)} · {b.duracaoHoras} horas
        </Linha>
        <Linha rotulo="Endereço">
          {b.address.logradouro}, {b.address.numero}
          {b.address.complemento ? ` · ${b.address.complemento}` : ""} — {b.address.bairro}, {b.address.cidade}
        </Linha>
        {b.professional && <Linha rotulo="Profissional">{b.professional.user.name}</Linha>}
        {b.observacoesCliente && <Linha rotulo="Observações">{b.observacoesCliente}</Linha>}
      </div>

      <div className="rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900">Pagamento</h2>
        <div className="mt-2">
          <Linha rotulo="Serviço">{formatBRL(b.valorServico)}</Linha>
          {b.valorExtras > 0 && <Linha rotulo="Extras">{formatBRL(b.valorExtras)}</Linha>}
          <Linha rotulo="Total">{formatBRL(b.valorTotal)}</Linha>
          <Linha rotulo="Método">{b.payment?.metodo ?? "—"}</Linha>
          <Linha rotulo="Status">{b.payment ? STATUS_PAGAMENTO[b.payment.status] : "—"}</Linha>
        </div>
        {b.payment?.pixCopiaCola && (
          <p className="mt-3 break-all rounded bg-slate-100 p-2 text-xs text-slate-600">{b.payment.pixCopiaCola}</p>
        )}
      </div>
    </section>
  );
}
