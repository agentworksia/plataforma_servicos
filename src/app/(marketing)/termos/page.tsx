import type { Metadata } from "next";

export const metadata: Metadata = { title: "Termos de uso" };

export default function TermosPage() {
  return (
    <article className="space-y-4 text-areia-700">
      <h1 className="titulo text-3xl text-marinho-900">Termos de uso</h1>
      <p className="text-sm text-areia-500">Última atualização: rascunho — a ser revisado juridicamente antes do lançamento.</p>

      <h2 className="mt-6 titulo-secao text-xl text-areia-900">1. O serviço</h2>
      <p>
        A plataforma intermedia a contratação de serviços de limpeza entre clientes e profissionais autônomas
        em Curitiba, na Região Metropolitana e no litoral de Santa Catarina. A plataforma faz o encontro
        entre as partes, processa o pagamento
        e repassa o valor à profissional após a conclusão do serviço, retendo uma taxa de serviço.
      </p>
      <p>
        O contrato de prestação de serviço é firmado <strong>entre a cliente e a profissional</strong>. A
        plataforma não é parte nesse contrato: ela aproxima as duas pontas, organiza a agenda e cuida do
        pagamento.
      </p>

      <h2 className="mt-6 titulo-secao text-xl text-areia-900">2. Ausência de vínculo</h2>
      <p>
        As profissionais cadastradas são <strong>autônomas e independentes</strong>. Não há entre elas e a
        plataforma vínculo empregatício, societário, de representação ou de subordinação de qualquer
        natureza, e nada nestes termos cria esse vínculo.
      </p>
      <p>
        A profissional define sozinha as cidades em que atende, os dias e horários de sua agenda e quais
        ofertas aceita ou recusa, sem exclusividade com a plataforma e sem jornada, meta ou ordem de serviço
        impostas por ela. Usa os próprios instrumentos de trabalho, arca com os próprios tributos e
        contribuições e pode prestar serviços a quem mais quiser, inclusive a concorrentes.
      </p>
      <p>
        A plataforma <strong>não seleciona, não supervisiona, não treina e não responde pela execução</strong>{" "}
        do serviço, nem pela conduta de clientes ou profissionais. A conferência de documentos no cadastro é
        uma checagem de identidade — não é garantia de desempenho, idoneidade ou resultado, e não transfere à
        plataforma a responsabilidade pelo serviço prestado.
      </p>

      <h2 className="mt-6 titulo-secao text-xl text-areia-900">3. Cadastro</h2>
      <p>
        Para contratar ou prestar serviços é necessário criar uma conta com dados verdadeiros. As profissionais
        passam por aprovação manual e envio de documento com foto antes de receberem ofertas.
      </p>

      <h2 className="mt-6 titulo-secao text-xl text-areia-900">4. Pagamento e cancelamento</h2>
      <p>
        O valor do serviço é cobrado depois que uma profissional aceita o atendimento, e não no momento do
        agendamento. A cobrança tem prazo para ser paga; vencido o prazo sem pagamento, o horário volta a
        ficar disponível. Confirmado o pagamento, a parte da profissional é creditada a ela e a plataforma
        retém sua comissão. Cancelamentos feitos com pelo menos 24 horas de antecedência são reembolsados
        integralmente, e o estorno alcança também a parte já creditada à profissional; após esse prazo não
        há reembolso.
      </p>

      <h2 className="mt-6 titulo-secao text-xl text-areia-900">5. Responsabilidades</h2>
      <p>
        A profissional é responsável pela execução do serviço contratado, respondendo por atrasos, pela
        qualidade do que entrega e por eventuais danos causados durante o atendimento. A cliente é
        responsável por fornecer acesso ao imóvel e informações corretas, e por manter guardados objetos de
        valor. Danos ou disputas devem ser comunicados pela plataforma, que registra o ocorrido, pode mediar
        e pode estornar o pagamento — sem que isso a torne responsável pelo serviço.
      </p>

      <p className="mt-8 text-sm text-areia-500">Conteúdo provisório. Não constitui aconselhamento jurídico.</p>
    </article>
  );
}
