import { NextResponse } from "next/server";
import { payments } from "@/lib/payments";

// Webhook do provedor de pagamento. No MVP o provider "fake" nunca chama isto;
// fica pronto para o provider real confirmar pagamento (habilita repasse) e reembolso.
export async function POST(request: Request) {
  let evento;
  try {
    evento = await payments.interpretarWebhook(request);
  } catch (err) {
    console.error("[webhook:pagamento] payload inválido", err);
    return NextResponse.json({ erro: "payload inválido" }, { status: 400 });
  }

  switch (evento.tipo) {
    case "PAGAMENTO_CONFIRMADO":
      // TODO(feature: pagamento): marcar Payment.status = PAGO_RETIDO, Booking -> AGUARDANDO_PROFISSIONAL/AGENDADO
      break;
    case "PAGAMENTO_FALHOU":
      // TODO: Payment.status = FALHOU, notificar cliente
      break;
    case "REEMBOLSO_CONFIRMADO":
      // TODO: Payment.status = REEMBOLSADO / PARCIALMENTE_REEMBOLSADO
      break;
    case "IGNORADO":
      break;
  }

  return NextResponse.json({ recebido: true });
}
