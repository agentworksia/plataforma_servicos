import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { formatData, formatBRL, minutosParaHora } from "@/lib/format";
import { LABEL_SERVICO, STATUS_BOOKING } from "@/lib/bookings/display";
import { concluirServico, iniciarServico } from "@/lib/professionals/servico-actions";
import { ActionForm } from "@/components/action-form";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Serviço" };

export default async function ServicoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("PROFISSIONAL");
  const perfil = await db.professionalProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  const { id } = await params;

  const b = await db.booking.findFirst({
    where: { id, professionalId: perfil?.id },
    select: {
      id: true,
      tipoServico: true,
      data: true,
      inicioMin: true,
      duracaoHoras: true,
      status: true,
      repasseProfissional: true,
      observacoesCliente: true,
      concluidoEm: true,
      address: true,
      client: { select: { user: { select: { name: true, telefone: true } } } },
      review: { select: { nota: true, comentario: true } },
      payout: { select: { status: true, valor: true, liberadoEm: true } },
    },
  });
  if (!b) notFound();

  const st = STATUS_BOOKING[b.status];

  return (
    <section className="space-y-6">
      <div>
        <Link href="/profissional" className="text-sm text-teal-700 hover:underline">
          ← Ofertas
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{LABEL_SERVICO[b.tipoServico] ?? b.tipoServico}</h1>
          <Badge cor={st.cor}>{st.label}</Badge>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-slate-200 p-5 text-sm">
        <p><strong>Data:</strong> {formatData(b.data)} · {minutosParaHora(b.inicioMin)} · {b.duracaoHoras}h</p>
        <p><strong>Endereço:</strong> {b.address.logradouro}, {b.address.numero}
          {b.address.complemento ? ` · ${b.address.complemento}` : ""} — {b.address.bairro}, {b.address.cidade}
          {b.address.referencia ? ` (${b.address.referencia})` : ""}</p>
        <p><strong>Cliente:</strong> {b.client.user.name} · {b.client.user.telefone ?? "sem telefone"}</p>
        <p><strong>Você recebe:</strong> {formatBRL(b.repasseProfissional)}</p>
        {b.observacoesCliente && <p><strong>Observações:</strong> {b.observacoesCliente}</p>}
      </div>

      {(b.status === "AGENDADO" || b.status === "EM_ANDAMENTO") && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 p-4">
          {b.status === "AGENDADO" && (
            <ActionForm action={iniciarServico} submitLabel="Iniciar serviço" className="space-y-0">
              <input type="hidden" name="bookingId" value={b.id} />
            </ActionForm>
          )}
          <ActionForm
            action={concluirServico}
            submitLabel="Concluir serviço"
            variant={b.status === "EM_ANDAMENTO" ? "primary" : "outline"}
            className="space-y-0"
            confirm="Marcar este serviço como concluído?"
          >
            <input type="hidden" name="bookingId" value={b.id} />
          </ActionForm>
        </div>
      )}

      {b.status === "CONCLUIDO" && (
        <div className="rounded-xl border border-slate-200 p-4 text-sm">
          <p>Concluído em {b.concluidoEm ? formatData(b.concluidoEm) : "—"}.</p>
          {b.payout && (
            <p className="mt-1 text-slate-600">
              Repasse de {formatBRL(b.payout.valor)} — {b.payout.status === "PAGO" ? "pago" : `previsto para ${b.payout.liberadoEm ? formatData(b.payout.liberadoEm) : "—"}`}.
            </p>
          )}
          {b.review && (
            <p className="mt-2 text-slate-700">
              Avaliação do cliente: <strong>{b.review.nota}/5</strong>
              {b.review.comentario ? ` — "${b.review.comentario}"` : ""}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
