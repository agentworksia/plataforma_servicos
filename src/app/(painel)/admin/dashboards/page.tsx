import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/dal";
import { montarPainel, ehDimensao, ehPeriodo, DIMENSOES, type LinhaDimensao } from "@/lib/admin/painel";
import { formatBRL, formatNota } from "@/lib/format";
import { EmptyState } from "@/components/ui/empty-state";
import { SeletorPainel } from "./seletor";

export const metadata: Metadata = { title: "Dashboards" };

export default async function AdminDashboardsPage({
  searchParams,
}: {
  searchParams: Promise<{ dimensao?: string; periodo?: string }>;
}) {
  await requireRole("ADMIN");
  const { dimensao: d, periodo: p } = await searchParams;
  const dimensao = ehDimensao(d) ? d : "servico";
  const periodo = ehPeriodo(p) ? p : "90d";

  const painel = await montarPainel(dimensao, periodo);
  const maior = Math.max(1, ...painel.linhas.map((l) => l.faturamento));
  const rotuloDimensao = DIMENSOES.find((x) => x.value === dimensao)!.label;

  return (
    <section className="space-y-8">
      <div>
        <h1 className="titulo text-2xl text-marinho-900">Dashboards</h1>
        <p className="mt-1 max-w-3xl text-areia-600">
          Entrada e saída de dinheiro e os indicadores de operação. Escolha por onde abrir os números.
        </p>
      </div>

      <SeletorPainel dimensao={dimensao} periodo={periodo} />

      {/* Financeiro: a margem é o número que importa, o resto apoia ------- */}
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr]">
        <div className="rounded-cartao border border-areia-200 bg-white p-6">
          <p className="text-sm text-areia-600">Ficou com a plataforma</p>
          <p className="numeros titulo mt-2 text-4xl text-marinho-900">{formatBRL(painel.margem)}</p>
          <p className="mt-2 text-xs leading-relaxed text-areia-500">
            Taxa sobre os {painel.servicosConcluidos} serviços concluídos no período. É a receita de verdade
            — o resto do dinheiro é da profissional.
          </p>
        </div>

        <div className="rounded-cartao border border-areia-200 bg-white p-6">
          <p className="text-sm text-areia-600">Entrou</p>
          <p className="numeros titulo-secao mt-2 text-2xl text-areia-900">{formatBRL(painel.entrada)}</p>
          <p className="mt-2 text-xs leading-relaxed text-areia-500">
            Pagamentos confirmados, já descontado o que foi reembolsado.
          </p>
        </div>

        <div className="rounded-cartao border border-areia-200 bg-white p-6">
          <p className="text-sm text-areia-600">Saiu em repasse</p>
          <p className="numeros titulo-secao mt-2 text-2xl text-areia-900">{formatBRL(painel.saida)}</p>
          <p className="mt-2 text-xs leading-relaxed text-areia-500">
            {painel.aRepassar > 0
              ? `Mais ${formatBRL(painel.aRepassar)} já são da profissional e aguardam pagamento.`
              : "Nenhum repasse pendente."}
          </p>
        </div>
      </div>

      {/* Operação --------------------------------------------------------- */}
      <div className="grid gap-px overflow-hidden rounded-cartao border border-areia-200 bg-areia-200 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador titulo="Ticket médio" valor={formatBRL(painel.ticketMedio)} />
        <Indicador
          titulo="Sem profissional"
          valor={String(painel.aguardandoProfissional)}
          nota={
            painel.aguardandoProfissional > 0
              ? "Demanda paga que ninguém aceitou ainda"
              : "Toda demanda foi atribuída"
          }
          alerta={painel.aguardandoProfissional > 0}
        />
        <Indicador
          titulo="Cancelamento"
          valor={`${painel.taxaCancelamento.toFixed(1).replace(".", ",")}%`}
          nota={`${painel.cancelados} de ${painel.cancelados + painel.linhas.reduce((s, l) => s + l.servicos, 0)}`}
        />
        <Indicador
          titulo="Avaliação média"
          valor={painel.notaMedia ? formatNota(painel.notaMedia) : "—"}
          nota={painel.totalAvaliacoes ? `${painel.totalAvaliacoes} avaliações` : "ainda sem avaliação"}
        />
      </div>

      {/* Faturamento por dimensão ----------------------------------------- */}
      <div className="rounded-cartao border border-areia-200 bg-white p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="titulo-secao text-lg text-areia-900">Faturamento por {rotuloDimensao.toLowerCase()}</h2>
          <p className="numeros text-sm text-areia-600">
            {formatBRL(painel.faturamentoContratado)} contratados
          </p>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-areia-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[2px] bg-[#1f6392]" aria-hidden="true" />
            Repasse à profissional
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[2px] bg-[#6e934c]" aria-hidden="true" />
            Taxa da plataforma
          </span>
        </div>

        {painel.linhas.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              titulo="Nenhum serviço nesse período"
              descricao="Amplie o período ou escolha outra forma de abrir os números."
            />
          </div>
        ) : (
          <ul className="mt-6 space-y-5">
            {painel.linhas.map((l) => (
              <Barra key={l.rotulo} linha={l} maior={maior} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Indicador({
  titulo,
  valor,
  nota,
  alerta,
}: {
  titulo: string;
  valor: string;
  nota?: string;
  alerta?: boolean;
}) {
  return (
    <div className="bg-white p-5">
      <p className="text-sm text-areia-600">{titulo}</p>
      <p className={`numeros titulo-secao mt-1.5 text-2xl ${alerta ? "text-red-700" : "text-areia-900"}`}>
        {valor}
      </p>
      {nota && <p className="mt-1 text-xs leading-relaxed text-areia-500">{nota}</p>}
    </div>
  );
}

function Barra({ linha, maior }: { linha: LinhaDimensao; maior: number }) {
  const largura = (linha.faturamento / maior) * 100;
  const fatiaRepasse = linha.faturamento ? (linha.repasse / linha.faturamento) * 100 : 0;

  return (
    <li>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 text-sm">
        <span className="font-medium text-areia-900">{linha.rotulo}</span>
        <span className="numeros text-areia-600">
          {formatBRL(linha.faturamento)}
          <span className="text-areia-400">
            {" · "}
            {linha.servicos} {linha.servicos === 1 ? "serviço" : "serviços"} · ticket{" "}
            {formatBRL(linha.ticket)}
          </span>
        </span>
      </div>

      {/* Duas fatias com 2px de respiro entre elas, para a divisão não virar uma emenda. */}
      <div className="mt-1.5 h-2.5 w-full">
        <div className="flex h-full gap-[2px]" style={{ width: `${largura}%` }}>
          <div
            className="h-full rounded-l-[4px] bg-[#1f6392]"
            style={{ width: `${fatiaRepasse}%` }}
            title={`Repasse: ${formatBRL(linha.repasse)}`}
          />
          <div
            className="h-full flex-1 rounded-r-[4px] bg-[#6e934c]"
            title={`Taxa da plataforma: ${formatBRL(linha.taxa)}`}
          />
        </div>
      </div>
    </li>
  );
}
