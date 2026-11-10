"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { atribuirProximaDaFila } from "@/lib/matching";
import { criarCobrancaDoAceite } from "@/lib/bookings/cobranca";

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
    select: { id: true, data: true, inicioMin: true, duracaoMinutos: true },
  });
  const agenda = await db.booking.findMany({
    where: { professionalId, status: { in: ["AGENDADO", "EM_ANDAMENTO"] } },
    select: { data: true, inicioMin: true, duracaoMinutos: true },
  });

  await db.bookingSeries.update({ where: { id: seriesId }, data: { titularProfessionalId: professionalId } });

  const aceitas: string[] = [];

  for (const oc of ocorrencias) {
    const ini = oc.inicioMin;
    const fim = oc.inicioMin + oc.duracaoMinutos;
    const conflita = agenda.some(
      (a) => a.data.getTime() === oc.data.getTime() && colide(ini, fim, a.inicioMin, a.inicioMin + a.duracaoMinutos),
    );
    await db.bookingOffer.updateMany({
      where: { bookingId: oc.id, status: "PENDENTE" },
      data: { status: "EXPIRADA", respondidoEm: new Date() },
    });
    if (conflita) {
      await atribuirProximaDaFila(oc.id);
    } else {
      await db.booking.update({ where: { id: oc.id }, data: { professionalId, status: "AGENDADO" } });
      agenda.push({ data: oc.data, inicioMin: oc.inicioMin, duracaoMinutos: oc.duracaoMinutos });
      aceitas.push(oc.id);
    }
  }

  // Numa série só a próxima ocorrência é cobrada agora. As seguintes são cobradas pela
  // rota de cron, perto da data — ninguém paga doze faxinas de uma vez.
  const primeira = aceitas[0];
  if (primeira) {
    await criarCobrancaDoAceite(primeira).catch((err) =>
      console.error("[oferta] cobrança da série falhou", err),
    );
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
      db.booking.update({ where: { id: oferta.bookingId }, data: { professionalId } }),
      db.bookingOffer.updateMany({
        where: { bookingId: oferta.bookingId, status: "PENDENTE", id: { not: oferta.id } },
        data: { status: "EXPIRADA", respondidoEm: new Date() },
      }),
    ]);
    // O status passa a AGUARDANDO_PAGAMENTO (ou AGENDADO, se a cobrança já nascer paga)
    // dentro desta função, junto com a criação da cobrança.
    try {
      await criarCobrancaDoAceite(oferta.bookingId);
    } catch (err) {
      console.error("[oferta] aceite sem cobrança", err);
      // Desfaz o aceite: deixar a profissional achando que o serviço é dela, sem
      // cobrança para a cliente, é pior do que pedir para ela tentar de novo.
      await db.booking.update({ where: { id: oferta.bookingId }, data: { professionalId: null } });
      await db.bookingOffer.update({ where: { id: oferta.id }, data: { status: "PENDENTE", respondidoEm: null } });
      return { erro: "Não consegui gerar a cobrança deste serviço. Tente de novo em instantes." };
    }
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
