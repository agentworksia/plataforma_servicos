// Tabela-base de preços. Fonte única: consumida pelo seed (para popular PricingRule) e
// pelas telas públicas de preço. Sem "server-only" de propósito — o seletor de preço da
// capa e o resumo do agendamento são componentes de cliente.

import type { ServiceType } from "@/generated/prisma/enums";

export const DURACOES = [4, 6, 8] as const;
export type Duracao = (typeof DURACOES)[number];

/**
 * Preço em centavos por tipo e duração, na praça-base (Curitiba e RMC).
 * `null` = não vendido naquela duração — o serviço passa por orçamento.
 */
export const TABELA_BASE: Record<ServiceType, Record<Duracao, number | null>> = {
  DIARIA_PADRAO: { 4: 16_000, 6: 22_000, 8: 30_000 },
  PASSADORIA: { 4: 16_000, 6: 22_000, 8: 30_000 },
  // Pós-obra é mais pesado e exige EPI e produto específico. Acima de 6 h a obra
  // costuma pedir equipe, então sai da tabela e vira orçamento.
  POS_OBRA: { 4: 28_000, 6: 35_000, 8: null },
  CORPORATIVA: { 4: 19_000, 6: 26_500, 8: 36_000 },
};

/** Preço de praça cai em múltiplo de R$ 5 — tabela com centavos quebrados passa desleixo. */
function arredondaParaCinco(centavos: number): number {
  return Math.round(centavos / 500) * 500;
}

export function duracoesDisponiveis(tipo: ServiceType): Duracao[] {
  return DURACOES.filter((d) => TABELA_BASE[tipo][d] !== null);
}

export function precoDeTabela(
  tipo: ServiceType,
  duracao: Duracao,
  multiplicadorRegiao = 1,
): number | null {
  const base = TABELA_BASE[tipo][duracao];
  if (base === null) return null;
  return arredondaParaCinco(base * multiplicadorRegiao);
}

/** Menor preço publicado do tipo, para as vitrines de "a partir de". */
export function precoMinimo(tipo: ServiceType, multiplicadorRegiao = 1): number {
  const menor = duracoesDisponiveis(tipo)[0];
  return precoDeTabela(tipo, menor, multiplicadorRegiao)!;
}
