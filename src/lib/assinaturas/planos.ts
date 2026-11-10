// Planos da mensalidade da profissional. Sem "server-only": a tela de escolha do plano
// é componente de cliente e lê os valores daqui.

import type { PlanoAssinatura } from "@/generated/prisma/enums";

export type Plano = {
  id: PlanoAssinatura;
  nome: string;
  /** Centavos por cobrança mensal. */
  valorCentavos: number;
  /** Quantas cobranças mensais. `null` = enquanto não cancelar. */
  parcelas: number | null;
  resumo: string;
  detalhe: string;
};

export const PLANOS: Record<PlanoAssinatura, Plano> = {
  MENSAL: {
    id: "MENSAL",
    nome: "Mensal",
    valorCentavos: 1990,
    parcelas: null,
    resumo: "R$ 19,90 por mês, cancela quando quiser",
    detalhe: "Cobrado todo mês até você cancelar. Sem fidelidade.",
  },
  ANUAL: {
    id: "ANUAL",
    nome: "Anual",
    valorCentavos: 1490,
    parcelas: 12,
    resumo: "R$ 14,90 por mês, em 12 vezes",
    detalhe: "Doze cobranças mensais de R$ 14,90, no cartão ou no Pix. Compromisso de um ano.",
  },
};

export const LISTA_PLANOS: Plano[] = [PLANOS.MENSAL, PLANOS.ANUAL];

/** Quanto o plano anual economiza em um ano, em centavos. */
export function economiaAnualCentavos(): number {
  return (PLANOS.MENSAL.valorCentavos - PLANOS.ANUAL.valorCentavos) * 12;
}

/** Percentual de desconto do anual sobre o mensal, arredondado. */
export function descontoAnualPct(): number {
  const { MENSAL, ANUAL } = PLANOS;
  return Math.round((1 - ANUAL.valorCentavos / MENSAL.valorCentavos) * 100);
}
