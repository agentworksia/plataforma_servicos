import type { BookingStatus, PaymentStatus, PayoutStatus } from "@/generated/prisma/enums";

export const STATUS_BOOKING: Record<BookingStatus, { label: string; cor: "amarelo" | "verde" | "vermelho" | "neutro" }> = {
  AGUARDANDO_PROFISSIONAL: { label: "Aguardando profissional", cor: "amarelo" },
  AGENDADO: { label: "Agendado", cor: "verde" },
  EM_ANDAMENTO: { label: "Em andamento", cor: "verde" },
  CONCLUIDO: { label: "Concluído", cor: "neutro" },
  CANCELADO: { label: "Cancelado", cor: "vermelho" },
};

export const STATUS_PAGAMENTO: Record<PaymentStatus, string> = {
  PENDENTE: "Pendente",
  PAGO_RETIDO: "Pago (retido)",
  LIBERADO: "Liberado",
  REEMBOLSADO: "Reembolsado",
  PARCIALMENTE_REEMBOLSADO: "Reembolso parcial",
  FALHOU: "Falhou",
};

export const STATUS_PAYOUT: Record<PayoutStatus, string> = {
  PENDENTE: "Pendente",
  LIBERADO: "Liberado",
  PAGO: "Pago",
  CANCELADO: "Cancelado",
};

export const LABEL_SERVICO: Record<string, string> = {
  DIARIA_PADRAO: "Diária de limpeza padrão",
  PASSADORIA: "Passadoria",
  POS_OBRA: "Limpeza pós-obra",
  CORPORATIVA: "Corporativa / governamental",
};
