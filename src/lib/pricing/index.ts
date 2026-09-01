import "server-only";
import { db } from "@/lib/db";
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
  sobOrcamento: boolean;
};

const CHAVE_TAXA_PLATAFORMA = "TAXA_PLATAFORMA_PCT";
const TAXA_PADRAO_PCT = 20;

/**
 * preço = valorBase(tipo, duração, região) * multiplicador + extras.
 * taxa da plataforma = X% (Setting), repasse = total - taxa.
 * Pós-obra pode vir marcado como "sob orçamento" (aprovação do admin antes de cobrar).
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
    throw new Error("Não há tabela de preço para essa combinação de tipo, duração e região.");
  }

  const multiplicador = Number(regra.multiplicador);
  const valorServico = Math.round(regra.valorBase * multiplicador);

  const extras = input.extrasIds?.length
    ? await db.serviceExtra.findMany({ where: { id: { in: input.extrasIds }, ativo: true } })
    : [];
  const valorExtras = extras.reduce((soma, e) => soma + e.valor, 0);

  const taxaPct = await getTaxaPlataformaPct();
  const valorTotal = valorServico + valorExtras;
  const taxaPlataforma = Math.round(valorTotal * (taxaPct / 100));

  return {
    valorServico,
    valorExtras,
    taxaPlataforma,
    valorTotal,
    repasseProfissional: valorTotal - taxaPlataforma,
    sobOrcamento: input.tipoServico === "POS_OBRA" && multiplicador === 0,
  };
}

async function getTaxaPlataformaPct(): Promise<number> {
  const setting = await db.setting.findUnique({ where: { chave: CHAVE_TAXA_PLATAFORMA } });
  const valor = setting ? Number(setting.valor) : NaN;
  return Number.isFinite(valor) ? valor : TAXA_PADRAO_PCT;
}
