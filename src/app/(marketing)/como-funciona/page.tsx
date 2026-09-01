import type { Metadata } from "next";

export const metadata: Metadata = { title: "Como funciona" };

export default function ComoFuncionaPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1 className="text-3xl font-bold text-slate-900">Como funciona</h1>

      <h2 className="mt-8 text-xl font-semibold text-slate-900">Para quem contrata</h2>
      <p className="mt-2 text-slate-700">
        Você escolhe o tipo de serviço, informa o endereço (atendemos Curitiba e Região Metropolitana),
        define data, horário, duração (4, 6 ou 8 horas) e a recorrência. O preço aparece na hora, calculado
        por tabela. O pagamento é feito online e fica retido até a conclusão do serviço.
      </p>
      <p className="mt-2 text-slate-700">
        A plataforma atribui automaticamente uma profissional verificada — você não precisa procurar nem
        negociar. Ao final, você avalia o serviço, e é isso que libera o repasse para a profissional.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-slate-900">Para quem trabalha</h2>
      <p className="mt-2 text-slate-700">
        A diarista se cadastra, envia documento com foto, define as regiões que atende, os tipos de serviço
        e a disponibilidade na agenda. O cadastro passa por aprovação manual. Depois de aprovada, ela recebe
        ofertas de serviço e aceita ou recusa cada uma dentro de um prazo.
      </p>

      <p className="mt-8 text-sm text-slate-500">
        Página informativa — o conteúdo final será revisado com o cliente.
      </p>
    </article>
  );
}
