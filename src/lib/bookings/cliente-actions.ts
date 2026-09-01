"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { getSettingNumber } from "@/lib/settings";
import { payments } from "@/lib/payments";

export type BookingClienteState = { erro?: string } | undefined;

async function clienteId(): Promise<string> {
  const user = await requireRole("CLIENTE");
  const c = await db.clientProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!c) throw new Error("Perfil de cliente não encontrado.");
  return c.id;
}

export async function cancelarAgendamento(_prev: BookingClienteState, formData: FormData): Promise<BookingClienteState> {
  const bookingId = String(formData.get("bookingId") ?? "");
  const motivo = String(formData.get("motivo") ?? "").trim().slice(0, 300) || null;
  if (!bookingId) return { erro: "Agendamento inválido." };
  const clientId = await clienteId();

  const b = await db.booking.findFirst({
    where: { id: bookingId, clientId },
    select: { status: true, data: true, inicioMin: true, payment: { select: { id: true, status: true, providerId: true, valor: true } } },
  });
  if (!b) return { erro: "Agendamento não encontrado." };
  if (b.status !== "AGUARDANDO_PROFISSIONAL" && b.status !== "AGENDADO") {
    return { erro: "Este agendamento não pode mais ser cancelado por aqui." };
  }

  const prazoHoras = await getSettingNumber("PRAZO_CANCELAMENTO_SEM_CUSTO_HORAS", 24);
  const inicioServico = b.data.getTime() + b.inicioMin * 60_000;
  const semCusto = inicioServico - Date.now() > prazoHoras * 3_600_000;

  if (semCusto && b.payment?.status === "PAGO_RETIDO") {
    try {
      if (b.payment.providerId) await payments.reembolsar(b.payment.providerId);
    } catch (err) {
      console.error("[cancelamento] reembolso falhou", err);
    }
    await db.payment.update({
      where: { id: b.payment.id },
      data: { status: "REEMBOLSADO", reembolsadoEm: new Date(), valorReembolsado: b.payment.valor },
    });
  }

  await db.booking.update({
    where: { id: bookingId },
    data: {
      status: "CANCELADO",
      canceladoEm: new Date(),
      canceladoPor: "CLIENTE",
      motivoCancelamento: motivo ?? (semCusto ? "Cancelado pelo cliente (sem custo)" : "Cancelado pelo cliente (fora do prazo)"),
    },
  });
  await db.bookingOffer.updateMany({
    where: { bookingId, status: "PENDENTE" },
    data: { status: "EXPIRADA", respondidoEm: new Date() },
  });

  revalidatePath(`/cliente/agendamentos/${bookingId}`);
  revalidatePath("/cliente");
  return undefined;
}

const avaliacaoSchema = z.object({
  bookingId: z.string().min(1),
  nota: z.coerce.number().int().min(1).max(5),
  comentario: z.string().trim().max(500).optional(),
});

export async function avaliarServico(_prev: BookingClienteState, formData: FormData): Promise<BookingClienteState> {
  const parsed = avaliacaoSchema.safeParse({
    bookingId: formData.get("bookingId"),
    nota: formData.get("nota"),
    comentario: formData.get("comentario") || undefined,
  });
  if (!parsed.success) return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const clientId = await clienteId();

  const b = await db.booking.findFirst({
    where: { id: parsed.data.bookingId, clientId },
    select: { status: true, professionalId: true, review: { select: { id: true } } },
  });
  if (!b || b.status !== "CONCLUIDO" || !b.professionalId) return { erro: "Só é possível avaliar um serviço concluído." };
  if (b.review) return { erro: "Este serviço já foi avaliado." };

  await db.review.create({
    data: {
      bookingId: parsed.data.bookingId,
      professionalId: b.professionalId,
      clientId,
      nota: parsed.data.nota,
      comentario: parsed.data.comentario ?? null,
    },
  });
  revalidatePath(`/cliente/agendamentos/${parsed.data.bookingId}`);
  return undefined;
}
