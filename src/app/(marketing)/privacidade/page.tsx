import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de Privacidade" };

export default function PrivacidadePage() {
  return (
    <article className="space-y-4 text-areia-700">
      <h1 className="titulo text-3xl text-marinho-900">Política de Privacidade</h1>
      <p className="text-sm text-areia-500">Última atualização: rascunho — a ser revisado antes do lançamento.</p>

      <h2 className="mt-6 titulo-secao text-xl text-areia-900">Dados que coletamos</h2>
      <p>
        Nome, e-mail, telefone e endereço para a prestação do serviço. Das profissionais, também coletamos CPF,
        data de nascimento, foto de perfil, documento com foto, endereço residencial, renda mensal aproximada
        e dados de repasse (chave Pix). O endereço e a renda são exigidos pela instituição de pagamento para
        abrir a conta em nome da profissional, que é para onde o valor do serviço é creditado.
      </p>

      <h2 className="mt-6 titulo-secao text-xl text-areia-900">Com quem compartilhamos</h2>
      <p>
        A plataforma não vende dados. Compartilhamos o mínimo necessário com fornecedores que operam a
        infraestrutura, todos atuando como operadores de dados: a instituição de pagamento (dados de
        identificação e endereço, para emitir cobranças e abrir a conta de recebimento), o provedor de
        hospedagem e banco de dados, e o provedor de e-mail transacional. Dados de cartão de crédito não
        passam pelos nossos servidores: o pagamento com cartão acontece em ambiente da própria instituição
        de pagamento.
      </p>

      <h2 className="mt-6 titulo-secao text-xl text-areia-900">Como usamos</h2>
      <p>
        Para intermediar os agendamentos, processar pagamentos e repasses, fazer o matching entre cliente e
        profissional e cumprir obrigações legais e fiscais.
      </p>

      <h2 className="mt-6 titulo-secao text-xl text-areia-900">Documentos e acesso</h2>
      <p>
        Os documentos enviados pelas profissionais são armazenados de forma privada e acessados apenas pela
        equipe de aprovação, por meio de links temporários. O envio depende de consentimento explícito no
        cadastro (LGPD).
      </p>

      <h2 className="mt-6 titulo-secao text-xl text-areia-900">Seus direitos</h2>
      <p>
        Você pode solicitar acesso, correção ou exclusão dos seus dados pelos canais de contato da plataforma,
        ressalvadas as informações que precisamos manter por obrigação legal.
      </p>

      <p className="mt-8 text-sm text-areia-500">Conteúdo provisório.</p>
    </article>
  );
}
