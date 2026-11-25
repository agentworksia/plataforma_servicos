import "server-only";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { payments } from "@/lib/payments";
import { getSetting } from "@/lib/settings";
import { PLANOS } from "./planos";
import type { PaymentMethod, PlanoAssinatura } from "@/generated/prisma/enums";

export * from "./planos";

/**
 * A partir de quando a assinatura passa a ser exigida para receber ofertas.
 * Existe para a regra não entrar em vigor no deploy e derrubar quem já estava
 * trabalhando sem aviso. O admin muda a data na tabela Setting.
 */
export async function inicioDaCobranca(): Promise<Date> {
  const valor = await getSetting("ASSINATURA_COBRANCA_INICIO", "2099-01-01");
  const d = new Date(`${valor}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? new Date("2099-01-01T00:00:00.000Z") : d;
}

export async function cobrancaJaValendo(agora = new Date()): Promise<boolean> {
  return agora >= (await inicioDaCobranca());
}

/** Assinatura em dia = status ATIVA e acesso pago até hoje ou depois. */
export function estaEmDia(
  assinatura: { status: string; ativaAte: Date | null } | null,
  agora = new Date(),
): boolean {
  if (!assinatura || assinatura.status !== "ATIVA") return false;
  return !!assinatura.ativaAte && assinatura.ativaAte >= agora;
}

export async function assinaturaDaProfissional(professionalId: string) {
  return db.assinatura.findUnique({ where: { professionalId } });
}

/**
 * Cria (ou retoma) a assinatura e manda criar a cobrança recorrente no provedor.
 * A assinatura nasce PENDENTE: quem a coloca em ATIVA é o webhook do pagamento.
 */
export async function contratarPlano(
  professionalId: string,
  plano: PlanoAssinatura,
  metodo: PaymentMethod,
): Promise<{ checkoutUrl?: string; pixCopiaCola?: string }> {
  const perfil = await db.professionalProfile.findUnique({
    where: { id: professionalId },
    select: { id: true, cpf: true, user: { select: { name: true, email: true } } },
  });
  if (!perfil) throw new Error("Perfil não encontrado.");

  const config = PLANOS[plano];
  const primeiroVencimento = new Date();

  const assinatura = await db.assinatura.upsert({
    where: { professionalId },
    create: {
      professionalId,
      plano,
      metodo,
      valorCentavos: config.valorCentavos,
      status: "PENDENTE",
    },
    update: {
      plano,
      metodo,
      valorCentavos: config.valorCentavos,
      status: "PENDENTE",
      canceladaEm: null,
    },
  });

  const criada = await payments.criarAssinatura({
    assinaturaId: assinatura.id,
    valorCentavos: config.valorCentavos,
    metodo,
    descricao: `Prime Diárias — plano ${config.nome}`,
    pagador: {
      nome: perfil.user.name ?? "Profissional",
      email: perfil.user.email,
      documento: perfil.cpf ?? undefined,
    },
    primeiroVencimento,
    parcelas: config.parcelas ?? undefined,
  });

  await db.assinatura.update({
    where: { id: assinatura.id },
    data: {
      provider: criada.provider,
      providerId: criada.providerId,
      checkoutUrl: criada.checkoutUrl ?? null,
      pixCopiaCola: criada.pixCopiaCola ?? null,
      proximaCobranca: criada.proximaCobranca ?? primeiroVencimento,
    },
  });

  return { checkoutUrl: criada.checkoutUrl, pixCopiaCola: criada.pixCopiaCola };
}

export async function cancelarPlano(professionalId: string): Promise<void> {
  const a = await db.assinatura.findUnique({ where: { professionalId } });
  if (!a) return;
  if (a.providerId) {
    try {
      await payments.cancelarAssinatura(a.providerId);
    } catch (err) {
      console.error("[assinatura] provedor recusou o cancelamento", err);
    }
  }
  // `ativaAte` não é zerado: quem já pagou o mês usa até o fim do período.
  await db.assinatura.update({
    where: { id: a.id },
    data: { status: "CANCELADA", canceladaEm: new Date(), proximaCobranca: null },
  });
}

/** Chamado pelo webhook quando uma cobrança da assinatura é confirmada. */
export async function registrarMensalidadePaga(
  assinaturaProviderId: string,
  cobrancaProviderId: string,
  valorCentavos: number,
): Promise<void> {
  const a = await db.assinatura.findUnique({ where: { providerId: assinaturaProviderId } });
  if (!a) {
    console.warn(`[assinatura] cobrança de assinatura desconhecida ${assinaturaProviderId}`);
    return;
  }

  // Segunda trava, além da do webhook: estender o plano não é idempotente por
  // natureza — rodar duas vezes daria dois meses por um pagamento. A trava de
  // `webhook_eventos` já barra o reenvio, mas ela depende de o provedor repetir o
  // mesmo id do evento, e isso é promessa dele, não nossa.
  const jaRegistrada = await db.assinaturaCobranca.findUnique({
    where: { providerId: cobrancaProviderId },
    select: { status: true },
  });
  if (jaRegistrada?.status === "PAGO_RETIDO") return;

  // Soma um mês a partir do que for maior: hoje ou o fim do período já pago. Assim
  // pagar adiantado estende em vez de encurtar.
  const base = a.ativaAte && a.ativaAte > new Date() ? a.ativaAte : new Date();
  const ativaAte = new Date(base);
  ativaAte.setUTCMonth(ativaAte.getUTCMonth() + 1);

  await db.$transaction([
    db.assinatura.update({
      where: { id: a.id },
      data: { status: "ATIVA", ativaAte, proximaCobranca: ativaAte },
    }),
    db.assinaturaCobranca.upsert({
      where: { providerId: cobrancaProviderId },
      create: {
        assinaturaId: a.id,
        providerId: cobrancaProviderId,
        valor: valorCentavos,
        status: "PAGO_RETIDO",
        vencimento: new Date(),
        pagoEm: new Date(),
      },
      update: { status: "PAGO_RETIDO", pagoEm: new Date() },
    }),
  ]);
}

/** Chamado pelo webhook quando a mensalidade vence sem pagamento. */
export async function registrarMensalidadeAtrasada(assinaturaProviderId: string): Promise<void> {
  const a = await db.assinatura.findUnique({ where: { providerId: assinaturaProviderId } });
  if (!a || a.status === "CANCELADA") return;
  await db.assinatura.update({ where: { id: a.id }, data: { status: "ATRASADA" } });
}

/**
 * Carteira Asaas é obrigatória para receber quando o split está ligado: sem ela o
 * dinheiro não tem para onde ir. Com provider fake a exigência não se aplica.
 */
export function exigeCarteira(): boolean {
  return env.PAYMENT_PROVIDER === "asaas" && env.ASAAS_SPLIT;
}
