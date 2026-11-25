import "server-only";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { payments } from "@/lib/payments";
import { LABEL_SERVICO } from "@/lib/bookings/display";

/** Horas que a cliente tem para pagar depois que a profissional aceita. */
export const HORAS_PARA_PAGAR = 12;

/**
 * Cria a cobrança de um agendamento que acabou de ser aceito.
 *
 * A cobrança nasce aqui, e não no agendamento, porque o split precisa saber a carteira
 * de destino — e a profissional só é conhecida depois que alguém aceita a oferta.
 *
 * Idempotente: se já existe Payment para o booking, não cria outro. O aceite pode ser
 * reprocessado pelo admin sem gerar cobrança duplicada.
 */
export async function criarCobrancaDoAceite(bookingId: string): Promise<void> {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      tipoServico: true,
      valorTotal: true,
      repasseProfissional: true,
      payment: { select: { id: true } },
      address: { select: { cidade: true } },
      client: { select: { tipo: true, cpf: true, cnpj: true, user: { select: { name: true, email: true } } } },
      professional: { select: { asaasWalletId: true } },
    },
  });
  if (!booking) throw new Error("Agendamento não encontrado.");
  if (booking.payment) return;

  const carteira = booking.professional?.asaasWalletId;
  const usarSplit = env.PAYMENT_PROVIDER === "asaas" && env.ASAAS_SPLIT;
  if (usarSplit && !carteira) {
    // A fila já filtra quem não tem carteira; chegar aqui sem ela é defeito, e cobrar
    // sem split esconderia o defeito atrás de um repasse manual silencioso.
    throw new Error(`Profissional sem carteira Asaas no agendamento ${bookingId}.`);
  }

  const cobranca = await payments.criarCobranca({
    bookingId: booking.id,
    valorCentavos: booking.valorTotal,
    metodo: "PIX",
    descricao: `${LABEL_SERVICO[booking.tipoServico] ?? "Serviço"} em ${booking.address.cidade}`,
    pagador: {
      nome: booking.client.user.name ?? "Cliente",
      email: booking.client.user.email,
      documento: (booking.client.tipo === "PJ" ? booking.client.cnpj : booking.client.cpf) ?? undefined,
    },
    split: carteira ? [{ walletId: carteira, valorCentavos: booking.repasseProfissional }] : undefined,
  });

  const expiraEm = new Date(Date.now() + HORAS_PARA_PAGAR * 3600_000);

  await db.$transaction([
    db.payment.create({
      data: {
        bookingId: booking.id,
        provider: cobranca.provider,
        providerId: cobranca.providerId,
        metodo: "PIX",
        status: cobranca.status,
        valor: booking.valorTotal,
        pixCopiaCola: cobranca.pixCopiaCola ?? null,
        checkoutUrl: cobranca.checkoutUrl ?? null,
        pagoEm: cobranca.status === "PAGO_RETIDO" ? new Date() : null,
      },
    }),
    db.booking.update({
      where: { id: booking.id },
      data: {
        // Com o provider fake a cobrança já nasce paga e o serviço vai direto para
        // AGENDADO; com provider real quem muda esse status é o webhook.
        status: cobranca.status === "PAGO_RETIDO" ? "AGENDADO" : "AGUARDANDO_PAGAMENTO",
        pagamentoExpiraEm: cobranca.status === "PAGO_RETIDO" ? null : expiraEm,
      },
    }),
  ]);
}

/**
 * Devolve à fila os agendamentos aceitos cuja cliente não pagou no prazo.
 * Chamado pela rota de cron.
 */
export async function liberarAceitesNaoPagos(): Promise<number> {
  const vencidos = await db.booking.findMany({
    where: { status: "AGUARDANDO_PAGAMENTO", pagamentoExpiraEm: { lt: new Date() } },
    select: { id: true, payment: { select: { id: true, providerId: true } } },
  });

  for (const b of vencidos) {
    // A cobrança some junto: deixá-la aberta permitiria pagar um horário que já voltou
    // para a fila e foi aceito por outra pessoa.
    if (b.payment?.providerId) {
      try {
        await payments.reembolsar(b.payment.providerId);
      } catch (err) {
        console.error("[cobranca] não consegui cancelar a cobrança vencida", err);
      }
    }
    await db.$transaction([
      db.payment.deleteMany({ where: { bookingId: b.id, status: "PENDENTE" } }),
      db.booking.update({
        where: { id: b.id },
        data: {
          status: "AGUARDANDO_PROFISSIONAL",
          professionalId: null,
          pagamentoExpiraEm: null,
        },
      }),
    ]);
    const { atribuirProximaDaFila } = await import("@/lib/matching");
    await atribuirProximaDaFila(b.id).catch((err) =>
      console.error("[cobranca] refila após prazo vencido falhou", err),
    );
  }
  return vencidos.length;
}
