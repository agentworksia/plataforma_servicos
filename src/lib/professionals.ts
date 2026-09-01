import type { ProfessionalStatus } from "@/generated/prisma/enums";

export const STATUS_PROFISSIONAL: Record<
  ProfessionalStatus,
  { label: string; cor: "amarelo" | "verde" | "vermelho" }
> = {
  PENDENTE: { label: "Em análise", cor: "amarelo" },
  APROVADA: { label: "Aprovada", cor: "verde" },
  REPROVADA: { label: "Reprovada", cor: "vermelho" },
  SUSPENSA: { label: "Suspensa", cor: "vermelho" },
};

export const ORDEM_STATUS: ProfessionalStatus[] = ["PENDENTE", "APROVADA", "SUSPENSA", "REPROVADA"];
