import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, painelHref } from "@/lib/auth/dal";
import { AuthCard } from "@/components/auth-card";
import { PLANOS } from "@/lib/assinaturas/planos";
import { formatBRL } from "@/lib/format";

export const metadata: Metadata = { title: "Criar conta" };

/**
 * Tela de escolha, e não o formulário de cliente direto. Antes, "Criar conta" no login
 * caía no cadastro de cliente sem perguntar nada, e quem queria trabalhar como diarista
 * preenchia a conta errada sem perceber — o caminho da profissional era um link de rodapé.
 */
export default async function CadastroPage() {
  const session = await getSession();
  if (session?.user) redirect(painelHref(session.user.role));

  return (
    <AuthCard className="max-w-xl">
      <h1 className="titulo-secao text-xl text-areia-900">Criar conta</h1>
      <p className="mt-1 text-sm text-areia-600">
        São dois cadastros diferentes. Escolha o seu para não precisar refazer depois.
      </p>

      <div className="mt-6 grid gap-4">
        <Opcao
          href="/cadastro/cliente"
          titulo="Quero contratar uma limpeza"
          papel="Sou cliente"
          itens={[
            "Agendar diarista para minha casa ou empresa",
            "Pagar só o serviço que eu agendar — sem mensalidade",
            "Cadastro rápido: nome, e-mail, telefone e senha",
          ]}
        />

        <Opcao
          href="/cadastro/profissional"
          titulo="Quero trabalhar como diarista"
          papel="Sou profissional"
          itens={[
            "Receber ofertas de serviço e montar minha agenda",
            `Mensalidade de ${formatBRL(PLANOS.MENSAL.valorCentavos)}/mês depois de aprovada`,
            "Cadastro com documento com foto e aprovação manual",
          ]}
        />
      </div>

      <p className="mt-6 text-sm text-areia-600">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-marinho-700 hover:underline">
          Entrar
        </Link>
      </p>
    </AuthCard>
  );
}

function Opcao({
  href,
  titulo,
  papel,
  itens,
}: {
  href: string;
  titulo: string;
  papel: string;
  itens: string[];
}) {
  return (
    <Link
      href={href}
      className="group block rounded-cartao border border-areia-200 bg-white p-5 transition-colors hover:border-marinho-600 hover:bg-marinho-50 focus-visible:border-marinho-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marinho-600/25"
    >
      <span className="text-xs font-medium uppercase tracking-wide text-areia-500">{papel}</span>
      <span className="titulo-secao mt-1 block text-lg text-marinho-900">{titulo}</span>
      <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-areia-600">
        {itens.map((i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden className="text-marinho-400">
              •
            </span>
            {i}
          </li>
        ))}
      </ul>
      <span className="mt-4 inline-block text-sm font-medium text-marinho-700 group-hover:underline">
        Continuar →
      </span>
    </Link>
  );
}
