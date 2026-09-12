import "server-only";
import { db } from "@/lib/db";
import { calcularPontuacao, faixaDe, type MetricasProfissional, type Pontuacao } from "./pontuacao";
import type { ProfessionalStatus } from "@/generated/prisma/enums";

export * from "./pontuacao";

export type LinhaRanking = {
  id: string;
  nome: string;
  email: string;
  status: ProfessionalStatus;
  metricas: MetricasProfissional;
  pontuacao: Pontuacao;
  faixa: ReturnType<typeof faixaDe>;
};

/**
 * Ranking de todas as profissionais cadastradas, da maior para a menor pontuação.
 * A pontuação é calculada na leitura — não há coluna para ficar desatualizada.
 */
export async function rankingProfissionais(): Promise<LinhaRanking[]> {
  const profissionais = await db.professionalProfile.findMany({
    select: {
      id: true,
      userId: true,
      status: true,
      user: { select: { name: true, email: true } },
      reviews: { select: { nota: true } },
      bookings: { select: { status: true, canceladoPor: true } },
      ofertas: { select: { status: true } },
    },
  });

  return profissionais
    .map((p) => {
      const metricas: MetricasProfissional = {
        totalAvaliacoes: p.reviews.length,
        mediaNota: p.reviews.length
          ? p.reviews.reduce((soma, r) => soma + r.nota, 0) / p.reviews.length
          : null,
        servicosConcluidos: p.bookings.filter((b) => b.status === "CONCLUIDO").length,
        ofertasRespondidas: p.ofertas.filter((o) => o.status === "ACEITA" || o.status === "RECUSADA")
          .length,
        ofertasAceitas: p.ofertas.filter((o) => o.status === "ACEITA").length,
        cancelamentosProprios: p.bookings.filter(
          (b) => b.status === "CANCELADO" && b.canceladoPor === p.userId,
        ).length,
      };
      const pontuacao = calcularPontuacao(metricas);

      return {
        id: p.id,
        nome: p.user.name ?? "Sem nome",
        email: p.user.email,
        status: p.status,
        metricas,
        pontuacao,
        faixa: faixaDe(pontuacao.total),
      };
    })
    .sort((a, b) => b.pontuacao.total - a.pontuacao.total);
}
