import "server-only";
import { env } from "@/lib/env";
import { FakePaymentProvider } from "./fake";
import type { PaymentProvider } from "./types";

export * from "./types";

function criarProvider(): PaymentProvider {
  const provider = env.PAYMENT_PROVIDER ?? "fake";
  if (provider === "fake") return new FakePaymentProvider();
  // Quando o provider real for escolhido, implementar PaymentProvider e plugar aqui.
  throw new Error(`PAYMENT_PROVIDER "${provider}" ainda não implementado.`);
}

export const payments: PaymentProvider = criarProvider();
