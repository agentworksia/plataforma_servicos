import "server-only";
import { env } from "@/lib/env";
import { FakePaymentProvider } from "./fake";
import type { PaymentProvider } from "./types";

export * from "./types";

function criarProvider(): PaymentProvider {
  switch (env.PAYMENT_PROVIDER) {
    case "fake":
      return new FakePaymentProvider();
    default:
      // Quando o provider real for escolhido, implementar PaymentProvider e plugar aqui.
      throw new Error(`PAYMENT_PROVIDER "${env.PAYMENT_PROVIDER}" ainda não implementado.`);
  }
}

export const payments: PaymentProvider = criarProvider();
