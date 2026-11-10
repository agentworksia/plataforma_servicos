// Aplica as praças e a tabela de preços no banco. Separado do seed de propósito:
// o seed também cria usuários de demonstração com senha conhecida, e em produção só
// se quer reaplicar preço. Rodar sozinho com `npm run db:precos`.

import type { PrismaClient } from "../src/generated/prisma/client";
import type { ServiceType } from "../src/generated/prisma/enums";
import { DURACOES, TABELA_BASE, precoDeTabela } from "../src/lib/pricing/tabela";
import { PRACAS } from "../src/lib/regioes";

const TIPOS = Object.keys(TABELA_BASE) as ServiceType[];

/**
 * O preço de praça já entra calculado em valorBase (multiplicador 1), para o que o
 * admin edita na tela ser exatamente o que o cliente vê.
 */
export async function aplicarTabelaDePrecos(db: PrismaClient): Promise<void> {
  for (const praca of PRACAS) {
    // where compound com campo nullable não é aceito no upsert do Prisma; faz find + create.
    const existente = await db.serviceArea.findFirst({ where: { cidade: praca.nome, bairro: null } });
    const area = existente
      ? await db.serviceArea.update({ where: { id: existente.id }, data: { ativo: true, uf: praca.uf } })
      : await db.serviceArea.create({ data: { cidade: praca.nome, uf: praca.uf, ativo: true } });

    for (const tipo of TIPOS) {
      for (const duracao of DURACOES) {
        const valor = precoDeTabela(tipo, duracao, praca.multiplicadorRegiao);

        // Duração que não existe no serviço (pós-obra de 8 h, diária de 30 min) é
        // removida, não desativada — senão sobra preço velho de quem rodou a versão
        // anterior da tabela.
        if (valor === null) {
          await db.pricingRule.deleteMany({
            where: { tipoServico: tipo, duracaoMinutos: duracao, serviceAreaId: area.id },
          });
          continue;
        }

        await db.pricingRule.upsert({
          where: {
            tipoServico_duracaoMinutos_serviceAreaId: {
              tipoServico: tipo,
              duracaoMinutos: duracao,
              serviceAreaId: area.id,
            },
          },
          create: {
            tipoServico: tipo,
            duracaoMinutos: duracao,
            serviceAreaId: area.id,
            valorBase: valor,
            multiplicador: 1,
          },
          // Reaplicar corrige preços antigos já gravados.
          update: { valorBase: valor, multiplicador: 1, ativo: true },
        });
      }
    }
  }
}
