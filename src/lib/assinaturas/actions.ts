"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { cancelarPlano, contratarPlano } from "@/lib/assinaturas";

export type AssinaturaState = { erro?: string; ok?: string } | undefined;

const escolhaSchema = z.object({
  plano: z.enum(["MENSAL", "ANUAL"]),
  metodo: z.enum(["PIX", "CARTAO"]),
});

async function perfilId(): Promise<string> {
  const user = await requireRole("PROFISSIONAL");
  const p = await db.professionalProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!p) throw new Error("Perfil de profissional não encontrado.");
  return p.id;
}

export async function assinarPlano(
  _prev: AssinaturaState,
  formData: FormData,
): Promise<AssinaturaState> {
  const professionalId = await perfilId();
  const parsed = escolhaSchema.safeParse({
    plano: formData.get("plano"),
    metodo: formData.get("metodo"),
  });
  if (!parsed.success) return { erro: "Escolha um plano e uma forma de pagamento." };

  try {
    await contratarPlano(professionalId, parsed.data.plano, parsed.data.metodo);
  } catch (err) {
    console.error("[assinatura] contratação falhou", err);
    return { erro: "Não consegui gerar a cobrança agora. Tente de novo em instantes." };
  }

  revalidatePath("/profissional/assinatura");
  revalidatePath("/profissional");
  return { ok: "Cobrança gerada. Conclua o pagamento para liberar as ofertas." };
}

export async function cancelarAssinatura(
  _prev: AssinaturaState,
  _formData: FormData,
): Promise<AssinaturaState> {
  const professionalId = await perfilId();
  await cancelarPlano(professionalId);
  revalidatePath("/profissional/assinatura");
  revalidatePath("/profissional");
  return { ok: "Plano cancelado. Você continua recebendo ofertas até o fim do período já pago." };
}
