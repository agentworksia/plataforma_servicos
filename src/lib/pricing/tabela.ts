// Tabela-base de preços. Fonte única: consumida pelo seed (para popular PricingRule) e
// pelas telas públicas de preço. Sem "server-only" de propósito — o seletor de preço da
// capa e o resumo do agendamento são componentes de cliente.

import type { ServiceType } from "@/generated/prisma/enums";

/**
 * Durações vendidas, em minutos. Minutos e não horas porque o dog walker vende
 * meia hora — e porque a agenda já trabalha em minutos desde 00:00.
 */
export const DURACOES = [30, 60, 240, 360, 480] as const;
export type Duracao = (typeof DURACOES)[number];

/**
 * Preço em centavos por tipo e duração, na praça-base (Curitiba e RMC).
 * Duração ausente = não vendida naquele serviço; no pós-obra isso significa orçamento.
 */
export const TABELA_BASE: Record<ServiceType, Partial<Record<Duracao, number>>> = {
  DIARIA_PADRAO: { 240: 16_000, 360: 22_000, 480: 30_000 },
  PASSADORIA: { 240: 16_000, 360: 22_000, 480: 30_000 },
  // Pós-obra é mais pesado e exige EPI e produto específico. Acima de 6 h a obra
  // costuma pedir equipe, então sai da tabela e vira orçamento.
  POS_OBRA: { 240: 28_000, 360: 35_000 },
  CORPORATIVA: { 240: 19_000, 360: 26_500, 480: 36_000 },
  DOG_WALKER: { 30: 4_500, 60: 6_000 },
};

/**
 * Serviços que custam mais no sábado e no domingo, e o quanto sobe.
 * Só o passeio tem: é quando a maior parte dos pedidos cai, e é o dia em que a
 * profissional abre mão do descanso.
 */
export const ACRESCIMO_FIM_DE_SEMANA: Partial<Record<ServiceType, number>> = {
  DOG_WALKER: 0.3,
};

/** Preço de praça cai em múltiplo de R$ 5 — tabela com centavos quebrados passa desleixo. */
function arredondaParaCinco(centavos: number): number {
  return Math.round(centavos / 500) * 500;
}

/** "YYYY-MM-DD" → sábado ou domingo. Meio-dia UTC para o fuso não trocar o dia. */
export function ehFimDeSemana(dataIso: string): boolean {
  const dia = new Date(`${dataIso}T12:00:00.000Z`).getUTCDay();
  return dia === 0 || dia === 6;
}

/** Fator aplicado ao preço do dia escolhido: 1,3 no fim de semana para quem tem acréscimo. */
export function fatorDoDia(tipo: ServiceType, dataIso?: string): number {
  const acrescimo = ACRESCIMO_FIM_DE_SEMANA[tipo];
  if (!acrescimo || !dataIso || !ehFimDeSemana(dataIso)) return 1;
  return 1 + acrescimo;
}

export function duracoesDisponiveis(tipo: ServiceType): Duracao[] {
  return DURACOES.filter((d) => TABELA_BASE[tipo][d] !== undefined);
}

export function precoDeTabela(
  tipo: ServiceType,
  duracao: Duracao,
  multiplicadorRegiao = 1,
  dataIso?: string,
): number | null {
  const base = TABELA_BASE[tipo][duracao];
  if (base === undefined) return null;
  // O arredondamento é do preço de praça. O acréscimo de fim de semana entra depois e
  // exato: 30% de R$ 45 são R$ 58,50, e arredondar isso apagaria a regra.
  return Math.round(arredondaParaCinco(base * multiplicadorRegiao) * fatorDoDia(tipo, dataIso));
}

/** Menor preço publicado do tipo, para as vitrines de "a partir de". */
export function precoMinimo(tipo: ServiceType, multiplicadorRegiao = 1): number {
  const menor = duracoesDisponiveis(tipo)[0];
  return precoDeTabela(tipo, menor, multiplicadorRegiao)!;
}
