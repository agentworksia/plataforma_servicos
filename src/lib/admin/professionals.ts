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

/**
 * Abre a conta que vai receber o repasse. Roda na aprovação, e não no cadastro, para
 * não criar conta de terceiro para quem ainda pode ser reprovada.
 * Falha aqui não derruba a aprovação: sem carteira a profissional simplesmente não
 * entra na fila, e o admin reaprova depois de corrigir o dado.
 */
async function abrirContaDeRepasse(profileId: string) {
  const p = await db.professionalProfile.findUnique({
    where: { id: profileId },
    select: {
      id: true,
      cpf: true,
      asaasWalletId: true,
      dataNascimento: true,
      cep: true,
      logradouro: true,
      numeroEnd: true,
      complemento: true,
      bairro: true,
      rendaMensal: true,
      user: { select: { name: true, email: true, telefone: true } },
    },
  });
  if (!p || p.asaasWalletId) return;
  if (!p.cpf || !p.cep || !p.logradouro || !p.numeroEnd || !p.bairro || !p.user.telefone) {
    console.warn(`[aprovação] ${profileId} sem dados para abrir a conta de repasse.`);
    return;
  }

  try {
    const { payments } = await import("@/lib/payments");
    const conta = await payments.criarSubconta({
      nome: p.user.name ?? "Profissional",
      email: p.user.email,
      cpf: p.cpf,
      celular: p.user.telefone,
      nascimento: p.dataNascimento ?? undefined,
      rendaMensalCentavos: p.rendaMensal ?? 0,
      cep: p.cep,
      logradouro: p.logradouro,
      numero: p.numeroEnd,
      complemento: p.complemento ?? undefined,
      bairro: p.bairro,
    });
    await db.professionalProfile.update({
      where: { id: profileId },
      data: { asaasAccountId: conta.accountId, asaasWalletId: conta.walletId },
    });
  } catch (err) {
    console.error("[aprovação] não consegui abrir a conta de repasse", err);
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
  if (data.status === "APROVADA" && antes?.status !== "APROVADA") {
    await abrirContaDeRepasse(profileId);
    await notificarAprovacao(profileId);
  }
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
