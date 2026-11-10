"use client";

import { useState } from "react";
import Link from "next/link";
import { duracoesDisponiveis, precoDeTabela, type Duracao } from "@/lib/pricing/tabela";
import { formatBRLRedondo, formatDuracao } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const POR_EXTENSO: Partial<Record<Duracao, string>> = { 240: "Quatro", 360: "Seis", 480: "Oito" };
const DURACOES_DIARIA = duracoesDisponiveis("DIARIA_PADRAO");

export function SeletorPreco() {
  const [duracao, setDuracao] = useState<Duracao>(360);

  return (
    <div className="rounded-cartao border border-areia-200 bg-white p-5 shadow-[0_18px_40px_-24px_rgb(15_43_76_/_0.28)] sm:p-6">
      <p className="text-sm text-areia-600">Diária padrão em Curitiba e região</p>

      <div role="radiogroup" aria-label="Duração do serviço" className="mt-3 flex gap-1.5">
        {DURACOES_DIARIA.map((h) => {
          const ativo = h === duracao;
          return (
            <button
              key={h}
              type="button"
              role="radio"
              aria-checked={ativo}
              onClick={() => setDuracao(h)}
              className={cn(
                "h-10 flex-1 rounded-botao text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marinho-600 focus-visible:ring-offset-2",
                ativo
                  ? "bg-marinho-800 text-white"
                  : "border border-areia-200 bg-white text-areia-600 hover:border-areia-300 hover:text-areia-900",
              )}
            >
              {formatDuracao(h)}
            </button>
          );
        })}
      </div>

      <p key={duracao} className="troca numeros titulo mt-5 text-5xl text-marinho-900">
        {formatBRLRedondo(precoDeTabela("DIARIA_PADRAO", duracao)!)}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-areia-600">
        {POR_EXTENSO[duracao]} horas de serviço na sua casa. Os produtos de limpeza são os seus.
      </p>

      <Link href="/agendar" className={cn(buttonVariants({ size: "lg" }), "mt-5 w-full")}>
        Agendar esta diária
      </Link>
      <p className="mt-3 text-xs leading-relaxed text-areia-500">
        Você paga na hora de agendar. O valor fica retido e só chega à profissional depois que o serviço
        termina e você confirma.
      </p>
    </div>
  );
}
