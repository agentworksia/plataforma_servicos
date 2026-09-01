import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { CIDADES_ATENDIDAS } from "@/lib/regioes";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Agendar um serviço" };

export default function AgendarPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <h1 className="text-3xl font-bold text-slate-900">Agendar um serviço</h1>
        <p className="mt-4 text-slate-700">
          O fluxo de agendamento (escolha do serviço, validação de CEP, data e horário, duração de 4/6/8
          horas, recorrência, cálculo de preço e pagamento) entra na próxima etapa. É preciso ter uma conta
          para agendar.
        </p>

        <p className="mt-6 text-sm font-medium text-slate-800">Áreas atendidas no lançamento:</p>
        <p className="mt-1 text-sm text-slate-600">{CIDADES_ATENDIDAS.join(" · ")}</p>

        <div className="mt-8 flex gap-3">
          <Link href="/cadastro" className={cn(buttonVariants())}>
            Criar conta
          </Link>
          <Link href="/login" className={cn(buttonVariants({ variant: "outline" }))}>
            Já tenho conta
          </Link>
        </div>
      </main>
    </>
  );
}
