import "server-only";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
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

const BASES = {
  sandbox: "https://api-sandbox.asaas.com/v3",
  producao: "https://api.asaas.com/v3",
} as const;

/** Centavos -> o número decimal em reais que a API do Asaas espera. */
function reais(centavos: number): number {
  return Number((centavos / 100).toFixed(2));
}

function dataAsaas(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Dia do calendário em Brasília, não em UTC. Vencimento é data civil: depois das 21 h
 * o `toISOString()` já devolve o dia seguinte, e a cobrança nasceria vencendo um dia
 * além do combinado. Data de nascimento continua com `dataAsaas`, porque lá o valor
 * guardado já é uma data, não um instante.
 */
function diaNoBrasil(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function digitos(v: string): string {
  return v.replace(/\D/g, "");
}

type Resposta = Record<string, unknown>;

/**
 * Provider do Asaas.
 *
 * Modelo de dinheiro: a cobrança nasce na conta da plataforma e o `split` manda a parte
 * da profissional direto para a carteira dela. O split do Asaas liquida junto com o
 * pagamento — não existe campo para segurar. Em compensação, estornar a cobrança estorna
 * também o split, que é o que mantém o cancelamento funcionando para a cliente.
 *
 * O valor do split vai como `fixedValue`, e não percentual, de propósito: `percentualValue`
 * incide sobre o líquido (depois da taxa do Asaas) e o repasse não bateria com o valor que
 * já gravamos em `Payout.valor`. Com valor fixo, a taxa do gateway sai da parte da
 * plataforma e os livros fecham.
 */
export class AsaasPaymentProvider implements PaymentProvider {
  readonly nome = "asaas";
  private readonly base: string;
  private readonly chave: string;

  constructor() {
    if (!env.ASAAS_API_KEY) {
      throw new Error("PAYMENT_PROVIDER=asaas exige ASAAS_API_KEY. Configure antes de subir.");
    }
    this.base = BASES[env.ASAAS_AMBIENTE];
    this.chave = env.ASAAS_API_KEY;
  }

  private async chamar(caminho: string, init?: RequestInit): Promise<Resposta> {
    const resposta = await fetch(`${this.base}${caminho}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        access_token: this.chave,
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });

    const texto = await resposta.text();
    const corpo: Resposta = texto ? JSON.parse(texto) : {};

    if (!resposta.ok) {
      // A mensagem do Asaas vem em errors[].description. Ela entra no log, nunca na tela
      // do cliente: pode citar dado de outra pessoa ou detalhe de conta.
      const erros = Array.isArray(corpo.errors)
        ? (corpo.errors as Array<{ description?: string }>).map((e) => e.description).join("; ")
        : resposta.statusText;
      throw new Error(`Asaas ${resposta.status} em ${caminho}: ${erros}`);
    }
    return corpo;
  }

  /** O Asaas cobra por cliente cadastrado; reaproveita pelo CPF/e-mail quando já existe. */
  private async acharOuCriarCliente(p: { nome: string; email: string; documento?: string }): Promise<string> {
    if (p.documento) {
      const busca = await this.chamar(`/customers?cpfCnpj=${encodeURIComponent(digitos(p.documento))}&limit=1`);
      const lista = (busca.data as Array<{ id: string }> | undefined) ?? [];
      if (lista[0]?.id) return lista[0].id;
    }
    const criado = await this.chamar("/customers", {
      method: "POST",
      body: JSON.stringify({
        name: p.nome,
        email: p.email,
        cpfCnpj: p.documento ? digitos(p.documento) : undefined,
        notificationDisabled: true,
      }),
    });
    return String(criado.id);
  }

  async criarCobranca(input: CriarCobrancaInput): Promise<CobrancaCriada> {
    const customer = await this.acharOuCriarCliente(input.pagador);
    const hoje = new Date();

    const corpo: Record<string, unknown> = {
      customer,
      billingType: input.metodo === "PIX" ? "PIX" : "CREDIT_CARD",
      value: reais(input.valorCentavos),
      dueDate: diaNoBrasil(hoje),
      description: input.descricao,
      // Amarra a cobrança ao agendamento: é por aqui que o webhook reencontra o Booking
      // mesmo se o nosso registro de Payment tiver falhado.
      externalReference: input.bookingId,
    };

    if (env.ASAAS_SPLIT && input.split?.length) {
      corpo.split = input.split.map((s) => ({ walletId: s.walletId, fixedValue: reais(s.valorCentavos) }));
    }

    const cobranca = await this.chamar("/payments", { method: "POST", body: JSON.stringify(corpo) });
    const providerId = String(cobranca.id);

    // Pix: o QR vem num endpoint separado. Cartão: o cliente paga na página hospedada do
    // Asaas (invoiceUrl) — nenhum dado de cartão passa por este servidor, e é isso que
    // mantém a plataforma no escopo mais leve de PCI (SAQ-A).
    let pixCopiaCola: string | undefined;
    if (input.metodo === "PIX") {
      try {
        const qr = await this.chamar(`/payments/${providerId}/pixQrCode`);
        pixCopiaCola = typeof qr.payload === "string" ? qr.payload : undefined;
      } catch (err) {
        console.error("[asaas] Pix criado mas QR não veio", err);
      }
    }

    return {
      provider: this.nome,
      providerId,
      // Nunca "PAGO_RETIDO" aqui: quem confirma pagamento é o webhook, não a resposta
      // da criação. Confiar nesta resposta libera serviço sem dinheiro ter entrado.
      status: "PENDENTE",
      pixCopiaCola,
      checkoutUrl: typeof cobranca.invoiceUrl === "string" ? cobranca.invoiceUrl : undefined,
    };
  }

  async consultarStatus(providerId: string): Promise<StatusCobranca> {
    const c = await this.chamar(`/payments/${providerId}`);
    return traduzirStatus(String(c.status));
  }

  async reembolsar(providerId: string, valorCentavos?: number): Promise<void> {
    await this.chamar(`/payments/${providerId}/refund`, {
      method: "POST",
      body: JSON.stringify(valorCentavos ? { value: reais(valorCentavos) } : {}),
    });
  }

  async liberarRepasse(input: LiberarRepasseInput): Promise<RepasseResultado> {
    // Com split ligado o dinheiro já caiu na carteira dela quando o cliente pagou.
    // Não há transferência a fazer; o registro de repasse serve só para conciliação.
    if (env.ASAAS_SPLIT) {
      return {
        provider: this.nome,
        providerId: `split:${input.payoutId}`,
        status: "PAGO",
        jaCreditadoPeloSplit: true,
      };
    }

    if (!input.walletId) {
      throw new Error("Repasse sem split exige a carteira Asaas da profissional.");
    }
    const t = await this.chamar("/transfers", {
      method: "POST",
      body: JSON.stringify({ value: reais(input.valorCentavos), walletId: input.walletId }),
    });
    return { provider: this.nome, providerId: String(t.id), status: "PAGO" };
  }

  async criarSubconta(input: SubcontaInput): Promise<SubcontaCriada> {
    const conta = await this.chamar("/accounts", {
      method: "POST",
      body: JSON.stringify({
        name: input.nome,
        email: input.email,
        cpfCnpj: digitos(input.cpf),
        mobilePhone: digitos(input.celular),
        birthDate: input.nascimento ? dataAsaas(input.nascimento) : undefined,
        incomeValue: reais(input.rendaMensalCentavos),
        address: input.logradouro,
        addressNumber: input.numero,
        complement: input.complemento || undefined,
        province: input.bairro,
        postalCode: digitos(input.cep),
      }),
    });
    // A apiKey da subconta vem só nesta resposta e não é recuperável depois. A plataforma
    // não precisa dela (o split usa walletId), então ela é descartada de propósito:
    // guardar chave de API de terceiro é passivo, não ativo.
    return { accountId: String(conta.id), walletId: String(conta.walletId) };
  }

  async criarAssinatura(input: AssinaturaInput): Promise<AssinaturaCriada> {
    const customer = await this.acharOuCriarCliente(input.pagador);
    const assinatura = await this.chamar("/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        customer,
        billingType: input.metodo === "PIX" ? "PIX" : "CREDIT_CARD",
        value: reais(input.valorCentavos),
        nextDueDate: diaNoBrasil(input.primeiroVencimento),
        cycle: "MONTHLY",
        description: input.descricao,
        externalReference: input.assinaturaId,
        maxPayments: input.parcelas,
      }),
    });

    const providerId = String(assinatura.id);
    // A primeira cobrança já nasce junto; é dela que sai o QR ou o link de cartão.
    let pixCopiaCola: string | undefined;
    let checkoutUrl: string | undefined;
    try {
      const cobrancas = await this.chamar(`/subscriptions/${providerId}/payments?limit=1`);
      const primeira = ((cobrancas.data as Array<Resposta> | undefined) ?? [])[0];
      if (primeira) {
        checkoutUrl = typeof primeira.invoiceUrl === "string" ? primeira.invoiceUrl : undefined;
        if (input.metodo === "PIX") {
          const qr = await this.chamar(`/payments/${String(primeira.id)}/pixQrCode`);
          pixCopiaCola = typeof qr.payload === "string" ? qr.payload : undefined;
        }
      }
    } catch (err) {
      console.error("[asaas] assinatura criada mas a primeira cobrança não veio", err);
    }

    return {
      provider: this.nome,
      providerId,
      checkoutUrl,
      pixCopiaCola,
      proximaCobranca: input.primeiroVencimento,
    };
  }

  async cancelarAssinatura(providerId: string): Promise<void> {
    await this.chamar(`/subscriptions/${providerId}`, { method: "DELETE" });
  }

  async interpretarWebhook(req: Request): Promise<WebhookEvento> {
    const esperado = env.ASAAS_WEBHOOK_TOKEN;
    // Falha fechada: sem token configurado o endpoint recusa tudo. O contrário deixaria
    // qualquer pessoa confirmar pagamento com um curl. O tamanho mínimo é conferido aqui
    // porque o env deixou de reprovar — um token curto é erro de configuração, não de quem chamou.
    if (!esperado || esperado.length < 32) {
      throw new Error("ASAAS_WEBHOOK_TOKEN ausente ou com menos de 32 caracteres; webhook recusado.");
    }

    const recebido = req.headers.get("asaas-access-token") ?? "";
    if (!tokensIguais(recebido, esperado)) throw new Error("Token de webhook inválido.");

    const corpo = (await req.json()) as {
      id?: string;
      event?: string;
      payment?: { id?: string; subscription?: string; value?: number; refunds?: Array<{ value?: number }> };
    };

    const eventoId = corpo.id;
    const evento = corpo.event;
    const cobranca = corpo.payment;
    if (!eventoId || !evento || !cobranca?.id) return { tipo: "IGNORADO" };

    const providerId = cobranca.id;
    const assinaturaProviderId = cobranca.subscription;

    switch (evento) {
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED":
        return { tipo: "PAGAMENTO_CONFIRMADO", eventoId, providerId, assinaturaProviderId };
      case "PAYMENT_OVERDUE":
      case "PAYMENT_DELETED":
      case "PAYMENT_CHARGEBACK_REQUESTED":
        return { tipo: "PAGAMENTO_FALHOU", eventoId, providerId, assinaturaProviderId };
      // O Asaas manda um evento próprio para estorno parcial. Sem ele aqui, um
      // reembolso parcial passaria batido e o pagamento ficaria marcado como pago.
      case "PAYMENT_REFUNDED":
      case "PAYMENT_PARTIALLY_REFUNDED": {
        const valor = cobranca.refunds?.[0]?.value ?? cobranca.value ?? 0;
        return { tipo: "REEMBOLSO_CONFIRMADO", eventoId, providerId, valorCentavos: Math.round(valor * 100) };
      }
      default:
        return { tipo: "IGNORADO" };
    }
  }
}

function tokensIguais(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  // timingSafeEqual exige o mesmo tamanho; comparar o tamanho antes já vaza só o tamanho,
  // que não é segredo útil.
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}

function traduzirStatus(s: string): StatusCobranca {
  switch (s) {
    case "CONFIRMED":
    case "RECEIVED":
    case "RECEIVED_IN_CASH":
      return "PAGO_RETIDO";
    case "REFUNDED":
      return "REEMBOLSADO";
    case "PARTIALLY_REFUNDED":
      return "PARCIALMENTE_REEMBOLSADO";
    case "OVERDUE":
    case "CHARGEBACK_REQUESTED":
    case "CHARGEBACK_DISPUTE":
      return "FALHOU";
    default:
      return "PENDENTE";
  }
}
