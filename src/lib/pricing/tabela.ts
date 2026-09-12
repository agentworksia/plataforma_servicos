// Tabela-base de preços de Curitiba e Região Metropolitana.
// Fonte única: consumida pelo seed (para popular PricingRule) e pelas telas públicas de preço.
// Sem "server-only" de propósito — o seletor de preço da capa é um componente de cliente.

import type { ServiceType } from "@/generated/prisma/enums";

export const DURACOES = [4, 6, 8] as const;
export type Duracao = (typeof DURACOES)[number];

/** Diária padrão em Curitiba e RMC, em centavos. */
export const PRECO_BASE_CENTAVOS: Record<Duracao, number> = {
  4: 16_000,
  6: 22_000,
  8: 30_000,
};

/** Cada tipo de serviço é um múltiplo da diária padrão de mesma duração. */
export const MULTIPLICADOR_POR_TIPO: Record<ServiceType, number> = {
  DIARIA_PADRAO: 1,
  PASSADORIA: 1,
  POS_OBRA: 1.5,
  CORPORATIVA: 1.2,
};

export function precoDeTabela(tipo: ServiceType, duracao: Duracao): number {
  return Math.round(PRECO_BASE_CENTAVOS[duracao] * MULTIPLICADOR_POR_TIPO[tipo]);
}
