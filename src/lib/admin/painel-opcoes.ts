// Opções do painel de dashboards. Separado de painel.ts de propósito: aquele é
// "server-only" por causa do banco, e o seletor é componente de cliente.

export const DIMENSOES = [
  { value: "servico", label: "Tipo de serviço" },
  { value: "cidade", label: "Cidade" },
  { value: "profissional", label: "Profissional" },
  { value: "mes", label: "Mês" },
] as const;
export type Dimensao = (typeof DIMENSOES)[number]["value"];

export const PERIODOS = [
  { value: "30d", label: "30 dias", dias: 30 },
  { value: "90d", label: "90 dias", dias: 90 },
  { value: "12m", label: "12 meses", dias: 365 },
  { value: "tudo", label: "Tudo", dias: null },
] as const;
export type Periodo = (typeof PERIODOS)[number]["value"];

export function ehDimensao(v: string | undefined): v is Dimensao {
  return DIMENSOES.some((d) => d.value === v);
}
export function ehPeriodo(v: string | undefined): v is Periodo {
  return PERIODOS.some((p) => p.value === v);
}
