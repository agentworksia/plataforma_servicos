import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de Privacidade" };

export default function PrivacidadePage() {
  return (
    <article className="space-y-4 text-slate-700">
      <h1 className="text-3xl font-bold text-slate-900">Política de Privacidade</h1>
      <p className="text-sm text-slate-500">Última atualização: rascunho — a ser revisado antes do lançamento.</p>

      <h2 className="mt-6 text-xl font-semibold text-slate-900">Dados que coletamos</h2>
      <p>
        Nome, e-mail, telefone e endereço para a prestação do serviço. Das profissionais, também coletamos CPF,
        data de nascimento, foto de perfil, documento com foto e dados de repasse (chave Pix).
      </p>

      <h2 className="mt-6 text-xl font-semibold text-slate-900">Como usamos</h2>
      <p>
        Para intermediar os agendamentos, processar pagamentos e repasses, fazer o matching entre cliente e
        profissional e cumprir obrigações legais e fiscais.
      </p>

      <h2 className="mt-6 text-xl font-semibold text-slate-900">Documentos e acesso</h2>
      <p>
        Os documentos enviados pelas profissionais são armazenados de forma privada e acessados apenas pela
        equipe de aprovação, por meio de links temporários. O envio depende de consentimento explícito no
        cadastro (LGPD).
      </p>

      <h2 className="mt-6 text-xl font-semibold text-slate-900">Seus direitos</h2>
      <p>
        Você pode solicitar acesso, correção ou exclusão dos seus dados pelos canais de contato da plataforma,
        ressalvadas as informações que precisamos manter por obrigação legal.
      </p>

      <p className="mt-8 text-sm text-slate-500">Conteúdo provisório.</p>
    </article>
  );
}
