"use client";

import { useState } from "react";
import Link from "next/link";
import { DURACOES, PRECO_BASE_CENTAVOS, type Duracao } from "@/lib/pricing/tabela";
import { formatBRLRedondo } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const POR_EXTENSO: Record<Duracao, string> = { 4: "Quatro", 6: "Seis", 8: "Oito" };

export function SeletorPreco() {
  const [duracao, setDuracao] = useState<Duracao>(6);

  return (
    <div className="rounded-cartao border border-pedra-200 bg-white p-5 shadow-[0_18px_40px_-24px_rgb(20_61_45_/_0.45)] sm:p-6">
      <p className="text-sm text-pedra-600">Diária padrão em Curitiba e região</p>

      <div role="radiogroup" aria-label="Duração do serviço" className="mt-3 flex gap-1.5">
        {DURACOES.map((h) => {
          const ativo = h === duracao;
          return (
            <button
              key={h}
              type="button"
              role="radio"
              aria-checked={ativo}
              onClick={() => setDuracao(h)}
              className={cn(
                "h-10 flex-1 rounded-botao text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pinho-600 focus-visible:ring-offset-2",
                ativo
                  ? "bg-pinho-700 text-white"
                  : "border border-pedra-200 bg-white text-pedra-600 hover:border-pedra-300 hover:text-pedra-900",
              )}
            >
              {h} horas
            </button>
          );
        })}
      </div>

      <p key={duracao} className="troca numeros titulo mt-5 text-5xl text-pinho-900">
        {formatBRLRedondo(PRECO_BASE_CENTAVOS[duracao])}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-pedra-600">
        {POR_EXTENSO[duracao]} horas de serviço na sua casa. Os produtos de limpeza são os seus.
      </p>

      <Link href="/agendar" className={cn(buttonVariants({ size: "lg" }), "mt-5 w-full")}>
        Agendar esta diária
      </Link>
      <p className="mt-3 text-xs leading-relaxed text-pedra-500">
        Você paga na hora de agendar. O valor fica retido e só chega à profissional depois que o serviço
        termina e você confirma.
      </p>
    </div>
  );
}
