import "server-only";
import type {
  AssinaturaCriada,
  AssinaturaInput,
  CobrancaCriada,
  CriarCobrancaInput,
  LiberarRepasseInput,
  PaymentProvider,
  RepasseResultado,
  StatusCobranca,
  SubcontaCriada,
  SubcontaInput,
  WebhookEvento,
} from "./types";

// Implementação de desenvolvimento: nada sai pra fora. Cobranças "nascem" retidas,
// repasses são liberados na hora. Serve pra destravar todo o fluxo do MVP sem gateway real.
export class FakePaymentProvider implements PaymentProvider {
  readonly nome = "fake";

  async criarCobranca(input: CriarCobrancaInput): Promise<CobrancaCriada> {
    const providerId = `fake_pay_${input.bookingId}_${Date.now()}`;
    console.info(`[payments:fake] cobrança criada ${providerId} (${input.valorCentavos} centavos, ${input.metodo})`);
    return {
      provider: this.nome,
      providerId,
      status: "PAGO_RETIDO",
      pixCopiaCola: input.metodo === "PIX" ? `00020126FAKE-${providerId}` : undefined,
      checkoutUrl: input.metodo === "CARTAO" ? `/pagamento/fake/${providerId}` : undefined,
    };
  }

  async consultarStatus(): Promise<StatusCobranca> {
    return "PAGO_RETIDO";
  }

  async reembolsar(providerId: string, valorCentavos?: number): Promise<void> {
    console.info(`[payments:fake] reembolso ${providerId} (${valorCentavos ?? "total"})`);
  }

  async liberarRepasse(input: LiberarRepasseInput): Promise<RepasseResultado> {
    const providerId = `fake_payout_${input.payoutId}_${Date.now()}`;
    console.info(`[payments:fake] repasse liberado ${providerId} (${input.valorCentavos} centavos)`);
    return { provider: this.nome, providerId, status: "PAGO" };
  }

  async criarSubconta(input: SubcontaInput): Promise<SubcontaCriada> {
    const id = `fake_acc_${digitosSeguros(input.cpf)}`;
    console.info(`[payments:fake] subconta criada ${id}`);
    return { accountId: id, walletId: `fake_wallet_${digitosSeguros(input.cpf)}` };
  }

  async criarAssinatura(input: AssinaturaInput): Promise<AssinaturaCriada> {
    const providerId = `fake_sub_${input.assinaturaId}`;
    console.info(`[payments:fake] assinatura criada ${providerId} (${input.valorCentavos} centavos)`);
    return {
      provider: this.nome,
      providerId,
      pixCopiaCola: input.metodo === "PIX" ? `00020126FAKE-${providerId}` : undefined,
      checkoutUrl: input.metodo === "CARTAO" ? `/pagamento/fake/${providerId}` : undefined,
      proximaCobranca: input.primeiroVencimento,
    };
  }

  async cancelarAssinatura(providerId: string): Promise<void> {
    console.info(`[payments:fake] assinatura cancelada ${providerId}`);
  }

  async interpretarWebhook(): Promise<WebhookEvento> {
    return { tipo: "IGNORADO" };
  }
}

/** Só para o log do provider fake não carregar CPF inteiro. */
function digitosSeguros(cpf: string): string {
  return cpf.replace(/\D/g, "").slice(-4);
}
