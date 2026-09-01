// Regiões atendidas no MVP: Curitiba + Região Metropolitana (RMC).
// A verdade sobre "está ativo?" fica na tabela ServiceArea; esta lista é o ponto de partida
// pro seed e pra validação de CEP antes de ter os dados no banco.

export const UF_PADRAO = "PR";

// Municípios da RMC atendidos no lançamento. Outras cidades entram habilitando a ServiceArea.
export const CIDADES_ATENDIDAS = [
  "Curitiba",
  "São José dos Pinhais",
  "Colombo",
  "Pinhais",
  "Araucária",
  "Fazenda Rio Grande",
  "Almirante Tamandaré",
  "Campo Largo",
  "Piraquara",
  "Quatro Barras",
  "Campina Grande do Sul",
  "Campo Magro",
] as const;

export type CidadeAtendida = (typeof CIDADES_ATENDIDAS)[number];

// Faixas de CEP (prefixo de 5 dígitos) da RMC. Curitiba: 80000–82999; RMC: 83000–83800 aprox.
// É uma checagem grosseira pra captar lead cedo — a confirmação real vem do CEP -> cidade
// (ViaCEP na fase de agendamento) cruzado com ServiceArea.ativo.
const FAIXAS_CEP_RMC: Array<[number, number]> = [
  [80000, 82999], // Curitiba
  [83000, 83880], // São José dos Pinhais, Colombo, Pinhais, Piraquara, Fazenda Rio Grande, etc.
  [83600, 83609], // Campo Largo
  [83700, 83749], // Araucária
];

export function cepPareceAtendido(cep: string): boolean {
  const prefixo = Number(cep.replace(/\D/g, "").slice(0, 5));
  if (!prefixo) return false;
  return FAIXAS_CEP_RMC.some(([min, max]) => prefixo >= min && prefixo <= max);
}
