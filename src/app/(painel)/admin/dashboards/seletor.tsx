"use client";

import { useRouter } from "next/navigation";
import { DIMENSOES, PERIODOS } from "@/lib/admin/painel-opcoes";
import { cn } from "@/lib/utils";

const campoSelect =
  "h-10 rounded-botao border border-pedra-300 bg-white px-3 text-sm text-pedra-900 focus-visible:border-mar-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mar-600/25";

export function SeletorPainel({ dimensao, periodo }: { dimensao: string; periodo: string }) {
  const router = useRouter();

  // Os dois valores já chegam resolvidos do servidor, então a URL se monta sem
  // useSearchParams — que exigiria um limite de Suspense só para isso.
  function trocar(chave: "dimensao" | "periodo", valor: string) {
    const atual = { dimensao, periodo, [chave]: valor };
    router.push(`/admin/dashboards?dimensao=${atual.dimensao}&periodo=${atual.periodo}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-1.5">
        <label htmlFor="dimensao" className="block text-sm font-medium text-pedra-800">
          Abrir por
        </label>
        <select
          id="dimensao"
          value={dimensao}
          onChange={(e) => trocar("dimensao", e.target.value)}
          className={campoSelect}
        >
          {DIMENSOES.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <span className="block text-sm font-medium text-pedra-800">Período</span>
        <div className="flex gap-1">
          {PERIODOS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => trocar("periodo", p.value)}
              className={cn(
                "h-10 rounded-botao px-3 text-sm transition-colors",
                p.value === periodo
                  ? "bg-mar-700 font-medium text-white"
                  : "border border-pedra-200 bg-white text-pedra-600 hover:border-pedra-300",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
