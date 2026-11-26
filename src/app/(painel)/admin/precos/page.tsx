import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { repassePctDaRegra } from "@/lib/pricing";
import { formatDuracao } from "@/lib/format";
import { getSettingNumber } from "@/lib/settings";
import { TIPOS_SERVICO } from "@/lib/validation/profissional";
import { COLUNAS } from "./grade";
import { LinhaPreco } from "./linha-preco";

export const metadata: Metadata = { title: "Preços" };

const LABEL = Object.fromEntries(TIPOS_SERVICO.map((t) => [t.value, t.label]));

export default async function AdminPrecosPage() {
  await requireRole("ADMIN");

  const regras = await db.pricingRule.findMany({
    include: { serviceArea: { select: { cidade: true, bairro: true, uf: true } } },
    orderBy: [
      { serviceArea: { uf: "asc" } },
      { serviceArea: { cidade: "asc" } },
      { tipoServico: "asc" },
      { duracaoMinutos: "asc" },
    ],
  });

  const taxaGlobalPct = await getSettingNumber("TAXA_PLATAFORMA_PCT", 15);
  const repassePadrao = await repassePctDaRegra(null);

  const porRegiao = new Map<string, { nome: string; uf: string; regras: typeof regras }>();
  for (const r of regras) {
    const nome = r.serviceArea.cidade + (r.serviceArea.bairro ? ` — ${r.serviceArea.bairro}` : "");
    if (!porRegiao.has(r.serviceAreaId)) {
      porRegiao.set(r.serviceAreaId, { nome, uf: r.serviceArea.uf, regras: [] });
    }
    porRegiao.get(r.serviceAreaId)!.regras.push(r);
  }
  const grupos = [...porRegiao.values()];

  return (
    <section>
      <h1 className="titulo text-2xl text-marinho-900">Tabela de preços</h1>
      <p className="mt-1 max-w-3xl text-areia-600">
        Preço e repasse por tipo × duração × cidade. O valor base já é o preço final que o
        cliente vê — o multiplicador fica em 1 e só serve para um ajuste pontual sem mexer na
        tabela.
      </p>
      <p className="mt-3 max-w-3xl rounded-botao border border-areia-200 bg-areia-50 p-3 text-sm leading-relaxed text-areia-700">
        <strong>Repasse</strong> é a fatia do total que vai para a profissional; o que sobra
        fica com a plataforma e aparece ao lado enquanto você digita. Deixar o campo vazio faz
        a linha seguir o padrão da plataforma, hoje{" "}
        <strong>{repassePadrao}% de repasse</strong> ({taxaGlobalPct}% de comissão). O valor
        salvo aqui é o que vale no pagamento e no split do serviço.
      </p>

      {ESTADOS.map(({ uf, nome }) => {
        const doEstado = grupos.filter((g) => g.uf === uf);
        if (doEstado.length === 0) return null;
        return (
          <div key={uf} className="mt-8">
            <h2 className="titulo-secao text-areia-800">{nome}</h2>
            <div className="mt-3 space-y-3">
              {doEstado.map((grupo) => (
                <details key={grupo.nome} className="rounded-xl border border-areia-200">
                  <summary className="cursor-pointer px-4 py-3 font-medium text-areia-800 hover:bg-areia-50">
                    {grupo.nome}
                  </summary>
                  <div className="overflow-x-auto border-t border-areia-200 p-4">
                    <div className="min-w-[52rem]">
                      <div className={`${COLUNAS} pb-1 text-xs font-medium uppercase tracking-wide text-areia-500`}>
                        <span>Serviço</span>
                        <span>Duração</span>
                        <span>Valor base (R$)</span>
                        <span>Multiplicador</span>
                        <span>Repasse (%)</span>
                        <span>Plataforma</span>
                        <span className="text-center">Ativo</span>
                        <span />
                      </div>

                      {grupo.regras.map((r) => (
                        <LinhaPreco
                          key={r.id}
                          id={r.id}
                          servico={LABEL[r.tipoServico] ?? r.tipoServico}
                          duracao={formatDuracao(r.duracaoMinutos)}
                          valorReais={(r.valorBase / 100).toFixed(2)}
                          multiplicador={Number(r.multiplicador).toString()}
                          repassePct={r.repassePct === null ? "" : String(Number(r.repassePct))}
                          repassePadrao={repassePadrao}
                          ativo={r.ativo}
                        />
                      ))}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

const ESTADOS = [
  { uf: "PR", nome: "Paraná — Curitiba e Região Metropolitana" },
  { uf: "SC", nome: "Santa Catarina — litoral" },
] as const;
