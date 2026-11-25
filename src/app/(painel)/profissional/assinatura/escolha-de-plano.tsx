"use client";

import { useActionState, useState } from "react";
import { assinarPlano, type AssinaturaState } from "@/lib/assinaturas/actions";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Plano } from "@/lib/assinaturas/planos";
import type { PlanoAssinatura } from "@/generated/prisma/enums";

const METODOS = [
  { value: "PIX", label: "Pix" },
  { value: "CARTAO", label: "Cartão" },
] as const;

export function EscolhaDePlano({ planos, atual }: { planos: Plano[]; atual: PlanoAssinatura | null }) {
  const [state, action, pending] = useActionState<AssinaturaState, FormData>(assinarPlano, undefined);
  const [plano, setPlano] = useState<PlanoAssinatura>(atual ?? "ANUAL");
  const [metodo, setMetodo] = useState<string>("PIX");

  const planoAtual = planos.find((p) => p.id === plano) ?? planos[0];
  const metodosDoPlano = METODOS.filter((m) => planoAtual.metodos.includes(m.value));
  // Derivado em vez de sincronizado por efeito: trocar para um plano que não aceita o
  // método escolhido já envia o método certo, sem render intermediário inválido.
  const metodoEfetivo = metodosDoPlano.some((m) => m.value === metodo)
    ? metodo
    : metodosDoPlano[0].value;

  return (
    <form action={action} className="mt-5 space-y-5">
      <div role="radiogroup" aria-label="Plano" className="grid gap-3 sm:grid-cols-2">
        {planos.map((p) => {
          const ativo = plano === p.id;
          return (
            <label
              key={p.id}
              className={cn(
                "cursor-pointer rounded-botao border p-4 transition-colors",
                ativo
                  ? "border-marinho-600 bg-marinho-50 ring-1 ring-marinho-600"
                  : "border-areia-200 hover:border-areia-300",
              )}
            >
              <input
                type="radio"
                name="plano"
                value={p.id}
                checked={ativo}
                onChange={() => setPlano(p.id)}
                className="sr-only"
              />
              <span className="flex items-baseline justify-between gap-2">
                <span className="titulo-secao text-areia-900">{p.nome}</span>
                {p.id === "ANUAL" && (
                  <span className="rounded-full bg-laranja-100 px-2 py-0.5 text-xs font-medium text-laranja-700">
                    mais barato
                  </span>
                )}
              </span>
              <span className="numeros titulo mt-2 block text-3xl text-marinho-900">
                {formatBRL(p.valorCentavos)}
                <span className="text-base font-normal text-areia-600">/mês</span>
              </span>
              <span className="mt-2 block text-sm leading-relaxed text-areia-600">{p.detalhe}</span>
            </label>
          );
        })}
      </div>

      <div>
        <p className="text-sm font-medium text-areia-800">Como você quer pagar</p>
        {metodosDoPlano.length === 1 ? (
          <>
            <input type="hidden" name="metodo" value={metodoEfetivo} />
            <p className="mt-2 text-sm text-areia-600">
              O plano {planoAtual.nome.toLowerCase()} é parcelado, e só o cartão de crédito
              parcela — no Pix seriam doze cobranças avulsas.
            </p>
          </>
        ) : (
        <div className="mt-2 flex gap-1.5">
          {metodosDoPlano.map((m) => {
            const ativo = metodoEfetivo === m.value;
            return (
              <label
                key={m.value}
                className={cn(
                  "flex h-10 flex-1 cursor-pointer items-center justify-center rounded-botao border text-sm transition-colors sm:max-w-32",
                  ativo
                    ? "border-marinho-700 bg-marinho-700 font-medium text-white"
                    : "border-areia-200 text-areia-600 hover:border-areia-300",
                )}
              >
                <input
                  type="radio"
                  name="metodo"
                  value={m.value}
                  checked={ativo}
                  onChange={() => setMetodo(m.value)}
                  className="sr-only"
                />
                {m.label}
              </label>
            );
          })}
        </div>
        )}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Gerando cobrança…" : atual ? "Trocar de plano" : "Assinar"}
      </Button>

      {state?.erro && <p className="text-sm text-red-600">{state.erro}</p>}
      {state?.ok && <p className="text-sm text-marinho-700">{state.ok}</p>}
    </form>
  );
}
