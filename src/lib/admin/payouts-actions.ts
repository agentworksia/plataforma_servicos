"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { payments } from "@/lib/payments";

export type PayoutState = { erro?: string; ok?: string } | undefined;

async function liberarUm(payoutId: string) {
  const p = await db.payout.findUnique({
    where: { id: payoutId },
    select: {
      id: true,
      status: true,
      valor: true,
      professionalId: true,
      bookingId: true,
      professional: { select: { repassePixChave: true } },
    },
  });
  if (!p || p.status !== "PENDENTE") return false;

  const resultado = await payments.liberarRepasse({
    payoutId: p.id,
    professionalId: p.professionalId,
    valorCentavos: p.valor,
    chavePix: p.professional.repassePixChave ?? undefined,
  });

  const agora = new Date();
  await db.$transaction([
    db.payout.update({
      where: { id: p.id },
      data: {
        status: resultado.status === "PAGO" ? "PAGO" : "LIBERADO",
        provider: resultado.provider,
        providerId: resultado.providerId,
        liberadoEm: agora,
        pagoEm: resultado.status === "PAGO" ? agora : null,
      },
    }),
    db.payment.updateMany({ where: { bookingId: p.bookingId }, data: { status: "LIBERADO" } }),
  ]);
  return true;
}

export async function liberarRepasse(_prev: PayoutState, formData: FormData): Promise<PayoutState> {
  await requireRole("ADMIN");
  const payoutId = String(formData.get("payoutId") ?? "");
  if (!payoutId) return { erro: "Repasse inválido." };
  const ok = await liberarUm(payoutId);
  revalidatePath("/admin/repasses");
  return ok ? { ok: "Repasse liberado." } : { erro: "Este repasse não está pendente." };
}

export async function liberarElegiveis(_prev: PayoutState, _formData: FormData): Promise<PayoutState> {
  await requireRole("ADMIN");
  const elegiveis = await db.payout.findMany({
    where: { status: "PENDENTE", liberadoEm: { lte: new Date() }, booking: { status: "CONCLUIDO" } },
    select: { id: true },
  });
  let n = 0;
  for (const p of elegiveis) if (await liberarUm(p.id)) n++;
  revalidatePath("/admin/repasses");
  return { ok: `${n} repasse(s) liberado(s).` };
}
