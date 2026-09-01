import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Seja profissional" };

export default function SejaProfissionalPage() {
  return (
    <article>
      <h1 className="text-3xl font-bold text-slate-900">Trabalhe como diarista na plataforma</h1>
      <p className="mt-4 text-slate-700">
        Você define onde atende, o que faz e quando está disponível. A plataforma leva os serviços até você,
        cuida do pagamento do cliente e faz o repasse após a conclusão.
      </p>

      <ul className="mt-6 space-y-2 text-slate-700">
        <li>• Cadastro com documento e foto — aprovação manual antes de aparecer para os clientes.</li>
        <li>• Você escolhe as regiões de Curitiba e RMC que quer atender.</li>
        <li>• Agenda com disponibilidade recorrente e bloqueios pontuais.</li>
        <li>• Receba ofertas e aceite só o que couber na sua rotina.</li>
      </ul>

      <div className="mt-8">
        <Link href="/cadastro?perfil=profissional" className={cn(buttonVariants({ size: "lg" }))}>
          Começar meu cadastro
        </Link>
      </div>

      <p className="mt-8 text-sm text-slate-500">
        Página informativa — o cadastro completo da profissional entra na próxima etapa do projeto.
      </p>
    </article>
  );
}
