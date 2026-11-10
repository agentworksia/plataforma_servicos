import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payments } from "@/lib/payments";
import { atribuirProximaDaFila } from "@/lib/matching";
import { registrarMensalidadeAtrasada, registrarMensalidadePaga } from "@/lib/assinaturas";

/**
 * Webhook do provedor de pagamento.
 *
 * Três coisas seguram este endpoint, e nenhuma é opcional:
 *  1. autenticidade — `interpretarWebhook` confere o token do provedor e lança se não bater;
 *  2. idempotência — o provedor reenvia o mesmo evento até receber 200, e confirmar duas
 *     vezes criaria dois repasses;
 *  3. nada de confiar em valor vindo do corpo: o que vale é o que já está no banco.
 */
export async function POST(request: Request) {
  let evento;
  try {
    evento = await payments.interpretarWebhook(request);
  } catch (err) {
    // 401, e não 400: a causa é token ausente ou errado. O corpo não é logado para um
    // payload forjado não virar entrada de log arbitrária.
    console.error("[webhook:pagamento] requisição recusada:", err instanceof Error ? err.message : err);
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  if (evento.tipo === "IGNORADO") return NextResponse.json({ recebido: true });

  // Trava de idempotência: a unique (provider, eventoId) falha no reenvio.
  try {
    await db.webhookEvento.create({
      data: { provider: payments.nome, eventoId: evento.eventoId, tipo: evento.tipo },
    });
  } catch {
    return NextResponse.json({ recebido: true, repetido: true });
  }

  try {
    switch (evento.tipo) {
      case "PAGAMENTO_CONFIRMADO":
        if (evento.assinaturaProviderId) {
          const cobranca = await db.assinaturaCobranca.findUnique({
            where: { providerId: evento.providerId },
            select: { valor: true },
          });
          const assinatura = await db.assinatura.findUnique({
            where: { providerId: evento.assinaturaProviderId },
            select: { valorCentavos: true },
          });
          await registrarMensalidadePaga(
            evento.assinaturaProviderId,
            evento.providerId,
            cobranca?.valor ?? assinatura?.valorCentavos ?? 0,
          );
        } else {
          await confirmarPagamentoDeServico(evento.providerId);
        }
        break;

      case "PAGAMENTO_FALHOU":
        if (evento.assinaturaProviderId) {
          await registrarMensalidadeAtrasada(evento.assinaturaProviderId);
        } else {
          await db.payment.updateMany({
            where: { providerId: evento.providerId },
            data: { status: "FALHOU" },
          });
        }
        break;

      case "REEMBOLSO_CONFIRMADO": {
        const pagamento = await db.payment.findUnique({
          where: { providerId: evento.providerId },
          select: { id: true, valor: true },
        });
        if (pagamento) {
          const total = evento.valorCentavos >= pagamento.valor;
          await db.payment.update({
            where: { id: pagamento.id },
            data: {
              status: total ? "REEMBOLSADO" : "PARCIALMENTE_REEMBOLSADO",
              reembolsadoEm: new Date(),
              valorReembolsado: evento.valorCentavos,
            },
          });
        }
        break;
      }
    }
  } catch (err) {
    // O evento já está gravado, então o reenvio do provedor cairia na trava de
    // idempotência e o efeito se perderia. Apaga o registro para o reenvio valer.
    await db.webhookEvento
      .deleteMany({ where: { provider: payments.nome, eventoId: evento.eventoId } })
      .catch(() => {});
    console.error("[webhook:pagamento] falha ao processar", evento.tipo, err);
    return NextResponse.json({ erro: "falha ao processar" }, { status: 500 });
  }

  return NextResponse.json({ recebido: true });
}

/**
 * Confirma o pagamento do serviço e só então coloca o agendamento na fila. É aqui que
 * mora a regra: nenhuma profissional é acionada antes de o dinheiro entrar.
 */
async function confirmarPagamentoDeServico(providerId: string) {
  const pagamento = await db.payment.findUnique({
    where: { providerId },
    select: { id: true, bookingId: true, status: true },
  });
  if (!pagamento) {
    console.warn(`[webhook:pagamento] cobrança desconhecida ${providerId}`);
    return;
  }
  if (pagamento.status === "PAGO_RETIDO") return;

  await db.payment.update({
    where: { id: pagamento.id },
    data: { status: "PAGO_RETIDO", pagoEm: new Date() },
  });

  try {
    await atribuirProximaDaFila(pagamento.bookingId);
  } catch (err) {
    // Matching é recuperável pelo admin (/admin/agendamentos reprocessa a fila); o
    // pagamento, não. Por isso ele não derruba a confirmação.
    console.error("[webhook:pagamento] matching falhou após confirmação", err);
  }
}
