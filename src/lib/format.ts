// Helpers de formatação. Valores monetários são sempre Int em centavos.

export function formatBRL(centavos: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100);
}

export function reaisParaCentavos(reais: number): number {
  return Math.round(reais * 100);
}

export function formatData(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(data);
}

/** Minutos desde 00:00 -> "HH:mm". */
export function minutosParaHora(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "HH:mm" -> minutos desde 00:00. */
export function horaParaMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

export function formatCep(cep: string): string {
  const d = cep.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}
