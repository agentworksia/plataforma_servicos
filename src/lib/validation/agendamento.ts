import { z } from "zod";

const digitos = (v: string) => v.replace(/\D/g, "");

export const DURACOES_VALIDAS = [4, 6, 8] as const;

export const RECORRENCIAS = [
  { value: "AVULSA", label: "Avulsa (uma vez)" },
  { value: "SEMANAL", label: "Semanal" },
  { value: "QUINZENAL", label: "Quinzenal" },
  { value: "MENSAL", label: "Mensal" },
] as const;

export const agendamentoSchema = z
  .object({
    tipoServico: z.enum(["DIARIA_PADRAO", "PASSADORIA", "POS_OBRA", "CORPORATIVA"]),

    enderecoId: z.string().trim().optional(),
    cep: z.string().trim().transform(digitos).optional(),
    logradouro: z.string().trim().max(200).optional(),
    numero: z.string().trim().max(20).optional(),
    complemento: z.string().trim().max(120).optional(),
    bairro: z.string().trim().max(120).optional(),
    cidade: z.string().trim().max(120).optional(),
    referencia: z.string().trim().max(200).optional(),

    metragem: z.coerce.number().int().positive().max(100000).optional(),
    numeroComodos: z.coerce.number().int().positive().max(200).optional(),

    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
    inicio: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido"),
    duracaoHoras: z.coerce.number().refine((v) => (DURACOES_VALIDAS as readonly number[]).includes(v), "Duração inválida"),
    recorrencia: z.enum(["AVULSA", "SEMANAL", "QUINZENAL", "MENSAL"]),
    metodoPagamento: z.enum(["PIX", "CARTAO"]),
    observacoes: z.string().trim().max(500).optional(),
  })
  .refine(
    (d) =>
      (d.enderecoId && d.enderecoId !== "novo") ||
      (d.cep?.length === 8 && d.logradouro && d.numero && d.bairro && d.cidade),
    { error: "Preencha o endereço completo (CEP, rua, número, bairro e cidade).", path: ["cidade"] },
  )
  .refine((d) => new Date(`${d.data}T12:00:00Z`).getTime() > Date.now() + 12 * 3600_000, {
    error: "Escolha uma data a partir de amanhã.",
    path: ["data"],
  });

export type AgendamentoInput = z.infer<typeof agendamentoSchema>;
