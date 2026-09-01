import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SERVICOS = [
  { titulo: "Diária de limpeza padrão", desc: "Limpeza residencial completa em turnos de 4, 6 ou 8 horas." },
  { titulo: "Passadoria", desc: "Só a roupa passada, no tempo que você precisar — 4, 6 ou 8 horas." },
  { titulo: "Limpeza pós-obra", desc: "Limpeza técnica pesada após reforma ou construção, com equipe preparada." },
  { titulo: "Corporativa / governamental", desc: "Atendimento a empresas e órgãos públicos com nota fiscal e dados de faturamento." },
];

const PASSOS = [
  "Escolha o tipo de serviço e informe o endereço.",
  "Selecione data, horário, duração e a recorrência (avulsa, semanal, quinzenal ou mensal).",
  "Veja o preço na hora e pague com Pix ou cartão.",
  "A plataforma atribui uma profissional verificada e você acompanha o status até a conclusão.",
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-20 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Curitiba e Região Metropolitana
          </p>
          <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Diaristas verificadas para a sua casa ou empresa
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            Agende limpeza residencial, passadoria, pós-obra ou serviço corporativo. A plataforma cuida do
            pagamento e do repasse; você só avalia no final.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/agendar" className={cn(buttonVariants({ size: "lg" }))}>
              Agendar um serviço
            </Link>
            <Link href="/seja-profissional" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              Quero trabalhar como diarista
            </Link>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-2xl font-bold text-slate-900">Tipos de serviço</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {SERVICOS.map((s) => (
                <Card key={s.titulo}>
                  <CardTitle>{s.titulo}</CardTitle>
                  <CardDescription>{s.desc}</CardDescription>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold text-slate-900">Como funciona</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2">
            {PASSOS.map((p, i) => (
              <li key={p} className="flex gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <p className="text-slate-700">{p}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-8 text-sm text-slate-500">
          <span>© {new Date().getFullYear()} Plataforma de Limpeza · Curitiba e RMC</span>
          <span className="flex gap-4">
            <Link href="/termos" className="hover:text-slate-700">
              Termos
            </Link>
            <Link href="/privacidade" className="hover:text-slate-700">
              Privacidade
            </Link>
          </span>
        </div>
      </footer>
    </>
  );
}
