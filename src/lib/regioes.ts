// Regiões atendidas: Curitiba + Região Metropolitana (PR) e o litoral norte/centro de
// Santa Catarina. A verdade sobre "está ativo?" fica na tabela ServiceArea; estas listas
// são o ponto de partida pro seed e pra checagem de CEP antes de consultar o banco.

export type Praca = {
  nome: string;
  uf: "PR" | "SC";
  /** Multiplicador sobre a tabela-base. O litoral entra mais caro; o admin ajusta depois. */
  multiplicadorRegiao: number;
};

export const PRACAS: Praca[] = [
  // --- Curitiba e Região Metropolitana ------------------------------------
  { nome: "Curitiba", uf: "PR", multiplicadorRegiao: 1 },
  { nome: "São José dos Pinhais", uf: "PR", multiplicadorRegiao: 1 },
  { nome: "Colombo", uf: "PR", multiplicadorRegiao: 1 },
  { nome: "Pinhais", uf: "PR", multiplicadorRegiao: 1 },
  { nome: "Araucária", uf: "PR", multiplicadorRegiao: 1 },
  { nome: "Fazenda Rio Grande", uf: "PR", multiplicadorRegiao: 1 },
  { nome: "Almirante Tamandaré", uf: "PR", multiplicadorRegiao: 1 },
  { nome: "Campo Largo", uf: "PR", multiplicadorRegiao: 1 },
  { nome: "Piraquara", uf: "PR", multiplicadorRegiao: 1 },
  { nome: "Quatro Barras", uf: "PR", multiplicadorRegiao: 1 },
  { nome: "Campina Grande do Sul", uf: "PR", multiplicadorRegiao: 1 },
  { nome: "Campo Magro", uf: "PR", multiplicadorRegiao: 1 },

  // --- Litoral de Santa Catarina ------------------------------------------
  // Praça turística: custo de vida e deslocamento maiores, e a demanda concentra em
  // alta temporada. Entra 25% acima da tabela de Curitiba — ajustável em /admin/precos.
  { nome: "Itapoá", uf: "SC", multiplicadorRegiao: 1.25 },
  { nome: "Balneário Barra do Sul", uf: "SC", multiplicadorRegiao: 1.25 },
  { nome: "São Francisco do Sul", uf: "SC", multiplicadorRegiao: 1.25 },
  { nome: "Barra Velha", uf: "SC", multiplicadorRegiao: 1.25 },
  { nome: "Piçarras", uf: "SC", multiplicadorRegiao: 1.25 },
  { nome: "Penha", uf: "SC", multiplicadorRegiao: 1.25 },
  { nome: "Navegantes", uf: "SC", multiplicadorRegiao: 1.25 },
  { nome: "Itajaí", uf: "SC", multiplicadorRegiao: 1.25 },
  { nome: "Balneário Camboriú", uf: "SC", multiplicadorRegiao: 1.25 },
  { nome: "Camboriú", uf: "SC", multiplicadorRegiao: 1.25 },
  { nome: "Itapema", uf: "SC", multiplicadorRegiao: 1.25 },
  { nome: "Porto Belo", uf: "SC", multiplicadorRegiao: 1.25 },
  { nome: "Bombinhas", uf: "SC", multiplicadorRegiao: 1.25 },
  { nome: "Tijucas", uf: "SC", multiplicadorRegiao: 1.25 },
  { nome: "Governador Celso Ramos", uf: "SC", multiplicadorRegiao: 1.25 },
  { nome: "Biguaçu", uf: "SC", multiplicadorRegiao: 1.25 },
  { nome: "São José", uf: "SC", multiplicadorRegiao: 1.25 },
  { nome: "Florianópolis", uf: "SC", multiplicadorRegiao: 1.25 },
  { nome: "Palhoça", uf: "SC", multiplicadorRegiao: 1.25 },
];

export const CIDADES_ATENDIDAS = PRACAS.map((p) => p.nome);
export const CIDADES_PR = PRACAS.filter((p) => p.uf === "PR").map((p) => p.nome);
export const CIDADES_SC = PRACAS.filter((p) => p.uf === "SC").map((p) => p.nome);

export const UF_PADRAO = "PR";

export function pracaPorNome(cidade: string): Praca | undefined {
  const alvo = cidade.trim().toLocaleLowerCase("pt-BR");
  return PRACAS.find((p) => p.nome.toLocaleLowerCase("pt-BR") === alvo);
}

// Faixas de CEP (prefixo de 5 dígitos). Checagem grosseira, só pra captar lead cedo —
// a confirmação real vem do CEP -> cidade cruzado com ServiceArea.ativo.
const FAIXAS_CEP: Array<[number, number]> = [
  [80000, 82999], // Curitiba
  [83000, 83880], // RMC
  [88000, 88099], // Florianópolis
  [88100, 88199], // São José, Palhoça, Biguaçu
  [88200, 88399], // Tijucas, Porto Belo, Bombinhas, Itapema, Balneário Camboriú, Camboriú
  [88300, 88399], // Itajaí e Navegantes
  [88370, 88399], // Penha, Piçarras, Barra Velha
  [89240, 89259], // São Francisco do Sul, Itapoá, Balneário Barra do Sul
];

export function cepPareceAtendido(cep: string): boolean {
  const prefixo = Number(cep.replace(/\D/g, "").slice(0, 5));
  if (!prefixo) return false;
  return FAIXAS_CEP.some(([min, max]) => prefixo >= min && prefixo <= max);
}
