"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { atribuirProximaDaFila } from "@/lib/matching";

export type OfertaState = { erro?: string } | undefined;

async function perfilId(): Promise<string> {
  const user = await requireRole("PROFISSIONAL");
  const p = await db.professionalProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!p) throw new Error("Perfil de profissional não encontrado.");
  return p.id;
}

export async function aceitarOferta(_prev: OfertaState, formData: FormData): Promise<OfertaState> {
  const offerId = String(formData.get("offerId") ?? "");
  if (!offerId) return { erro: "Oferta inválida." };
  const professionalId = await perfilId();

  const oferta = await db.bookingOffer.findFirst({
    where: { id: offerId, professionalId, status: "PENDENTE" },
    select: { id: true, bookingId: true, expiraEm: true, booking: { select: { status: true } } },
  });
  if (!oferta) return { erro: "Oferta não encontrada ou já respondida." };
  if (oferta.expiraEm < new Date()) {
    await db.bookingOffer.update({ where: { id: oferta.id }, data: { status: "EXPIRADA", respondidoEm: new Date() } });
    await atribuirProximaDaFila(oferta.bookingId);
    revalidatePath("/profissional");
    return { erro: "Esta oferta expirou." };
  }
  if (oferta.booking.status !== "AGUARDANDO_PROFISSIONAL") {
    return { erro: "Este serviço já foi atribuído a outra pessoa." };
  }

  await db.$transaction([
    db.bookingOffer.update({ where: { id: oferta.id }, data: { status: "ACEITA", respondidoEm: new Date() } }),
    db.booking.update({ where: { id: oferta.bookingId }, data: { professionalId, status: "AGENDADO" } }),
    db.bookingOffer.updateMany({
      where: { bookingId: oferta.bookingId, status: "PENDENTE", id: { not: oferta.id } },
      data: { status: "EXPIRADA", respondidoEm: new Date() },
    }),
  ]);
  revalidatePath("/profissional");
  return undefined;
}

export async function recusarOferta(_prev: OfertaState, formData: FormData): Promise<OfertaState> {
  const offerId = String(formData.get("offerId") ?? "");
  if (!offerId) return { erro: "Oferta inválida." };
  const professionalId = await perfilId();

  const oferta = await db.bookingOffer.findFirst({
    where: { id: offerId, professionalId, status: "PENDENTE" },
    select: { id: true, bookingId: true },
  });
  if (!oferta) return { erro: "Oferta não encontrada ou já respondida." };

  await db.bookingOffer.update({ where: { id: oferta.id }, data: { status: "RECUSADA", respondidoEm: new Date() } });
  await atribuirProximaDaFila(oferta.bookingId);
  revalidatePath("/profissional");
  return undefined;
}
