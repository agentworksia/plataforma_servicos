"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { atribuirProximaDaFila } from "@/lib/matching";

export type AdminBookingState = { erro?: string; ok?: string } | undefined;

export async function reprocessarFila(_prev: AdminBookingState, formData: FormData): Promise<AdminBookingState> {
  await requireRole("ADMIN");
  const bookingId = String(formData.get("bookingId") ?? "");
  if (!bookingId) return { erro: "Agendamento inválido." };

  const b = await db.booking.findUnique({ where: { id: bookingId }, select: { status: true } });
  if (!b || b.status !== "AGUARDANDO_PROFISSIONAL") return { erro: "Só dá para reprocessar quem está aguardando." };

  const r = await atribuirProximaDaFila(bookingId);
  revalidatePath("/admin/agendamentos");
  return r.status === "OFERTA_ENVIADA" ? { ok: "Oferta enviada ao próximo da fila." } : { erro: "Nenhuma profissional elegível no momento." };
}

export async function atribuirManualmente(_prev: AdminBookingState, formData: FormData): Promise<AdminBookingState> {
  await requireRole("ADMIN");
  const bookingId = String(formData.get("bookingId") ?? "");
  const professionalId = String(formData.get("professionalId") ?? "");
  if (!bookingId || !professionalId) return { erro: "Dados incompletos." };

  const prof = await db.professionalProfile.findFirst({ where: { id: professionalId, status: "APROVADA" }, select: { id: true } });
  if (!prof) return { erro: "Profissional inválida ou não aprovada." };

  await db.$transaction([
    db.booking.update({ where: { id: bookingId }, data: { professionalId, status: "AGENDADO" } }),
    db.bookingOffer.updateMany({ where: { bookingId, status: "PENDENTE" }, data: { status: "EXPIRADA", respondidoEm: new Date() } }),
  ]);
  revalidatePath("/admin/agendamentos");
  return { ok: "Serviço atribuído." };
}
