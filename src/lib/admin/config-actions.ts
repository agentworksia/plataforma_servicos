"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { reaisParaCentavos } from "@/lib/format";
import { TABELA_BASE, duracoesDisponiveis, precoDeTabela } from "@/lib/pricing/tabela";
import { pracaPorNome } from "@/lib/regioes";
import type { ServiceType } from "@/generated/prisma/enums";

export type ConfigState = { erro?: string } | undefined;

const TIPOS = Object.keys(TABELA_BASE) as ServiceType[];

const precoSchema = z.object({
  id: z.string().min(1),
  valorReais: z.coerce.number().min(0).max(100000),
  multiplicador: z.coerce.number().min(0).max(10),
  ativo: z.coerce.boolean().default(false),
});

export async function atualizarPreco(_prev: ConfigState, formData: FormData): Promise<ConfigState> {
  await requireRole("ADMIN");
  const parsed = precoSchema.safeParse({
    id: formData.get("id"),
    valorReais: formData.get("valorReais"),
    multiplicador: formData.get("multiplicador"),
    ativo: formData.get("ativo") === "on",
  });
  if (!parsed.success) return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  await db.pricingRule.update({
    where: { id: parsed.data.id },
    data: {
      valorBase: reaisParaCentavos(parsed.data.valorReais),
      multiplicador: parsed.data.multiplicador,
      ativo: parsed.data.ativo,
    },
  });
  revalidatePath("/admin/precos");
  return undefined;
}

export async function alternarRegiao(_prev: ConfigState, formData: FormData): Promise<ConfigState> {
  await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return { erro: "Registro inválido." };
  const area = await db.serviceArea.findUnique({ where: { id }, select: { ativo: true } });
  if (!area) return { erro: "Região não encontrada." };
  await db.serviceArea.update({ where: { id }, data: { ativo: !area.ativo } });
  revalidatePath("/admin/regioes");
  return undefined;
}

const novaRegiaoSchema = z.object({
  cidade: z.string().trim().min(2, "Informe a cidade").max(120),
  bairro: z.string().trim().max(120).optional(),
  uf: z.string().trim().length(2).toUpperCase().default("PR"),
});

export async function criarRegiao(_prev: ConfigState, formData: FormData): Promise<ConfigState> {
  await requireRole("ADMIN");
  const parsed = novaRegiaoSchema.safeParse({
    cidade: formData.get("cidade"),
    bairro: formData.get("bairro") || undefined,
    uf: formData.get("uf") || "PR",
  });
  if (!parsed.success) return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const existente = await db.serviceArea.findFirst({
    where: { cidade: parsed.data.cidade, bairro: parsed.data.bairro ?? null },
  });
  if (existente) return { erro: "Essa região já existe." };

  const area = await db.serviceArea.create({
    data: { cidade: parsed.data.cidade, bairro: parsed.data.bairro ?? null, uf: parsed.data.uf, ativo: true },
  });
  // A região nova nasce com a tabela-base da praça, já calculada em valorBase e com
  // multiplicador 1 — o que o admin editar na tela de preços é o que o cliente vê.
  const multiplicadorPraca = pracaPorNome(parsed.data.cidade)?.multiplicadorRegiao ?? 1;
  await db.pricingRule.createMany({
    data: TIPOS.flatMap((tipo) =>
      duracoesDisponiveis(tipo).map((duracaoMinutos) => ({
        tipoServico: tipo,
        duracaoMinutos,
        serviceAreaId: area.id,
        valorBase: precoDeTabela(tipo, duracaoMinutos, multiplicadorPraca)!,
        multiplicador: 1,
      })),
    ),
  });
  revalidatePath("/admin/regioes");
  revalidatePath("/admin/precos");
  return undefined;
}

export async function removerRegiao(_prev: ConfigState, formData: FormData): Promise<ConfigState> {
  await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return { erro: "Registro inválido." };
  const emUso = await db.professionalServiceArea.count({ where: { serviceAreaId: id } });
  if (emUso > 0) return { erro: "Há profissionais vinculados a essa região. Desative-a em vez de remover." };
  await db.serviceArea.delete({ where: { id } });
  revalidatePath("/admin/regioes");
  return undefined;
}
