import type { Recurrence } from "@/generated/prisma/enums";

// Quantas ocorrências pré-gerar por tipo de recorrência (horizonte ~3 meses).
const OCORRENCIAS: Record<Exclude<Recurrence, "AVULSA">, number> = {
  SEMANAL: 8,
  QUINZENAL: 6,
  MENSAL: 3,
};

/** Datas (meio-dia UTC) das próximas ocorrências a partir de `inicio`. */
export function datasDaSerie(recorrencia: Exclude<Recurrence, "AVULSA">, inicio: Date): Date[] {
  const total = OCORRENCIAS[recorrencia];
  const datas: Date[] = [];
  for (let i = 0; i < total; i++) {
    const d = new Date(inicio);
    if (recorrencia === "SEMANAL") d.setUTCDate(d.getUTCDate() + i * 7);
    else if (recorrencia === "QUINZENAL") d.setUTCDate(d.getUTCDate() + i * 14);
    else d.setUTCMonth(d.getUTCMonth() + i);
    d.setUTCHours(12, 0, 0, 0);
    datas.push(d);
  }
  return datas;
}
