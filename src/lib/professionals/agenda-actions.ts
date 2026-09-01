"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { horaParaMinutos } from "@/lib/format";

export type AgendaState = { erro?: string } | undefined;

async function perfilId(): Promise<string> {
  const user = await requireRole("PROFISSIONAL");
  const p = await db.professionalProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!p) throw new Error("Perfil de profissional não encontrado.");
  return p.id;
}

const janelaSchema = z
  .object({
    diaSemana: z.coerce.number().int().min(0).max(6),
    inicio: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido"),
    fim: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido"),
  })
  .refine((d) => horaParaMinutos(d.fim) > horaParaMinutos(d.inicio), {
    error: "O fim precisa ser depois do início",
    path: ["fim"],
  });

export async function adicionarDisponibilidade(_prev: AgendaState, formData: FormData): Promise<AgendaState> {
  const parsed = janelaSchema.safeParse({
    diaSemana: formData.get("diaSemana"),
    inicio: formData.get("inicio"),
    fim: formData.get("fim"),
  });
  if (!parsed.success) return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const professionalId = await perfilId();
  await db.availability.create({
    data: {
      professionalId,
      diaSemana: parsed.data.diaSemana,
      inicioMin: horaParaMinutos(parsed.data.inicio),
      fimMin: horaParaMinutos(parsed.data.fim),
    },
  });
  revalidatePath("/profissional/agenda");
}

export async function removerDisponibilidade(_prev: AgendaState, formData: FormData): Promise<AgendaState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { erro: "Registro inválido." };
  const professionalId = await perfilId();
  await db.availability.deleteMany({ where: { id, professionalId } });
  revalidatePath("/profissional/agenda");
  return undefined;
}

const bloqueioSchema = z
  .object({
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
    diaInteiro: z.coerce.boolean().default(false),
    inicio: z.string().optional(),
    fim: z.string().optional(),
    motivo: z.string().trim().max(200).optional(),
  })
  .refine(
    (d) => d.diaInteiro || (/^\d{2}:\d{2}$/.test(d.inicio ?? "") && /^\d{2}:\d{2}$/.test(d.fim ?? "")),
    { error: "Informe início e fim, ou marque o dia inteiro", path: ["inicio"] },
  );

export async function adicionarBloqueio(_prev: AgendaState, formData: FormData): Promise<AgendaState> {
  const parsed = bloqueioSchema.safeParse({
    data: formData.get("data"),
    diaInteiro: formData.get("diaInteiro") === "on",
    inicio: formData.get("inicio") || undefined,
    fim: formData.get("fim") || undefined,
    motivo: formData.get("motivo") || undefined,
  });
  if (!parsed.success) return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const professionalId = await perfilId();
  await db.availabilityException.create({
    data: {
      professionalId,
      data: new Date(parsed.data.data),
      tipo: "BLOQUEIO",
      inicioMin: parsed.data.diaInteiro ? null : horaParaMinutos(parsed.data.inicio!),
      fimMin: parsed.data.diaInteiro ? null : horaParaMinutos(parsed.data.fim!),
      motivo: parsed.data.motivo ?? null,
    },
  });
  revalidatePath("/profissional/agenda");
}

export async function removerBloqueio(_prev: AgendaState, formData: FormData): Promise<AgendaState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { erro: "Registro inválido." };
  const professionalId = await perfilId();
  await db.availabilityException.deleteMany({ where: { id, professionalId } });
  revalidatePath("/profissional/agenda");
  return undefined;
}
