import "server-only";
import { db } from "@/lib/db";
import { LABEL_SERVICO } from "@/lib/bookings/display";

import { PERIODOS, type Dimensao, type Periodo } from "./painel-opcoes";

export * from "./painel-opcoes";

export type LinhaDimensao = {
  rotulo: string;
  servicos: number;
  faturamento: number;
  repasse: number;
  taxa: number;
  ticket: number;
};

export type Painel = {
  /** Dinheiro que entrou: pagamentos confirmados no período. */
  entrada: number;
  /** Dinheiro que saiu: repasses efetivamente pagos às profissionais. */
  saida: number;
  /** Já é da profissional, mas ainda não foi pago. */
  aRepassar: number;
  /** O que fica com a plataforma, sobre serviços concluídos. */
  margem: number;
  faturamentoContratado: number;
  servicosConcluidos: number;
  ticketMedio: number;
  aguardandoProfissional: number;
  cancelados: number;
  taxaCancelamento: number;
  notaMedia: number | null;
  totalAvaliacoes: number;
  linhas: LinhaDimensao[];
};

const mesesPt = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function rotuloDe(
  dimensao: Dimensao,
  b: { tipoServico: string; data: Date; address: { cidade: string; uf: string }; professional: { user: { name: string | null } } | null },
): string {
  switch (dimensao) {
    case "servico":
      return LABEL_SERVICO[b.tipoServico] ?? b.tipoServico;
    case "cidade":
      return `${b.address.cidade}/${b.address.uf}`;
    case "profissional":
      return b.professional?.user.name ?? "Ainda sem profissional";
    case "mes":
      return `${mesesPt[b.data.getUTCMonth()]}/${String(b.data.getUTCFullYear()).slice(2)}`;
  }
}

export async function montarPainel(dimensao: Dimensao, periodo: Periodo): Promise<Painel> {
  const dias = PERIODOS.find((p) => p.value === periodo)?.dias ?? null;
  const desde = dias ? new Date(Date.now() - dias * 86_400_000) : null;
  const janela = desde ? { gte: desde } : undefined;

  const [bookings, pagamentos, payouts, avaliacoes] = await Promise.all([
    db.booking.findMany({
      where: janela ? { data: janela } : undefined,
      select: {
        status: true,
        data: true,
        tipoServico: true,
        valorTotal: true,
        taxaPlataforma: true,
        repasseProfissional: true,
        address: { select: { cidade: true, uf: true } },
        professional: { select: { user: { select: { name: true } } } },
      },
    }),
    db.payment.findMany({
      where: { status: { in: ["PAGO_RETIDO", "LIBERADO"] }, ...(janela ? { criadoEm: janela } : {}) },
      select: { valor: true, valorReembolsado: true },
    }),
    db.payout.findMany({
      where: janela ? { criadoEm: janela } : undefined,
      select: { valor: true, status: true },
    }),
    db.review.findMany({
      where: janela ? { criadoEm: janela } : undefined,
      select: { nota: true },
    }),
  ]);

  const entrada = pagamentos.reduce((s, p) => s + p.valor - p.valorReembolsado, 0);
  const saida = payouts.filter((p) => p.status === "PAGO").reduce((s, p) => s + p.valor, 0);
  const aRepassar = payouts
    .filter((p) => p.status === "PENDENTE" || p.status === "LIBERADO")
    .reduce((s, p) => s + p.valor, 0);

  const validos = bookings.filter((b) => b.status !== "CANCELADO");
  const concluidos = bookings.filter((b) => b.status === "CONCLUIDO");
  const cancelados = bookings.length - validos.length;

  const faturamentoContratado = validos.reduce((s, b) => s + b.valorTotal, 0);
  const margem = concluidos.reduce((s, b) => s + b.taxaPlataforma, 0);

  const grupos = new Map<string, LinhaDimensao>();
  for (const b of validos) {
    const rotulo = rotuloDe(dimensao, b);
    const atual = grupos.get(rotulo) ?? { rotulo, servicos: 0, faturamento: 0, repasse: 0, taxa: 0, ticket: 0 };
    atual.servicos += 1;
    atual.faturamento += b.valorTotal;
    atual.repasse += b.repasseProfissional;
    atual.taxa += b.taxaPlataforma;
    grupos.set(rotulo, atual);
  }

  const linhas = [...grupos.values()].map((l) => ({
    ...l,
    ticket: l.servicos ? Math.round(l.faturamento / l.servicos) : 0,
  }));
  // Mês é uma sequência: ordenar por valor embaralharia a linha do tempo.
  linhas.sort((a, b) => (dimensao === "mes" ? 0 : b.faturamento - a.faturamento));

  return {
    entrada,
    saida,
    aRepassar,
    margem,
    faturamentoContratado,
    servicosConcluidos: concluidos.length,
    ticketMedio: validos.length ? Math.round(faturamentoContratado / validos.length) : 0,
    aguardandoProfissional: bookings.filter((b) => b.status === "AGUARDANDO_PROFISSIONAL").length,
    cancelados,
    taxaCancelamento: bookings.length ? (cancelados / bookings.length) * 100 : 0,
    notaMedia: avaliacoes.length ? avaliacoes.reduce((s, a) => s + a.nota, 0) / avaliacoes.length : null,
    totalAvaliacoes: avaliacoes.length,
    linhas,
  };
}
