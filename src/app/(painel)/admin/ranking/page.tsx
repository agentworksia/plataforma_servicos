import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { rankingProfissionais, EXPLICACAO_PESOS } from "@/lib/ranking";
import { STATUS_PROFISSIONAL } from "@/lib/professionals";
import { formatNota } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Ranking" };

export default async function AdminRankingPage() {
  await requireRole("ADMIN");
  const linhas = await rankingProfissionais();

  return (
    <section>
      <h1 className="titulo text-2xl text-pinho-900">Ranking das profissionais</h1>
      <p className="mt-2 max-w-3xl leading-relaxed text-pedra-600">
        Define a ordem em que as ofertas são enviadas. A pontuação é calculada na hora da leitura e não
        aparece para a cliente nem para a profissional — cada uma vê apenas a própria média de avaliação.
      </p>

      <div className="mt-5 rounded-cartao border border-pedra-200 bg-white p-5">
        <p className="text-sm font-medium text-pedra-800">Como os 100 pontos são divididos</p>
        <ul className="mt-3 grid gap-2 text-sm text-pedra-600 sm:grid-cols-2 lg:grid-cols-4">
          {EXPLICACAO_PESOS.map((p) => (
            <li key={p.nome} className="flex items-baseline gap-2">
              <span className="numeros titulo-secao text-pinho-800">{p.peso}</span>
              <span>{p.nome}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-pedra-500">
          Quem ainda não foi avaliada entra com nota neutra 4,0, para não ficar presa no fim da fila. Uma
          cliente que pede uma profissional específica passa na frente do ranking, desde que ela esteja
          disponível no horário.
        </p>
      </div>

      <div className="mt-6 overflow-x-auto">
        {linhas.length === 0 ? (
          <EmptyState
            titulo="Nenhuma profissional cadastrada ainda"
            descricao="Assim que a primeira diarista se cadastrar, a pontuação dela aparece aqui."
          />
        ) : (
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-pedra-200 text-left text-pedra-500">
                <th className="py-2 pr-3 font-medium">#</th>
                <th className="py-2 pr-4 font-medium">Profissional</th>
                <th className="py-2 pr-4 font-medium">Pontos</th>
                <th className="py-2 pr-4 font-medium">Prioridade</th>
                <th className="py-2 pr-4 font-medium">Avaliação</th>
                <th className="py-2 pr-4 font-medium">Concluídos</th>
                <th className="py-2 pr-4 font-medium">Aceite</th>
                <th className="py-2 pr-4 font-medium">Cancelou</th>
                <th className="py-2 pr-4 font-medium">Conta</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {linhas.map((l, i) => {
                const m = l.metricas;
                const aceite =
                  m.ofertasRespondidas > 0
                    ? `${Math.round((m.ofertasAceitas / m.ofertasRespondidas) * 100)}%`
                    : "—";
                const st = STATUS_PROFISSIONAL[l.status];
                return (
                  <tr key={l.id} className="border-b border-pedra-100">
                    <td className="numeros py-3 pr-3 text-pedra-400">{i + 1}</td>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-pedra-900">{l.nome}</div>
                      <div className="text-pedra-500">{l.email}</div>
                    </td>
                    <td className="numeros py-3 pr-4 font-medium text-pinho-800">
                      {formatNota(l.pontuacao.total)}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge cor={l.faixa.cor}>{l.faixa.nome}</Badge>
                    </td>
                    <td className="numeros py-3 pr-4 text-pedra-600">
                      {m.mediaNota
                        ? `${formatNota(m.mediaNota)} (${m.totalAvaliacoes})`
                        : "sem avaliação"}
                    </td>
                    <td className="numeros py-3 pr-4 text-pedra-600">{m.servicosConcluidos}</td>
                    <td className="numeros py-3 pr-4 text-pedra-600">{aceite}</td>
                    <td className="numeros py-3 pr-4 text-pedra-600">{m.cancelamentosProprios}</td>
                    <td className="py-3 pr-4">
                      <Badge cor={st.cor}>{st.label}</Badge>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/admin/profissionais/${l.id}`}
                        className="font-medium text-pinho-700 hover:underline"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
