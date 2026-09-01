// Contrato de pagamento. O MVP roda com a implementação "fake"; trocar por Mercado Pago /
// Pagar.me / Stripe / Asaas / Iugu depois é implementar esta interface e apontar PAYMENT_PROVIDER.

export type PaymentMethod = "PIX" | "CARTAO";

export type CriarCobrancaInput = {
  bookingId: string;
  valorCentavos: number;
  metodo: PaymentMethod;
  descricao: string;
  pagador: { nome: string; email: string; documento?: string };
};

export type CobrancaCriada = {
  provider: string;
  providerId: string;
  status: "PENDENTE" | "PAGO_RETIDO" | "FALHOU";
  pixCopiaCola?: string;
  checkoutUrl?: string;
  expiraEm?: Date;
};

export type StatusCobranca = "PENDENTE" | "PAGO_RETIDO" | "FALHOU" | "REEMBOLSADO" | "PARCIALMENTE_REEMBOLSADO";

export type LiberarRepasseInput = {
  payoutId: string;
  professionalId: string;
  valorCentavos: number;
  chavePix?: string;
};

export type RepasseResultado = {
  provider: string;
  providerId: string;
  status: "LIBERADO" | "PAGO" | "FALHOU";
};

export type WebhookEvento =
  | { tipo: "PAGAMENTO_CONFIRMADO"; providerId: string }
  | { tipo: "PAGAMENTO_FALHOU"; providerId: string }
  | { tipo: "REEMBOLSO_CONFIRMADO"; providerId: string; valorCentavos: number }
  | { tipo: "IGNORADO" };

export interface PaymentProvider {
  readonly nome: string;
  criarCobranca(input: CriarCobrancaInput): Promise<CobrancaCriada>;
  consultarStatus(providerId: string): Promise<StatusCobranca>;
  reembolsar(providerId: string, valorCentavos?: number): Promise<void>;
  liberarRepasse(input: LiberarRepasseInput): Promise<RepasseResultado>;
  interpretarWebhook(req: Request): Promise<WebhookEvento>;
}
