import "server-only";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { calcularPontuacao } from "@/lib/ranking/pontuacao";

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
 * Ordem: pontuação interna (ver lib/ranking), com desempate por menos serviços na semana.
 * A profissional que a cliente pediu vai para o topo — desde que passe pelos mesmos filtros.
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
      userId: true,
      reviews: { select: { nota: true } },
      bookings: {
        select: { status: true, data: true, inicioMin: true, duracaoHoras: true, canceladoPor: true },
      },
      ofertas: { select: { status: true } },
    },
  });

  const semanaRef = inicioSemana(booking.data).getTime();

  const ranqueados = candidatos
    .filter((c) => {
      const ocupados = c.bookings.filter((b) =>
        (STATUS_OCUPADO as readonly string[]).includes(b.status),
      );
      return !ocupados.some(
        (b) =>
          b.data.getTime() === booking.data.getTime() &&
          intervalosColidem(inicio, fim, b.inicioMin, b.inicioMin + b.duracaoHoras * 60),
      );
    })
    .map((c) => {
      const pontuacao = calcularPontuacao({
        totalAvaliacoes: c.reviews.length,
        mediaNota: c.reviews.length
          ? c.reviews.reduce((soma, r) => soma + r.nota, 0) / c.reviews.length
          : null,
        servicosConcluidos: c.bookings.filter((b) => b.status === "CONCLUIDO").length,
        ofertasRespondidas: c.ofertas.filter((o) => o.status === "ACEITA" || o.status === "RECUSADA")
          .length,
        ofertasAceitas: c.ofertas.filter((o) => o.status === "ACEITA").length,
        cancelamentosProprios: c.bookings.filter(
          (b) => b.status === "CANCELADO" && b.canceladoPor === c.userId,
        ).length,
      });

      const naSemana = c.bookings.filter(
        (b) =>
          (STATUS_OCUPADO as readonly string[]).includes(b.status) &&
          inicioSemana(b.data).getTime() === semanaRef,
      ).length;

      return { id: c.id, total: pontuacao.total, naSemana };
    })
    .sort((a, b) => b.total - a.total || a.naSemana - b.naSemana);

  const fila = ranqueados.map((r) => r.id);

  // A escolha da cliente vem antes da pontuação, mas nunca dispensa os filtros acima.
  if (booking.preferidaId && fila.includes(booking.preferidaId)) {
    return [booking.preferidaId, ...fila.filter((id) => id !== booking.preferidaId)];
  }
  return fila;
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
