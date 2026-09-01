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

function colide(aIni: number, aFim: number, bIni: number, bFim: number) {
  return aIni < bFim && bIni < aFim;
}

async function aceitarSerie(seriesId: string, professionalId: string) {
  const ocorrencias = await db.booking.findMany({
    where: { seriesId, status: "AGUARDANDO_PROFISSIONAL" },
    select: { id: true, data: true, inicioMin: true, duracaoHoras: true },
  });
  const agenda = await db.booking.findMany({
    where: { professionalId, status: { in: ["AGENDADO", "EM_ANDAMENTO"] } },
    select: { data: true, inicioMin: true, duracaoHoras: true },
  });

  await db.bookingSeries.update({ where: { id: seriesId }, data: { titularProfessionalId: professionalId } });

  for (const oc of ocorrencias) {
    const ini = oc.inicioMin;
    const fim = oc.inicioMin + oc.duracaoHoras * 60;
    const conflita = agenda.some(
      (a) => a.data.getTime() === oc.data.getTime() && colide(ini, fim, a.inicioMin, a.inicioMin + a.duracaoHoras * 60),
    );
    await db.bookingOffer.updateMany({
      where: { bookingId: oc.id, status: "PENDENTE" },
      data: { status: "EXPIRADA", respondidoEm: new Date() },
    });
    if (conflita) {
      await atribuirProximaDaFila(oc.id);
    } else {
      await db.booking.update({ where: { id: oc.id }, data: { professionalId, status: "AGENDADO" } });
      agenda.push({ data: oc.data, inicioMin: oc.inicioMin, duracaoHoras: oc.duracaoHoras });
    }
  }
}

export async function aceitarOferta(_prev: OfertaState, formData: FormData): Promise<OfertaState> {
  const offerId = String(formData.get("offerId") ?? "");
  if (!offerId) return { erro: "Oferta inválida." };
  const professionalId = await perfilId();

  const oferta = await db.bookingOffer.findFirst({
    where: { id: offerId, professionalId, status: "PENDENTE" },
    select: {
      id: true,
      bookingId: true,
      expiraEm: true,
      abrangeSerie: true,
      booking: { select: { status: true, seriesId: true } },
    },
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

  if (oferta.abrangeSerie && oferta.booking.seriesId) {
    await db.bookingOffer.update({ where: { id: oferta.id }, data: { status: "ACEITA", respondidoEm: new Date() } });
    await aceitarSerie(oferta.booking.seriesId, professionalId);
  } else {
    await db.$transaction([
      db.bookingOffer.update({ where: { id: oferta.id }, data: { status: "ACEITA", respondidoEm: new Date() } }),
      db.booking.update({ where: { id: oferta.bookingId }, data: { professionalId, status: "AGENDADO" } }),
      db.bookingOffer.updateMany({
        where: { bookingId: oferta.bookingId, status: "PENDENTE", id: { not: oferta.id } },
        data: { status: "EXPIRADA", respondidoEm: new Date() },
      }),
    ]);
  }
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
