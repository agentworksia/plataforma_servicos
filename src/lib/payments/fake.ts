import "server-only";
import type {
  CobrancaCriada,
  CriarCobrancaInput,
  LiberarRepasseInput,
  PaymentProvider,
  RepasseResultado,
  StatusCobranca,
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

  async interpretarWebhook(): Promise<WebhookEvento> {
    return { tipo: "IGNORADO" };
  }
}
