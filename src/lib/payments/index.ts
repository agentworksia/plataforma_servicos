import "server-only";
import { env } from "@/lib/env";
import { AsaasPaymentProvider } from "./asaas";
import { FakePaymentProvider } from "./fake";
import type { PaymentProvider } from "./types";

export * from "./types";

function criarProvider(): PaymentProvider {
  const provider = env.PAYMENT_PROVIDER ?? "fake";
  if (provider === "fake") return new FakePaymentProvider();
  if (provider === "asaas") return new AsaasPaymentProvider();
  throw new Error(`PAYMENT_PROVIDER "${provider}" ainda não implementado.`);
}

let instancia: PaymentProvider | null = null;

/**
 * O provider é construído na primeira chamada, não na carga do módulo.
 * Construir na carga fazia uma configuração errada do Asaas derrubar todas as telas
 * que apenas importam este módulo de passagem, em vez de só o fluxo de pagamento.
 */
export const payments: PaymentProvider = new Proxy({} as PaymentProvider, {
  get(_alvo, prop) {
    instancia ??= criarProvider();
    const valor = Reflect.get(instancia as object, prop);
    return typeof valor === "function" ? valor.bind(instancia) : valor;
  },
});
