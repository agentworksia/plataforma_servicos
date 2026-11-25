import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { PLANOS } from "@/lib/assinaturas/planos";
import { formatBRL } from "@/lib/format";
import { getSettingNumber } from "@/lib/settings";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Seja profissional" };

export default async function SejaProfissionalPage() {
  const taxaPct = await getSettingNumber("TAXA_PLATAFORMA_PCT", 15);

  return (
    <article>
      <h1 className="titulo text-3xl text-marinho-900">Trabalhe como diarista na plataforma</h1>
      <p className="mt-4 text-areia-700">
        Você define onde atende, o que faz e quando está disponível. A plataforma leva os serviços até você,
        cuida do pagamento do cliente e faz o repasse após a conclusão.
      </p>

      <ul className="mt-6 space-y-2 text-areia-700">
        <li>• Cadastro com documento e foto — aprovação manual antes de aparecer para os clientes.</li>
        <li>• Você escolhe as cidades que quer atender, no Paraná ou no litoral de Santa Catarina.</li>
        <li>• Agenda com disponibilidade recorrente e bloqueios pontuais.</li>
        <li>• Receba ofertas e aceite só o que couber na sua rotina.</li>
      </ul>

      {/* O preço aparece antes do cadastro de propósito: ela manda documento e foto para
          entrar, e descobrir a mensalidade só depois da aprovação seria pegadinha. */}
      <section className="mt-8 rounded-cartao border border-areia-200 bg-white p-5 sm:p-6">
        <h2 className="titulo-secao text-lg text-marinho-900">Quanto custa para você</h2>
        <p className="mt-2 leading-relaxed text-areia-700">
          O cadastro é gratuito. Para receber ofertas, o perfil precisa de uma mensalidade de{" "}
          <strong>{formatBRL(PLANOS.MENSAL.valorCentavos)} por mês</strong>, que você cancela
          quando quiser — ou <strong>{formatBRL(PLANOS.ANUAL.valorCentavos)} por mês</strong> no
          plano anual, em 12 parcelas no cartão de crédito.
        </p>
        <p className="mt-3 leading-relaxed text-areia-700">
          Além dela, a plataforma fica com {taxaPct}% de cada serviço. O resto é seu e cai na sua
          conta quando a cliente paga.
        </p>
      </section>

      <div className="mt-8">
        <Link href="/cadastro/profissional" className={cn(buttonVariants({ size: "lg" }))}>
          Começar meu cadastro
        </Link>
      </div>
    </article>
  );
}
