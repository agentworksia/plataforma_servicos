"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { getSettingNumber } from "@/lib/settings";

export type ServicoState = { erro?: string } | undefined;

async function perfilId(): Promise<string> {
  const user = await requireRole("PROFISSIONAL");
  const p = await db.professionalProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!p) throw new Error("Perfil de profissional não encontrado.");
  return p.id;
}

export async function iniciarServico(_prev: ServicoState, formData: FormData): Promise<ServicoState> {
  const bookingId = String(formData.get("bookingId") ?? "");
  if (!bookingId) return { erro: "Serviço inválido." };
  const professionalId = await perfilId();

  const b = await db.booking.findFirst({ where: { id: bookingId, professionalId }, select: { status: true } });
  if (!b || b.status !== "AGENDADO") return { erro: "Só dá para iniciar um serviço agendado." };

  await db.booking.update({ where: { id: bookingId }, data: { status: "EM_ANDAMENTO" } });
  revalidatePath(`/profissional/servicos/${bookingId}`);
  revalidatePath("/profissional");
  return undefined;
}

export async function concluirServico(_prev: ServicoState, formData: FormData): Promise<ServicoState> {
  const bookingId = String(formData.get("bookingId") ?? "");
  if (!bookingId) return { erro: "Serviço inválido." };
  const professionalId = await perfilId();

  const b = await db.booking.findFirst({
    where: { id: bookingId, professionalId },
    select: { status: true, repasseProfissional: true, payout: { select: { id: true } } },
  });
  if (!b || (b.status !== "EM_ANDAMENTO" && b.status !== "AGENDADO")) {
    return { erro: "Este serviço não pode ser concluído agora." };
  }

  const agora = new Date();
  const prazoDias = await getSettingNumber("PRAZO_LIBERACAO_REPASSE_DIAS", 2);
  const liberadoEm = new Date(agora.getTime() + prazoDias * 86_400_000);

  await db.$transaction([
    db.booking.update({ where: { id: bookingId }, data: { status: "CONCLUIDO", concluidoEm: agora } }),
    ...(b.payout
      ? []
      : [
          db.payout.create({
            data: { bookingId, professionalId, status: "PENDENTE", valor: b.repasseProfissional, liberadoEm },
          }),
        ]),
  ]);
  revalidatePath(`/profissional/servicos/${bookingId}`);
  revalidatePath("/profissional");
  return undefined;
}
