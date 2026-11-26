// Helpers de formatação. Valores monetários são sempre Int em centavos.

export function formatBRL(centavos: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100);
}

/** Como formatBRL, mas omite ",00" em valores redondos — para os preços de vitrine. */
export function formatBRLRedondo(centavos: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: centavos % 100 === 0 ? 0 : 2,
  }).format(centavos / 100);
}

/** Nota de avaliação com uma casa e vírgula decimal: 4,8. */
export function formatNota(nota: number): string {
  return nota.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function reaisParaCentavos(reais: number): number {
  return Math.round(reais * 100);
}

export const FUSO = "America/Sao_Paulo";

// Há dois tipos de data aqui, e confundi-los desloca o dia:
//
//   date-only  — data do serviço, nascimento, início da cobrança. Gravada ao meio-dia UTC
//                por `dataDeInput`, sem hora nenhuma. Formata em UTC, senão o dia salta.
//   instante   — criadoEm, pagoEm, ativaAte, pagamentoExpiraEm. É um momento no tempo, e o
//                banco guarda em UTC. Formata no fuso de Brasília, senão um cadastro das
//                21h de terça aparece como quarta-feira.

/** Date-only: data do serviço e afins. Ver a nota acima antes de usar num carimbo de tempo. */
export function formatData(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" }).format(data);
}

export function formatDataCurta(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(data);
}

/** Instante: só o dia, no horário de Brasília. */
export function formatDiaLocal(instante: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: FUSO }).format(instante);
}

export function formatDiaLocalCurto(instante: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: FUSO,
  }).format(instante);
}

/** Instante com hora, no horário de Brasília: "25/11/2026 às 21:06". */
export function formatInstante(instante: Date): string {
  const d = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: FUSO,
  }).format(instante);
  const h = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: FUSO,
  }).format(instante);
  return `${d} às ${h}`;
}

/** "YYYY-MM-DD" -> Date ao meio-dia UTC (evita salto de dia por fuso). */
export function dataDeInput(iso: string): Date {
  return new Date(`${iso}T12:00:00.000Z`);
}

/** Duração em minutos -> "30 min", "1 h", "4 h", "1 h 30 min". */
export function formatDuracao(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
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
