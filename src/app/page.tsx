import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SeletorPreco } from "@/components/seletor-preco";
import { buttonVariants } from "@/components/ui/button";
import { DURACOES, precoDeTabela } from "@/lib/pricing/tabela";
import { formatBRLRedondo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ServiceType } from "@/generated/prisma/enums";

const SERVICOS: Array<{ tipo: ServiceType; nome: string; foto: string; desc: string }> = [
  {
    tipo: "DIARIA_PADRAO",
    nome: "Diária padrão",
    foto: "/fotos/diaria-padrao.jpg",
    desc: "A limpeza da casa inteira: cozinha, banheiros, quartos e áreas comuns, na ordem que você combinar.",
  },
  {
    tipo: "PASSADORIA",
    nome: "Passadoria",
    foto: "/fotos/passadoria.jpg",
    desc: "Só a roupa. A profissional passa o que estiver acumulado dentro das horas contratadas.",
  },
  {
    tipo: "POS_OBRA",
    nome: "Pós-obra",
    foto: "/fotos/pos-obra.jpg",
    desc: "Limpeza pesada depois da reforma: respingo de tinta, resto de cimento e a poeira fina que fica no ar.",
  },
  {
    tipo: "CORPORATIVA",
    nome: "Corporativa",
    foto: "/fotos/corporativa.jpg",
    desc: "Escritórios, consultórios e órgãos públicos, com nota fiscal e dados de faturamento no cadastro.",
  },
];

const PASSOS = [
  {
    titulo: "Diga o que você precisa",
    texto: "Tipo de serviço, endereço, data, horário e duração. Leva menos de dois minutos.",
  },
  {
    titulo: "Veja o preço e pague",
    texto: "O valor vem da tabela e aparece antes de confirmar. Sem visita, sem orçamento. Pix ou cartão.",
  },
  {
    titulo: "A plataforma chama a profissional",
    texto:
      "Entre as aprovadas que atendem sua região naquele horário. Se você já tem uma preferida, ela é chamada primeiro.",
  },
  {
    titulo: "Você avalia no final",
    texto: "A avaliação libera o repasse e conta para quem é chamada primeiro nos próximos serviços.",
  },
];

