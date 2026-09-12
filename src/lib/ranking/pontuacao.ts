// Pontuação interna das profissionais. Define a ordem da fila de ofertas e é visível
// apenas no painel do admin — nem a cliente nem a própria profissional veem esse número.
// Sem acesso a banco de propósito: a mesma função pontua os candidatos já carregados
// pelo matching e as linhas da tela de ranking.

export type MetricasProfissional = {
  mediaNota: number | null;
  totalAvaliacoes: number;
  servicosConcluidos: number;
  ofertasRespondidas: number;
  ofertasAceitas: number;
  cancelamentosProprios: number;
};

export type Pontuacao = {
  total: number;
  qualidade: number;
  volume: number;
  aceite: number;
  compromisso: number;
};

/** Quem ainda não foi avaliada entra com nota neutra, para não ficar presa no fim da fila. */
const NOTA_NEUTRA = 4;
const VOLUME_SATURA_EM = 20;

const PESOS = { qualidade: 50, volume: 20, aceite: 20, compromisso: 10 };

const arredonda = (v: number) => Math.round(v * 10) / 10;

export function calcularPontuacao(m: MetricasProfissional): Pontuacao {
  const nota = m.totalAvaliacoes > 0 && m.mediaNota !== null ? m.mediaNota : NOTA_NEUTRA;

  const qualidade = ((nota - 1) / 4) * PESOS.qualidade;
  const volume = Math.min(m.servicosConcluidos / VOLUME_SATURA_EM, 1) * PESOS.volume;
  const taxaAceite = m.ofertasRespondidas > 0 ? m.ofertasAceitas / m.ofertasRespondidas : 1;
  const aceite = taxaAceite * PESOS.aceite;
  const compromisso = Math.max(0, PESOS.compromisso - Math.min(m.cancelamentosProprios, 5) * 2);

  return {
    qualidade: arredonda(qualidade),
    volume: arredonda(volume),
    aceite: arredonda(aceite),
    compromisso: arredonda(compromisso),
    total: arredonda(qualidade + volume + aceite + compromisso),
  };
}

export const FAIXAS = [
  { min: 80, nome: "Prioridade alta", cor: "verde" },
  { min: 60, nome: "Prioridade média", cor: "neutro" },
  { min: 40, nome: "Prioridade baixa", cor: "amarelo" },
  { min: 0, nome: "Em observação", cor: "vermelho" },
] as const;

export type Faixa = (typeof FAIXAS)[number];

export function faixaDe(total: number): Faixa {
  return FAIXAS.find((f) => total >= f.min) ?? FAIXAS[FAIXAS.length - 1];
}

export const EXPLICACAO_PESOS = [
  { nome: "Avaliação das clientes", peso: PESOS.qualidade },
  { nome: "Serviços concluídos", peso: PESOS.volume },
  { nome: "Ofertas aceitas", peso: PESOS.aceite },
  { nome: "Serviços que não cancelou", peso: PESOS.compromisso },
] as const;
