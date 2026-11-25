// Planos da mensalidade da profissional. Sem "server-only": a tela de escolha do plano
// é componente de cliente e lê os valores daqui.

import type { PaymentMethod, PlanoAssinatura } from "@/generated/prisma/enums";

export type Plano = {
  id: PlanoAssinatura;
  nome: string;
  /** Centavos por cobrança mensal. */
  valorCentavos: number;
  /** Quantas cobranças mensais. `null` = enquanto não cancelar. */
  parcelas: number | null;
  /** Formas de pagamento aceitas neste plano. */
  metodos: readonly PaymentMethod[];
  resumo: string;
  detalhe: string;
};

export const PLANOS: Record<PlanoAssinatura, Plano> = {
  MENSAL: {
    id: "MENSAL",
    nome: "Mensal",
    valorCentavos: 1799,
    parcelas: null,
    metodos: ["PIX", "CARTAO"],
    resumo: "R$ 17,99 por mês, cancela quando quiser",
    detalhe: "Cobrado todo mês até você cancelar. Sem fidelidade.",
  },
  ANUAL: {
    id: "ANUAL",
    // Parcelamento de verdade é coisa de cartão: no Pix as 12 vezes seriam 12 cobranças
    // avulsas, e deixar de pagar a 7ª derruba o acesso no meio do compromisso de um ano.
    nome: "Anual",
    valorCentavos: 1499,
    parcelas: 12,
    metodos: ["CARTAO"],
    resumo: "R$ 14,99 por mês, em 12 vezes no cartão",
    detalhe: "Doze parcelas de R$ 14,99 no cartão de crédito. Compromisso de um ano.",
  },
};

export const LISTA_PLANOS: Plano[] = [PLANOS.MENSAL, PLANOS.ANUAL];

export function metodoAceito(plano: PlanoAssinatura, metodo: PaymentMethod): boolean {
  return PLANOS[plano].metodos.includes(metodo);
}

/** Quanto o plano anual economiza em um ano, em centavos. */
export function economiaAnualCentavos(): number {
  return (PLANOS.MENSAL.valorCentavos - PLANOS.ANUAL.valorCentavos) * 12;
}

/** Percentual de desconto do anual sobre o mensal, arredondado. */
export function descontoAnualPct(): number {
  const { MENSAL, ANUAL } = PLANOS;
  return Math.round((1 - ANUAL.valorCentavos / MENSAL.valorCentavos) * 100);
}
