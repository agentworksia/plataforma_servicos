import "server-only";
import { db } from "@/lib/db";
import { getSettingNumber } from "@/lib/settings";
import type { ServiceType } from "@/generated/prisma/enums";

export type CalcularPrecoInput = {
  tipoServico: ServiceType;
  duracaoHoras: number;
  serviceAreaId: string;
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
 * preço = valorBase(tipo, duração, região) × multiplicador + extras.
 * taxa da plataforma = X% (Setting TAXA_PLATAFORMA_PCT); repasse = total − taxa.
 */
export async function calcularPreco(input: CalcularPrecoInput): Promise<PrecoCalculado> {
  const regra = await db.pricingRule.findUnique({
    where: {
      tipoServico_duracaoHoras_serviceAreaId: {
        tipoServico: input.tipoServico,
        duracaoHoras: input.duracaoHoras,
        serviceAreaId: input.serviceAreaId,
      },
    },
  });
  if (!regra || !regra.ativo) {
    throw new Error("Não há preço cadastrado para essa combinação de tipo, duração e região.");
  }

  const multiplicador = Number(regra.multiplicador);
  const valorServico = Math.round(regra.valorBase * multiplicador);

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
