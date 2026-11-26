import "server-only";
import { db } from "@/lib/db";
import { getSettingNumber } from "@/lib/settings";
import { fatorDoDia } from "@/lib/pricing/tabela";
import type { ServiceType } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

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
  /** Quanto do total vai para a profissional, em %. */
  repassePct: number;
  taxaPct: number;
};

/**
 * preço = valorBase(tipo, duração, região) × multiplicador × fator do dia + extras.
 * repasse = total × `PricingRule.repassePct`, ou o complemento de
 * Setting.TAXA_PLATAFORMA_PCT quando a regra não define o seu; taxa = total − repasse.
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

  const valorTotal = valorServico + valorExtras;
  const repassePct = await repassePctDaRegra(regra.repassePct);

  // Arredonda o repasse, e não a taxa: é o repasse que vai no split do Asaas, então
  // ele tem de ser o número exato. A taxa fica com o resto, e total = taxa + repasse
  // continua fechando ao centavo.
  const repasseProfissional = Math.round(valorTotal * (repassePct / 100));
  const taxaPlataforma = valorTotal - repasseProfissional;

  return {
    valorServico,
    valorExtras,
    taxaPlataforma,
    valorTotal,
    repasseProfissional,
    repassePct,
    taxaPct: arredonda2(100 - repassePct),
  };
}

const arredonda2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Repasse da regra, ou o complemento da taxa global quando a regra não tem o seu.
 * Deixar `null` por padrão mantém a tabela inteira seguindo o Setting, e o admin
 * só precisa preencher onde a margem for diferente.
 */
export async function repassePctDaRegra(daRegra: Prisma.Decimal | null): Promise<number> {
  if (daRegra !== null) return arredonda2(Number(daRegra));
  const taxaPct = await getSettingNumber("TAXA_PLATAFORMA_PCT", 15);
  return arredonda2(100 - taxaPct);
}
