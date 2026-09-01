"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";

export type AcaoState = { erro?: string } | undefined;

async function mudarStatus(
  profileId: string,
  data: { status: "APROVADA" | "REPROVADA" | "SUSPENSA"; motivoReprovacao?: string | null },
) {
  const admin = await requireRole("ADMIN");
  await db.professionalProfile.update({
    where: { id: profileId },
    data: {
      status: data.status,
      motivoReprovacao: data.motivoReprovacao ?? null,
      aprovadoEm: data.status === "APROVADA" ? new Date() : null,
      aprovadoPor: data.status === "APROVADA" ? admin.id : null,
    },
  });
  revalidatePath("/admin/profissionais");
  revalidatePath(`/admin/profissionais/${profileId}`);
  revalidatePath("/admin");
}

export async function aprovarProfissional(_prev: AcaoState, formData: FormData): Promise<AcaoState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { erro: "Registro inválido." };
  await mudarStatus(id, { status: "APROVADA" });
}

export async function reprovarProfissional(_prev: AcaoState, formData: FormData): Promise<AcaoState> {
  const id = String(formData.get("id") ?? "");
  const motivo = z.string().trim().min(5, "Explique o motivo (mín. 5 caracteres).").max(500);
  const parsed = motivo.safeParse(formData.get("motivo"));
  if (!id) return { erro: "Registro inválido." };
  if (!parsed.success) return { erro: parsed.error.issues[0]?.message ?? "Motivo inválido." };
  await mudarStatus(id, { status: "REPROVADA", motivoReprovacao: parsed.data });
}

export async function suspenderProfissional(_prev: AcaoState, formData: FormData): Promise<AcaoState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { erro: "Registro inválido." };
  await mudarStatus(id, { status: "SUSPENSA" });
}

export async function reativarProfissional(_prev: AcaoState, formData: FormData): Promise<AcaoState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { erro: "Registro inválido." };
  await mudarStatus(id, { status: "APROVADA" });
}
