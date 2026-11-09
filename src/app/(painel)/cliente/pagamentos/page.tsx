import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { formatBRL, formatData, formatDataCurta } from "@/lib/format";
import { LABEL_SERVICO, STATUS_PAGAMENTO } from "@/lib/bookings/display";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { PaymentStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Meus pagamentos" };

const COR: Record<PaymentStatus, "amarelo" | "verde" | "vermelho" | "neutro"> = {
  PENDENTE: "amarelo",
  PAGO_RETIDO: "verde",
  LIBERADO: "neutro",
  REEMBOLSADO: "neutro",
  PARCIALMENTE_REEMBOLSADO: "neutro",
  FALHOU: "vermelho",
};

export default async function ClientePagamentosPage() {
  const user = await requireRole("CLIENTE");
  const cliente = await db.clientProfile.findUnique({ where: { userId: user.id }, select: { id: true } });

  const pagamentos = cliente
    ? await db.payment.findMany({
        where: { booking: { clientId: cliente.id } },
        orderBy: { criadoEm: "desc" },
        select: {
          id: true,
          metodo: true,
          status: true,
          valor: true,
          pagoEm: true,
          valorReembolsado: true,
          criadoEm: true,
          booking: {
            select: { id: true, tipoServico: true, data: true, status: true },
          },
        },
      })
    : [];

  const pago = pagamentos
    .filter((p) => p.status === "PAGO_RETIDO" || p.status === "LIBERADO")
    .reduce((s, p) => s + p.valor - p.valorReembolsado, 0);
  const retido = pagamentos.filter((p) => p.status === "PAGO_RETIDO").reduce((s, p) => s + p.valor, 0);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="titulo text-2xl text-marinho-900">Meus pagamentos</h1>
        <p className="mt-1 max-w-2xl text-areia-600">
          Cada pagamento fica retido na plataforma e só é repassado à profissional depois que o serviço é
          concluído.
        </p>
      </div>

      {pagamentos.length === 0 ? (
        <EmptyState
          titulo="Nenhum pagamento ainda"
          descricao="Assim que você agendar o primeiro serviço, o pagamento aparece aqui com o status atualizado."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-cartao border border-areia-200 bg-white p-5">
              <p className="text-sm text-areia-600">Total pago</p>
              <p className="numeros titulo mt-1 text-3xl text-marinho-900">{formatBRL(pago)}</p>
            </div>
            <div className="rounded-cartao border border-areia-200 bg-white p-5">
              <p className="text-sm text-areia-600">Retido agora</p>
              <p className="numeros titulo mt-1 text-3xl text-marinho-900">{formatBRL(retido)}</p>
              <p className="mt-1 text-xs leading-relaxed text-areia-500">
                Valor de serviços já pagos que ainda não foram concluídos.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-areia-200 text-left text-areia-500">
                  <th className="py-2 pr-4 font-medium">Serviço</th>
                  <th className="py-2 pr-4 font-medium">Pago em</th>
                  <th className="py-2 pr-4 font-medium">Forma</th>
                  <th className="py-2 pr-4 font-medium">Valor</th>
                  <th className="py-2 pr-4 font-medium">Situação</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {pagamentos.map((p) => (
                  <tr key={p.id} className="border-b border-areia-100">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-areia-900">
                        {LABEL_SERVICO[p.booking.tipoServico] ?? p.booking.tipoServico}
                      </div>
                      <div className="text-areia-500">serviço em {formatData(p.booking.data)}</div>
                    </td>
                    <td className="numeros py-3 pr-4 text-areia-600">
                      {p.pagoEm ? formatDataCurta(p.pagoEm) : "—"}
                    </td>
                    <td className="py-3 pr-4 text-areia-600">{p.metodo === "PIX" ? "Pix" : "Cartão"}</td>
                    <td className="numeros py-3 pr-4 text-areia-900">
                      {formatBRL(p.valor)}
                      {p.valorReembolsado > 0 && (
                        <div className="text-xs text-areia-500">
                          {formatBRL(p.valorReembolsado)} devolvido
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge cor={COR[p.status]}>{STATUS_PAGAMENTO[p.status]}</Badge>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/cliente/agendamentos/${p.booking.id}`}
                        className="font-medium text-marinho-700 hover:underline"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