const GARANTIAS = [
  {
    titulo: "Cadastro conferido por uma pessoa",
    texto:
      "Toda profissional envia documento com foto e comprovante de endereço. A conta só é liberada depois que alguém da equipe confere — não é aprovação automática.",
  },
  {
    titulo: "O dinheiro fica com a plataforma",
    texto:
      "Você paga ao agendar, mas o valor fica retido. Ele só é repassado à profissional depois que o serviço é concluído.",
  },
  {
    titulo: "Cancelamento sem custo até 24 h antes",
    texto: "Mudou o plano? Cancelando com um dia de antecedência, o valor volta integralmente para você.",
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        {/* Capa ------------------------------------------------------------- */}
        <section className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-14 lg:py-20">
          <div>
            <h1 className="titulo entra max-w-xl text-4xl text-pinho-900 sm:text-5xl lg:text-6xl">
              Você abre a porta. A gente responde por quem entra.
            </h1>
            <p
              className="entra mt-6 max-w-lg text-lg leading-relaxed text-pedra-700"
              style={{ animationDelay: "90ms" }}
            >
              Diaristas com documento conferido e avaliação de quem já contratou, em Curitiba e mais onze
              cidades da região. Você agenda pelo site e acompanha até o serviço terminar.
            </p>

            <div className="entra mt-8 max-w-md" style={{ animationDelay: "180ms" }}>
              <SeletorPreco />
            </div>
          </div>

          <div className="entra-foto overflow-hidden rounded-foto bg-pedra-200">
            <Image
              src="/fotos/casa-limpa.jpg"
              alt="Sala de estar arrumada, com luz natural entrando pela cortina"
              width={900}
              height={1125}
              priority
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
        </section>

        {/* Serviços --------------------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="titulo-secao max-w-lg text-3xl text-pinho-900">
            Quatro serviços, todos cobrados por hora
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-pedra-600">
            Você escolhe quantas horas quer. O valor abaixo é o de quatro horas em Curitiba.
          </p>

          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICOS.map((s) => (
              <li
                key={s.tipo}
                className="flex flex-col overflow-hidden rounded-cartao border border-pedra-200 bg-white"
              >
                <Image
                  src={s.foto}
                  alt=""
                  width={800}
                  height={600}
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="titulo-secao text-lg text-pedra-900">{s.nome}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-pedra-600">{s.desc}</p>
                  <p className="mt-auto pt-4 text-sm text-pinho-700">
                    a partir de{" "}
                    <span className="numeros titulo-secao text-lg text-pinho-800">
                      {formatBRLRedondo(precoDeTabela(s.tipo, 4))}
                    </span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Como funciona ---------------------------------------------------- */}
        <section className="bg-pinho-900 text-pedra-100">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="titulo-secao max-w-lg text-3xl text-white">Do pedido ao repasse</h2>
            <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {PASSOS.map((p, i) => (
                <li key={p.titulo} className="border-t border-pinho-700 pt-5">
                  <span className="numeros titulo block text-3xl text-mel-400">{i + 1}</span>
                  <h3 className="titulo-secao mt-3 text-lg text-white">{p.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-pinho-200">{p.texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Preços ----------------------------------------------------------- */}
        <section id="precos" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
          <h2 className="titulo-secao max-w-lg text-3xl text-pinho-900">A tabela inteira, aqui</h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-pedra-600">
            Mesmo preço em Curitiba e nas onze cidades da Região Metropolitana que atendemos. É o valor
            final: não há taxa de visita nem acréscimo depois.
          </p>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-lg border-collapse text-left">
              <thead>
                <tr className="border-b border-pedra-300">
                  <th className="py-3 pr-4 text-sm font-medium text-pedra-600">Serviço</th>
                  {DURACOES.map((h) => (
                    <th key={h} className="py-3 pr-4 text-sm font-medium text-pedra-600">
                      {h} horas
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SERVICOS.map((s) => (
                  <tr key={s.tipo} className="border-b border-pedra-200">
                    <th scope="row" className="py-4 pr-4 font-medium text-pedra-900">
                      {s.nome}
                    </th>
                    {DURACOES.map((h) => (
                      <td key={h} className="numeros py-4 pr-4 text-pinho-800">
                        {formatBRLRedondo(precoDeTabela(s.tipo, h))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-pedra-500">
            Pós-obra em imóvel grande pode exigir equipe e passa por orçamento — a plataforma avisa antes de
            cobrar qualquer coisa.
          </p>
        </section>

        {/* Segurança -------------------------------------------------------- */}
        <section className="border-y border-pedra-200 bg-white">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-2">
            <div className="overflow-hidden rounded-foto bg-pedra-200">
              <Image
                src="/fotos/cozinha.jpg"
                alt="Cozinha organizada, com bancada limpa e plantas na janela"
                width={1000}
                height={667}
                className="aspect-[3/2] w-full object-cover"
              />
            </div>

            <div>
              <h2 className="titulo-secao text-3xl text-pinho-900">Por que dá para confiar em quem chega</h2>
              <dl className="mt-8 space-y-7">
                {GARANTIAS.map((g) => (
                  <div key={g.titulo} className="border-l-2 border-pinho-600 pl-5">
                    <dt className="titulo-secao text-pedra-900">{g.titulo}</dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-pedra-600">{g.texto}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* Para profissionais ------------------------------------------------ */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
            <div>
              <h2 className="titulo-secao text-3xl text-pinho-900">
                Trabalha como diarista? Escolha seus dias.
              </h2>
              <p className="mt-4 max-w-md leading-relaxed text-pedra-700">
                Você marca na agenda os dias e horários em que quer trabalhar, e recebe ofertas só dentro
                disso. Aceita ou recusa cada uma. O repasse sai depois de cada serviço concluído, sem você
                precisar cobrar ninguém.
              </p>
              <Link href="/cadastro/profissional" className={cn(buttonVariants({ size: "lg" }), "mt-7")}>
                Quero me cadastrar
              </Link>
            </div>

            <div className="overflow-hidden rounded-foto bg-pedra-200">
              <Image
                src="/fotos/profissional.jpg"
                alt="Profissional limpando a janela de uma sala, em dia claro"
                width={1000}
                height={667}
                className="aspect-[3/2] w-full object-cover"
              />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
