import "server-only";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";

const STATUS_OCUPADO = ["AGENDADO", "EM_ANDAMENTO", "CONCLUIDO"] as const;

function intervalosColidem(aInicio: number, aFim: number, bInicio: number, bFim: number) {
  return aInicio < bFim && bInicio < aFim;
}

function inicioSemana(ref: Date): Date {
  const d = new Date(ref);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d;
}

/**
 * Fila de profissionais elegíveis para uma diária, em ordem de prioridade.
 * Elegibilidade: APROVADA · atende o tipo · cobre a cidade · disponível na agenda naquele
 * dia/horário · sem bloqueio · sem serviço conflitante · ainda não ofertado/recusado.
 * Ordem: melhor média de avaliação; desempate por menos serviços na semana e maior taxa de aceite.
 */
export async function montarFilaDeOfertas(bookingId: string): Promise<string[]> {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { address: true, offers: { select: { professionalId: true } } },
  });
  if (!booking) throw new Error("Agendamento não encontrado.");

  const inicio = booking.inicioMin;
  const fim = booking.inicioMin + booking.duracaoHoras * 60;
  const diaSemana = booking.data.getUTCDay();
  const jaOfertados = booking.offers.map((o) => o.professionalId);

  const candidatos = await db.professionalProfile.findMany({
    where: {
      status: "APROVADA",
      id: { notIn: jaOfertados.length ? jaOfertados : ["__none__"] },
      tiposServico: { has: booking.tipoServico },
      areas: {
        some: {
          serviceArea: { ativo: true, cidade: { equals: booking.address.cidade, mode: "insensitive" } },
        },
      },
      disponibilidade: { some: { diaSemana, inicioMin: { lte: inicio }, fimMin: { gte: fim } } },
      excecoes: { none: { data: booking.data, tipo: "BLOQUEIO" } },
    },
    select: {
      id: true,
      reviews: { select: { nota: true } },
      bookings: {
        where: { status: { in: [...STATUS_OCUPADO] } },
        select: { data: true, inicioMin: true, duracaoHoras: true },
      },
      ofertas: { select: { status: true } },
    },
  });

  const semanaRef = inicioSemana(booking.data).getTime();

  const ranqueados = candidatos
    .filter((c) => {
      // conflito de horário no mesmo dia
      return !c.bookings.some(
        (b) =>
          b.data.getTime() === booking.data.getTime() &&
          intervalosColidem(inicio, fim, b.inicioMin, b.inicioMin + b.duracaoHoras * 60),
      );
    })
    .map((c) => {
      const media = c.reviews.length
        ? c.reviews.reduce((s, r) => s + r.nota, 0) / c.reviews.length
        : 4; // sem avaliações: nota neutra para dar chance a quem está começando
      const naSemana = c.bookings.filter((b) => inicioSemana(b.data).getTime() === semanaRef).length;
      const respondidas = c.ofertas.filter((o) => o.status === "ACEITA" || o.status === "RECUSADA").length;
      const aceitas = c.ofertas.filter((o) => o.status === "ACEITA").length;
      const taxaAceite = respondidas ? aceitas / respondidas : 1;
      return { id: c.id, media, naSemana, taxaAceite };
    })
    .sort(
      (a, b) =>
        b.media - a.media ||
        a.naSemana - b.naSemana ||
        b.taxaAceite - a.taxaAceite,
    );

  return ranqueados.map((r) => r.id);
}

export type ResultadoAtribuicao =
  | { status: "OFERTA_ENVIADA"; professionalId: string; offerId: string }
  | { status: "AGUARDANDO_PROFISSIONAL" };

/** Cria uma oferta PENDENTE para o próximo da fila. Se a fila estiver vazia, mantém aguardando. */
export async function atribuirProximaDaFila(bookingId: string): Promise<ResultadoAtribuicao> {
  const fila = await montarFilaDeOfertas(bookingId);
  if (fila.length === 0) return { status: "AGUARDANDO_PROFISSIONAL" };

  const professionalId = fila[0];
  const prazoMin = Number(await getSetting("PRAZO_OFERTA_MINUTOS", "60"));
  const ordemFila = await db.bookingOffer.count({ where: { bookingId } });

  const offer = await db.bookingOffer.create({
    data: {
      bookingId,
      professionalId,
      status: "PENDENTE",
      ordemFila,
      expiraEm: new Date(Date.now() + prazoMin * 60_000),
    },
  });
  return { status: "OFERTA_ENVIADA", professionalId, offerId: offer.id };
}
