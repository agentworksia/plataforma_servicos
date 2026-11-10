import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SeletorPreco } from "@/components/seletor-preco";
import { MarcaAnimada } from "@/components/marca-animada";
import { buttonVariants } from "@/components/ui/button";
import { SERVICOS } from "@/lib/servicos";
import {
  ACRESCIMO_FIM_DE_SEMANA,
  duracoesDisponiveis,
  precoDeTabela,
  precoMinimo,
} from "@/lib/pricing/tabela";
import { formatBRLRedondo, formatDuracao } from "@/lib/format";
import { CIDADES_SC } from "@/lib/regioes";
import { cn } from "@/lib/utils";

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

// A tabela por hora não comporta o passeio com cão, que é vendido por passeio e tem
// regra de fim de semana. Ele ganha um bloco próprio logo abaixo dela.
const SERVICOS_POR_HORA = SERVICOS.filter((s) => s.tipo !== "DOG_WALKER");
const DURACOES_POR_HORA = duracoesDisponiveis("DIARIA_PADRAO");
const ACRESCIMO_PASSEIO = ACRESCIMO_FIM_DE_SEMANA.DOG_WALKER ?? 0;

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        {/* Capa: bloco navy da marca. Texto e símbolo em colunas separadas, para o
            desenho nunca invadir o título — foi o que quebrou na primeira montagem. */}
        <section className="bg-marinho-800">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-[1.15fr_.85fr] lg:gap-14 lg:py-24">
            <div>
              <h1 className="titulo entra max-w-xl text-4xl text-white sm:text-5xl lg:text-6xl">
                Você abre a porta. A gente responde por quem entra.
              </h1>
              <p
                className="entra mt-6 max-w-lg text-lg leading-relaxed text-marinho-100"
                style={{ animationDelay: "90ms" }}
              >
                Diaristas com documento conferido e avaliação de quem já contratou, em Curitiba, na Região
                Metropolitana e no litoral de Santa Catarina. Você agenda pelo site e acompanha até o
                serviço terminar.
              </p>

              <div className="entra mt-8 max-w-md" style={{ animationDelay: "180ms" }}>
                <SeletorPreco />
              </div>
            </div>

            {/* No celular a marca abre a página, pequena, acima do título; no desktop
                ocupa a coluna da direita dentro do painel. */}
            <div className="entra-foto order-first mx-auto w-40 rounded-foto lg:order-none lg:mx-0 lg:w-auto lg:bg-marinho-900/40 lg:p-10">
              <MarcaAnimada className="mx-auto w-full max-w-sm" />
            </div>
          </div>
        </section>

        {/* Serviços --------------------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="titulo-secao max-w-lg text-3xl text-marinho-900">
            Cinco serviços, com preço fechado antes de você confirmar
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-areia-600">
            Clique no serviço para agendar já com ele escolhido. Os valores abaixo são os de Curitiba.
          </p>

          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {SERVICOS.map((s) => (
              <li key={s.tipo}>
                <Link
                  href={`/agendar?tipo=${s.tipo}`}
                  className="group flex h-full flex-col overflow-hidden rounded-cartao border border-areia-200 bg-white transition-colors hover:border-marinho-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marinho-600 focus-visible:ring-offset-2"
                >
                  <Image
                    src={s.foto}
                    alt=""
                    width={800}
                    height={600}
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="titulo-secao text-lg text-areia-900 group-hover:text-marinho-700">
                      {s.nome}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-areia-600">{s.desc}</p>
                    <p className="mt-auto pt-4 text-sm text-marinho-600">
                      a partir de{" "}
                      <span className="numeros titulo-secao text-lg text-marinho-800">
                        {formatBRLRedondo(precoMinimo(s.tipo))}
                      </span>
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Como funciona ---------------------------------------------------- */}
        <section className="bg-marinho-900 text-areia-100">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="titulo-secao max-w-lg text-3xl text-white">Do pedido ao repasse</h2>
            <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {PASSOS.map((p, i) => (
                <li key={p.titulo} className="border-t border-marinho-700 pt-5">
                  <span className="numeros titulo block text-3xl text-laranja-400">{i + 1}</span>
                  <h3 className="titulo-secao mt-3 text-lg text-white">{p.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-marinho-200">{p.texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Preços ----------------------------------------------------------- */}
        <section id="precos" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
          <h2 className="titulo-secao max-w-lg text-3xl text-marinho-900">A tabela inteira, aqui</h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-areia-600">
            Valores de Curitiba e Região Metropolitana. É o valor final: não há taxa de visita nem
            acréscimo depois. No litoral de Santa Catarina a tabela é 25% maior, e aparece já ajustada
            quando você informa o endereço.
          </p>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-lg border-collapse text-left">
              <thead>
                <tr className="border-b border-areia-300">
                  <th className="py-3 pr-4 text-sm font-medium text-areia-600">Serviço</th>
                  {DURACOES_POR_HORA.map((h) => (
                    <th key={h} className="py-3 pr-4 text-sm font-medium text-areia-600">
                      {formatDuracao(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SERVICOS_POR_HORA.map((s) => (
                  <tr key={s.tipo} className="border-b border-areia-200">
                    <th scope="row" className="py-4 pr-4 font-medium text-areia-900">
                      {s.nome}
                    </th>
                    {DURACOES_POR_HORA.map((h) => {
                      const valor = precoDeTabela(s.tipo, h);
                      return (
                        <td key={h} className="numeros py-4 pr-4 text-marinho-800">
                          {valor === null ? (
                            <span className="text-areia-500">sob orçamento</span>
                          ) : (
                            formatBRLRedondo(valor)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-areia-500">
            Pós-obra acima de seis horas quase sempre pede equipe, então sai da tabela e passa por
            orçamento — a plataforma avisa antes de cobrar qualquer coisa.
          </p>

          <div className="mt-10 grid gap-6 rounded-cartao border border-areia-200 bg-white p-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <h3 className="titulo-secao text-xl text-marinho-900">Passeio com o cão</h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-areia-600">
                O dog walker é cobrado por passeio, não por hora. No sábado e no domingo o valor sobe{" "}
                {Math.round(ACRESCIMO_PASSEIO * 100)}% — e já aparece ajustado assim que você escolhe a
                data.
              </p>
            </div>
            <ul className="flex gap-3">
              {duracoesDisponiveis("DOG_WALKER").map((d) => {
                const dia = precoDeTabela("DOG_WALKER", d)!;
                return (
                  <li
                    key={d}
                    className="min-w-28 rounded-botao border border-areia-200 px-4 py-3 text-center"
                  >
                    <span className="block text-xs text-areia-600">{formatDuracao(d)}</span>
                    <span className="numeros titulo-secao mt-0.5 block text-xl text-marinho-800">
                      {formatBRLRedondo(dia)}
                    </span>
                    <span className="numeros mt-1 block text-xs text-areia-500">
                      fim de semana {formatBRLRedondo(Math.round(dia * (1 + ACRESCIMO_PASSEIO)))}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Onde atendemos --------------------------------------------------- */}
        <section className="border-y border-areia-200 bg-white">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-[1fr_.8fr]">
            <div>
              <h2 className="titulo-secao text-3xl text-marinho-900">Agora também no litoral</h2>
              <p className="mt-3 max-w-2xl leading-relaxed text-areia-600">
                Além de Curitiba e das onze cidades da Região Metropolitana, atendemos a faixa litorânea de
                Santa Catarina — de Itapoá a Florianópolis. Imóvel de temporada entra na mesma regra: você
                agenda à distância, deixa a chave combinada e acompanha pelo site.
              </p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {CIDADES_SC.map((c) => (
                  <li
                    key={c}
                    className="rounded-full border border-marinho-200 bg-marinho-50 px-3 py-1 text-sm text-marinho-800"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            <div className="overflow-hidden rounded-foto bg-areia-200">
              <Image
                src="/fotos/litoral.jpg"
                alt="Chaves etiquetadas na entrada de um apartamento de praia, com vista para o mar"
                width={900}
                height={1118}
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Segurança -------------------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="overflow-hidden rounded-foto bg-areia-200">
              <Image
                src="/fotos/confianca.jpg"
                alt="Sala arrumada, com poltrona azul e luz entrando pela janela"
                width={900}
                height={1118}
                className="aspect-[4/5] w-full object-cover"
              />
            </div>

            <div>
              <h2 className="titulo-secao text-3xl text-marinho-900">Por que dá para confiar em quem chega</h2>
              <dl className="mt-8 space-y-7">
                {GARANTIAS.map((g) => (
                  <div key={g.titulo} className="border-l-2 border-marinho-600 pl-5">
                    <dt className="titulo-secao text-areia-900">{g.titulo}</dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-areia-600">{g.texto}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* Para profissionais ------------------------------------------------ */}
        <section className="border-t border-areia-200 bg-white">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-[.9fr_1.1fr]">
            <div>
              <h2 className="titulo-secao text-3xl text-marinho-900">
                Trabalha como diarista? Escolha seus dias.
              </h2>
              <p className="mt-4 max-w-md leading-relaxed text-areia-700">
                Você marca na agenda os dias e horários em que quer trabalhar, e recebe ofertas só dentro
                disso. Aceita ou recusa cada uma. O repasse sai depois de cada serviço concluído, sem você
                precisar cobrar ninguém.
              </p>
              <Link href="/cadastro/profissional" className={cn(buttonVariants({ size: "lg" }), "mt-7")}>
                Quero me cadastrar
              </Link>
            </div>

            <div className="overflow-hidden rounded-foto bg-areia-200">
              <Image
                src="/fotos/profissional.jpg"
                alt="Quarto arrumado, com vista para as araucárias de Curitiba"
                width={1100}
                height={614}
                className="aspect-[16/9] w-full object-cover"
              />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
