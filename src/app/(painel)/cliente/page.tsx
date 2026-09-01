import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { formatData, formatBRL, minutosParaHora } from "@/lib/format";
import { LABEL_SERVICO, STATUS_BOOKING } from "@/lib/bookings/display";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Meus agendamentos" };

export default async function ClientePage() {
  const user = await requireRole("CLIENTE");
  const cliente = await db.clientProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  const bookings = cliente
    ? await db.booking.findMany({
        where: { clientId: cliente.id },
        orderBy: { data: "desc" },
        select: {
          id: true,
          tipoServico: true,
          data: true,
          inicioMin: true,
          duracaoHoras: true,
          status: true,
          valorTotal: true,
          address: { select: { bairro: true, cidade: true } },
        },
      })
    : [];

  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);
  const proximos = bookings.filter((b) => b.data >= hoje && b.status !== "CANCELADO" && b.status !== "CONCLUIDO");
  const passados = bookings.filter((b) => !proximos.includes(b));

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meus agendamentos</h1>
          <p className="mt-1 text-slate-600">Acompanhe o status de cada serviço.</p>
        </div>
        <Link href="/agendar" className={cn(buttonVariants())}>
          Novo agendamento
        </Link>
      </div>

      {bookings.length === 0 ? (
        <EmptyState titulo="Nenhum agendamento ainda" descricao="Toque em 'Novo agendamento' para começar." />
      ) : (
        <>
          <Lista titulo="Próximos" itens={proximos} />
          <Lista titulo="Passados" itens={passados} />
        </>
      )}
    </section>
  );
}

function Lista({
  titulo,
  itens,
}: {
  titulo: string;
  itens: {
    id: string;
    tipoServico: string;
    data: Date;
    inicioMin: number;
    duracaoHoras: number;
    status: keyof typeof STATUS_BOOKING;
    valorTotal: number;
    address: { bairro: string; cidade: string };
  }[];
}) {
  if (itens.length === 0) return null;
  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-slate-900">{titulo}</h2>
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
        {itens.map((b) => {
          const st = STATUS_BOOKING[b.status];
          return (
            <li key={b.id}>
              <Link href={`/cliente/agendamentos/${b.id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50">
                <div className="text-sm">
                  <div className="font-medium text-slate-900">{LABEL_SERVICO[b.tipoServico] ?? b.tipoServico}</div>
                  <div className="text-slate-500">
                    {formatData(b.data)} · {minutosParaHora(b.inicioMin)} · {b.duracaoHoras}h · {b.address.bairro}, {b.address.cidade}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm text-slate-600">{formatBRL(b.valorTotal)}</span>
                  <Badge cor={st.cor}>{st.label}</Badge>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
