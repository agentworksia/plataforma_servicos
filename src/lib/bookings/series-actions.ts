"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { payments } from "@/lib/payments";

export type SerieState = { erro?: string } | undefined;

/** Cancela as ocorrências futuras de uma série e reembolsa os pagamentos retidos. */
export async function cancelarSerie(_prev: SerieState, formData: FormData): Promise<SerieState> {
  const user = await requireRole("CLIENTE");
  const cliente = await db.clientProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  const seriesId = String(formData.get("seriesId") ?? "");
  if (!seriesId) return { erro: "Série inválida." };

  const serie = await db.bookingSeries.findFirst({ where: { id: seriesId, clientId: cliente?.id }, select: { id: true } });
  if (!serie) return { erro: "Série não encontrada." };

  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);

  const futuras = await db.booking.findMany({
    where: {
      seriesId,
      data: { gte: hoje },
      status: { in: ["AGUARDANDO_PROFISSIONAL", "AGENDADO"] },
    },
    select: { id: true, payment: { select: { id: true, status: true, providerId: true, valor: true } } },
  });

  for (const b of futuras) {
    if (b.payment && b.payment.status === "PAGO_RETIDO") {
      try {
        if (b.payment.providerId) await payments.reembolsar(b.payment.providerId);
      } catch (err) {
        console.error("[serie] reembolso falhou", err);
      }
      await db.payment.update({
        where: { id: b.payment.id },
        data: { status: "REEMBOLSADO", reembolsadoEm: new Date(), valorReembolsado: b.payment.valor },
      });
    }
    await db.booking.update({
      where: { id: b.id },
      data: {
        status: "CANCELADO",
        canceladoEm: new Date(),
        canceladoPor: "CLIENTE",
        motivoCancelamento: "Série cancelada pelo cliente",
      },
    });
    await db.bookingOffer.updateMany({
      where: { bookingId: b.id, status: "PENDENTE" },
      data: { status: "EXPIRADA", respondidoEm: new Date() },
    });
  }

  await db.bookingSeries.update({ where: { id: seriesId }, data: { ativo: false } });
  revalidatePath(`/cliente/series/${seriesId}`);
  revalidatePath("/cliente");
  return undefined;
}
