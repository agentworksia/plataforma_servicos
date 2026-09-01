import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { alternarRegiao, criarRegiao, removerRegiao } from "@/lib/admin/config-actions";
import { ActionForm } from "@/components/action-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Regiões" };

export default async function AdminRegioesPage() {
  await requireRole("ADMIN");
  const regioes = await db.serviceArea.findMany({
    orderBy: [{ cidade: "asc" }, { bairro: "asc" }],
    select: {
      id: true,
      cidade: true,
      bairro: true,
      uf: true,
      ativo: true,
      _count: { select: { profissionais: true, pricingRules: true } },
    },
  });

  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">Regiões atendidas</h1>
      <p className="mt-1 text-slate-600">
        Ative ou desative as cidades/bairros disponíveis para agendamento. Uma região nova já entra com a
        tabela de preços padrão.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-4 py-2 font-medium">Cidade / bairro</th>
              <th className="px-4 py-2 font-medium">UF</th>
              <th className="px-4 py-2 font-medium">Profissionais</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {regioes.map((r) => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="px-4 py-3 text-slate-800">
                  {r.cidade}
                  {r.bairro ? ` — ${r.bairro}` : ""}
                </td>
                <td className="px-4 py-3 text-slate-600">{r.uf}</td>
                <td className="px-4 py-3 text-slate-600">{r._count.profissionais}</td>
                <td className="px-4 py-3">
                  <Badge cor={r.ativo ? "verde" : "neutro"}>{r.ativo ? "Ativa" : "Inativa"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <ActionForm
                      action={alternarRegiao}
                      submitLabel={r.ativo ? "Desativar" : "Ativar"}
                      variant="outline"
                      size="sm"
                      className="space-y-0"
                    >
                      <input type="hidden" name="id" value={r.id} />
                    </ActionForm>
                    {r._count.profissionais === 0 && (
                      <ActionForm
                        action={removerRegiao}
                        submitLabel="Remover"
                        variant="ghost"
                        size="sm"
                        className="space-y-0"
                        confirm="Remover esta região e a tabela de preços dela?"
                      >
                        <input type="hidden" name="id" value={r.id} />
                      </ActionForm>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 max-w-md rounded-xl border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-900">Adicionar região</h2>
        <ActionForm action={criarRegiao} submitLabel="Adicionar" className="mt-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" name="cidade" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bairro">Bairro (opcional)</Label>
              <Input id="bairro" name="bairro" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="uf">UF</Label>
              <Input id="uf" name="uf" defaultValue="PR" maxLength={2} className="w-20 uppercase" />
            </div>
          </div>
        </ActionForm>
      </div>
    </section>
  );
}
