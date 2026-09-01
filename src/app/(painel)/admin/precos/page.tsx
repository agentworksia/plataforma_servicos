import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { atualizarPreco } from "@/lib/admin/config-actions";
import { ActionForm } from "@/components/action-form";
import { Input } from "@/components/ui/input";
import { TIPOS_SERVICO } from "@/lib/validation/profissional";

export const metadata: Metadata = { title: "Preços" };

const LABEL = Object.fromEntries(TIPOS_SERVICO.map((t) => [t.value, t.label]));

export default async function AdminPrecosPage() {
  await requireRole("ADMIN");
  const regras = await db.pricingRule.findMany({
    include: { serviceArea: { select: { cidade: true, bairro: true } } },
    orderBy: [{ serviceArea: { cidade: "asc" } }, { tipoServico: "asc" }, { duracaoHoras: "asc" }],
  });

  const porRegiao = new Map<string, { nome: string; regras: typeof regras }>();
  for (const r of regras) {
    const nome = r.serviceArea.cidade + (r.serviceArea.bairro ? ` — ${r.serviceArea.bairro}` : "");
    if (!porRegiao.has(r.serviceAreaId)) porRegiao.set(r.serviceAreaId, { nome, regras: [] });
    porRegiao.get(r.serviceAreaId)!.regras.push(r);
  }

  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">Tabela de preços</h1>
      <p className="mt-1 text-slate-600">
        Valor base por tipo × duração × região. O multiplicador ajusta o preço final (ex.: pós-obra).
      </p>

      <div className="mt-6 space-y-3">
        {[...porRegiao.values()].map((grupo) => (
          <details key={grupo.nome} className="rounded-xl border border-slate-200">
            <summary className="cursor-pointer px-4 py-3 font-medium text-slate-800 hover:bg-slate-50">
              {grupo.nome}
            </summary>
            <div className="overflow-x-auto border-t border-slate-200 p-4">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="pb-2 pr-3 font-medium">Serviço</th>
                    <th className="pb-2 pr-3 font-medium">Duração</th>
                    <th className="pb-2 pr-3 font-medium">Valor base (R$)</th>
                    <th className="pb-2 pr-3 font-medium">Multiplicador</th>
                    <th className="pb-2 pr-3 font-medium">Ativo</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {grupo.regras.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100">
                      <td className="py-2 pr-3 text-slate-800">{LABEL[r.tipoServico] ?? r.tipoServico}</td>
                      <td className="py-2 pr-3 text-slate-600">{r.duracaoHoras}h</td>
                      <td colSpan={4} className="py-2">
                        <ActionForm action={atualizarPreco} submitLabel="Salvar" size="sm" className="flex flex-wrap items-center gap-2 space-y-0">
                          <input type="hidden" name="id" value={r.id} />
                          <Input
                            name="valorReais"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={(r.valorBase / 100).toFixed(2)}
                            className="h-9 w-28"
                          />
                          <Input
                            name="multiplicador"
                            type="number"
                            step="0.05"
                            min="0"
                            defaultValue={Number(r.multiplicador).toString()}
                            className="h-9 w-20"
                          />
                          <label className="flex items-center gap-1 text-slate-600">
                            <input type="checkbox" name="ativo" defaultChecked={r.ativo} /> ativo
                          </label>
                        </ActionForm>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
