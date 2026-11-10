import "server-only";
import { db } from "@/lib/db";
import { getSettingNumber } from "@/lib/settings";
import { fatorDoDia } from "@/lib/pricing/tabela";
import type { ServiceType } from "@/generated/prisma/enums";

export type CalcularPrecoInput = {
  tipoServico: ServiceType;
  duracaoMinutos: number;
  serviceAreaId: string;
  /** "YYYY-MM-DD" do serviço — define o acréscimo de fim de semana. */
  data: string;
  extrasIds?: string[];
};

export type PrecoCalculado = {
  valorServico: number; // centavos, já com multiplicador
  valorExtras: number;
  taxaPlataforma: number;
  valorTotal: number;
  repasseProfissional: number;
  taxaPct: number;
};

/**
 * preço = valorBase(tipo, duração, região) × multiplicador × fator do dia + extras.
 * taxa da plataforma = X% (Setting TAXA_PLATAFORMA_PCT); repasse = total − taxa.
 *
 * O fator do dia é recalculado aqui, no servidor, e não vem do formulário: é o que
 * impede alguém de agendar um passeio de sábado pagando preço de terça.
 */
export async function calcularPreco(input: CalcularPrecoInput): Promise<PrecoCalculado> {
  const regra = await db.pricingRule.findUnique({
    where: {
      tipoServico_duracaoMinutos_serviceAreaId: {
        tipoServico: input.tipoServico,
        duracaoMinutos: input.duracaoMinutos,
        serviceAreaId: input.serviceAreaId,
      },
    },
  });
  if (!regra || !regra.ativo) {
    throw new Error("Não há preço cadastrado para essa combinação de tipo, duração e região.");
  }

  const multiplicador = Number(regra.multiplicador);
  const valorServico = Math.round(
    regra.valorBase * multiplicador * fatorDoDia(input.tipoServico, input.data),
  );

  const extras = input.extrasIds?.length
    ? await db.serviceExtra.findMany({ where: { id: { in: input.extrasIds }, ativo: true } })
    : [];
  const valorExtras = extras.reduce((soma, e) => soma + e.valor, 0);

  const taxaPct = await getSettingNumber("TAXA_PLATAFORMA_PCT", 20);
  const valorTotal = valorServico + valorExtras;
  const taxaPlataforma = Math.round(valorTotal * (taxaPct / 100));

  return {
    valorServico,
    valorExtras,
    taxaPlataforma,
    valorTotal,
    repasseProfissional: valorTotal - taxaPlataforma,
    taxaPct,
  };
}
