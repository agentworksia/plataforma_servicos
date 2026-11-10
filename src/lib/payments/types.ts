// Contrato de pagamento. O MVP roda com a implementação "fake"; o provider real é o
// Asaas (src/lib/payments/asaas.ts). Trocar de provedor = implementar esta interface
// e apontar PAYMENT_PROVIDER.

export type PaymentMethod = "PIX" | "CARTAO";

/** Um destino do split. O valor é em centavos, igual ao resto do sistema. */
export type SplitDestino = { walletId: string; valorCentavos: number };

export type CriarCobrancaInput = {
  bookingId: string;
  valorCentavos: number;
  metodo: PaymentMethod;
  descricao: string;
  pagador: { nome: string; email: string; documento?: string };
  /** Repasse automático. Vazio = o valor inteiro fica na conta da plataforma. */
  split?: SplitDestino[];
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
  /** Carteira Asaas da profissional, quando ela tem subconta. */
  walletId?: string;
};

export type RepasseResultado = {
  provider: string;
  providerId: string;
  status: "LIBERADO" | "PAGO" | "FALHOU";
  /** Preenchido quando o split já creditou e não houve transferência a fazer. */
  jaCreditadoPeloSplit?: boolean;
};

/** Dados que o Asaas exige para abrir a subconta da profissional. */
export type SubcontaInput = {
  nome: string;
  email: string;
  cpf: string;
  celular: string;
  nascimento?: Date;
  rendaMensalCentavos: number;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
};

export type SubcontaCriada = { accountId: string; walletId: string };

export type AssinaturaInput = {
  assinaturaId: string;
  valorCentavos: number;
  metodo: PaymentMethod;
  descricao: string;
  pagador: { nome: string; email: string; documento?: string };
  primeiroVencimento: Date;
  /** Número de cobranças mensais; o plano anual são 12. Ausente = sem fim. */
  parcelas?: number;
};

export type AssinaturaCriada = {
  provider: string;
  providerId: string;
  checkoutUrl?: string;
  pixCopiaCola?: string;
  proximaCobranca?: Date;
};

/**
 * Evento normalizado de webhook. `eventoId` é obrigatório fora de IGNORADO: é a chave
 * de idempotência — o provedor reenvia o mesmo evento enquanto não receber 200.
 */
export type WebhookEvento =
  | { tipo: "PAGAMENTO_CONFIRMADO"; eventoId: string; providerId: string; assinaturaProviderId?: string }
  | { tipo: "PAGAMENTO_FALHOU"; eventoId: string; providerId: string; assinaturaProviderId?: string }
  | { tipo: "REEMBOLSO_CONFIRMADO"; eventoId: string; providerId: string; valorCentavos: number }
  | { tipo: "IGNORADO" };

export interface PaymentProvider {
  readonly nome: string;
  criarCobranca(input: CriarCobrancaInput): Promise<CobrancaCriada>;
  consultarStatus(providerId: string): Promise<StatusCobranca>;
  reembolsar(providerId: string, valorCentavos?: number): Promise<void>;
  liberarRepasse(input: LiberarRepasseInput): Promise<RepasseResultado>;
  criarSubconta(input: SubcontaInput): Promise<SubcontaCriada>;
  criarAssinatura(input: AssinaturaInput): Promise<AssinaturaCriada>;
  cancelarAssinatura(providerId: string): Promise<void>;
  /** Valida a autenticidade da requisição e devolve o evento. Lança se não autêntica. */
  interpretarWebhook(req: Request): Promise<WebhookEvento>;
}
