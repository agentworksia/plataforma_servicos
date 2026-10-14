// Catálogo dos tipos de serviço: nome, foto e texto. Fonte única da vitrine da capa e
// do seletor dentro do agendamento — sem "server-only", o formulário é de cliente.

import type { ServiceType } from "@/generated/prisma/enums";

export type Servico = {
  tipo: ServiceType;
  nome: string;
  foto: string;
  desc: string;
  /** Resumo de uma linha, para o seletor do formulário. */
  resumo: string;
};

export const SERVICOS: Servico[] = [
  {
    tipo: "DIARIA_PADRAO",
    nome: "Diária padrão",
    foto: "/fotos/diaria-padrao.jpg",
    desc: "A limpeza da casa inteira: cozinha, banheiros, quartos e áreas comuns, na ordem que você combinar.",
    resumo: "Casa inteira: cozinha, banheiros, quartos e áreas comuns.",
  },
  {
    tipo: "PASSADORIA",
    nome: "Passadoria",
    foto: "/fotos/passadoria.jpg",
    desc: "Só a roupa. A profissional passa o que estiver acumulado dentro das horas contratadas.",
    resumo: "Só a roupa, dentro das horas contratadas.",
  },
  {
    tipo: "POS_OBRA",
    nome: "Pós-obra",
    foto: "/fotos/pos-obra.jpg",
    desc: "Limpeza pesada depois da reforma: respingo de tinta, resto de cimento e a poeira fina que fica no ar.",
    resumo: "Depois da reforma: tinta, cimento e pó fino.",
  },
  {
    tipo: "CORPORATIVA",
    nome: "Corporativa",
    foto: "/fotos/corporativa.jpg",
    desc: "Escritórios, consultórios e órgãos públicos, com nota fiscal e dados de faturamento no cadastro.",
    resumo: "Escritórios e consultórios, com nota fiscal.",
  },
];

export function servicoPorTipo(tipo: ServiceType): Servico {
  return SERVICOS.find((s) => s.tipo === tipo) ?? SERVICOS[0];
}

export function ehTipoValido(v: string | undefined): v is ServiceType {
  return !!v && SERVICOS.some((s) => s.tipo === v);
}

/**
 * Roteiro do campo de pós-obra. São as perguntas que a profissional precisa ver
 * respondidas para decidir se aceita e para levar o produto e o EPI certos.
 */
export const ROTEIRO_POS_OBRA = [
  "Que obra foi: reforma, construção nova, só pintura?",
  "Metragem aproximada e quantos cômodos.",
  "O que ficou sujo: respingo de tinta, massa corrida, pó de drywall, cimento, cola de piso, gesso.",
  "Se ainda há entulho ou sobra de material no imóvel.",
  "Quantas janelas e se tem vidro grande ou sacada.",
  "Se água e energia já estão ligadas.",
];

export const EXEMPLO_POS_OBRA =
  "Apartamento de 80 m² recém-reformado, 2 quartos, sala, cozinha e 2 banheiros. " +
  "Trocamos todo o piso e lixamos drywall na sala, então tem muito pó fino em tudo. " +
  "Sobrou respingo de tinta branca nos rodapés e cola de piso no chão da cozinha. " +
  "O entulho já foi retirado. São 6 janelas e uma sacada com vidro. Água e luz ligadas.";
