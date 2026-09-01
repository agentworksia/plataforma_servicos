import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { formatData, formatBRL, minutosParaHora } from "@/lib/format";
import { LABEL_SERVICO, STATUS_BOOKING } from "@/lib/bookings/display";
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
      address: true,
      client: { select: { user: { select: { name: true, telefone: true } } } },
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
    </section>
  );
}
