import type { Metadata } from "next";

export const metadata: Metadata = { title: "Termos de uso" };

export default function TermosPage() {
  return (
    <article className="space-y-4 text-slate-700">
      <h1 className="text-3xl font-bold text-slate-900">Termos de uso</h1>
      <p className="text-sm text-slate-500">Última atualização: rascunho — a ser revisado juridicamente antes do lançamento.</p>

      <h2 className="mt-6 text-xl font-semibold text-slate-900">1. O serviço</h2>
      <p>
        A plataforma intermedia a contratação de serviços de limpeza entre clientes e profissionais autônomas
        em Curitiba e Região Metropolitana. A plataforma faz o encontro entre as partes, processa o pagamento
        e repassa o valor à profissional após a conclusão do serviço, retendo uma taxa de serviço.
      </p>

      <h2 className="mt-6 text-xl font-semibold text-slate-900">2. Cadastro</h2>
      <p>
        Para contratar ou prestar serviços é necessário criar uma conta com dados verdadeiros. As profissionais
        passam por aprovação manual e envio de documento com foto antes de receberem ofertas.
      </p>

      <h2 className="mt-6 text-xl font-semibold text-slate-900">3. Pagamento e cancelamento</h2>
      <p>
        O valor do serviço é cobrado no momento do agendamento e fica retido até a conclusão. Cancelamentos
        feitos com pelo menos 24 horas de antecedência são reembolsados integralmente; após esse prazo não há
        reembolso.
      </p>

      <h2 className="mt-6 text-xl font-semibold text-slate-900">4. Responsabilidades</h2>
      <p>
        A profissional é responsável pela execução do serviço contratado. O cliente é responsável por fornecer
        acesso ao imóvel e informações corretas. Danos ou disputas devem ser comunicados pela plataforma.
      </p>

      <p className="mt-8 text-sm text-slate-500">Conteúdo provisório. Não constitui aconselhamento jurídico.</p>
    </article>
  );
}
