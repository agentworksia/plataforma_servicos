"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { env } from "@/lib/env";

export type AcaoState = { erro?: string } | undefined;

async function notificarAprovacao(profileId: string) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return; // e-mail não configurado — silencioso no MVP
  const perfil = await db.professionalProfile.findUnique({
    where: { id: profileId },
    select: { user: { select: { name: true, email: true } } },
  });
  if (!perfil?.user.email) return;
  try {
    const { enviarEmail } = await import("@/lib/email");
    await enviarEmail({
      para: perfil.user.email,
      assunto: "Sua conta foi aprovada",
      html: `<p>Olá, ${perfil.user.name ?? ""}!</p><p>Seu cadastro foi aprovado. Você já pode receber ofertas de serviço.</p>`,
    });
  } catch (err) {
    console.error("[aprovação] e-mail falhou", err);
  }
}

async function mudarStatus(
  profileId: string,
  data: { status: "APROVADA" | "REPROVADA" | "SUSPENSA"; motivoReprovacao?: string | null },
) {
  const admin = await requireRole("ADMIN");
  const antes = await db.professionalProfile.findUnique({ where: { id: profileId }, select: { status: true } });
  await db.professionalProfile.update({
    where: { id: profileId },
    data: {
      status: data.status,
      motivoReprovacao: data.motivoReprovacao ?? null,
      aprovadoEm: data.status === "APROVADA" ? new Date() : null,
      aprovadoPor: data.status === "APROVADA" ? admin.id : null,
    },
  });
  if (data.status === "APROVADA" && antes?.status !== "APROVADA") await notificarAprovacao(profileId);
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
