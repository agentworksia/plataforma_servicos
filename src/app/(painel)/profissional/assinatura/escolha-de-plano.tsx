"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { assinarPlano, type AssinaturaState } from "@/lib/assinaturas/actions";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Plano } from "@/lib/assinaturas/planos";
import type { PlanoAssinatura } from "@/generated/prisma/enums";

const METODOS = [
  { value: "PIX", label: "Pix" },
  { value: "CARTAO", label: "Cartão de crédito" },
] as const;

export function EscolhaDePlano({ planos, atual }: { planos: Plano[]; atual: PlanoAssinatura | null }) {
  const [state, action, pending] = useActionState<AssinaturaState, FormData>(assinarPlano, undefined);
  // Abre no mensal: é o compromisso menor, e é o plano que aceita as duas formas de
  // pagamento. Abrindo no anual, a seção "como você quer pagar" nascia sem nenhum botão.
  const [plano, setPlano] = useState<PlanoAssinatura>(atual ?? "MENSAL");
  const [metodo, setMetodo] = useState<string>("PIX");
  const cobrancaRef = useRef<HTMLDivElement>(null);

  // A revalidação também preenche o cartão "Situação", lá em cima; sem isso ela ficaria
  // entre as duas cópias da cobrança sem saber qual é a nova.
  useEffect(() => {
    if (state?.ok) cobrancaRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [state?.ok]);

  const planoAtual = planos.find((p) => p.id === plano) ?? planos[0];
  const metodosDoPlano = METODOS.filter((m) => planoAtual.metodos.includes(m.value));
  const umMetodoSo = metodosDoPlano.length === 1;
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

        {/* Mesmo com uma opção só, o botão aparece marcado: a seção sem nada clicável
            parecia defeito — tocava-se em "Pix" e nada acontecia porque não havia "Pix". */}
        <div className="mt-2 flex gap-1.5">
          {metodosDoPlano.map((m) => {
            const ativo = metodoEfetivo === m.value;
            return (
              <label
                key={m.value}
                className={cn(
                  "flex min-h-11 flex-1 items-center justify-center rounded-botao border px-3 text-sm transition-colors sm:max-w-44",
                  ativo
                    ? "border-marinho-700 bg-marinho-700 font-medium text-white"
                    : "border-areia-200 text-areia-600 hover:border-areia-300",
                  umMetodoSo ? "cursor-default" : "cursor-pointer",
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

        {umMetodoSo && (
          <p className="mt-2 text-sm leading-relaxed text-areia-600">
            O plano {planoAtual.nome.toLowerCase()} é parcelado, e só o cartão de crédito
            parcela — no Pix seriam doze cobranças avulsas.
          </p>
        )}
      </div>

      {/* Grudado no rodapé no celular: o botão ficava a duas rolagens abaixo do método,
          e quem escolhia a forma de pagamento não via mais nenhum passo seguinte. */}
      <div className="sticky bottom-0 -mx-5 border-t border-areia-200 bg-white/95 px-5 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending
            ? "Gerando cobrança…"
            : `${atual ? "Trocar para" : "Assinar"} ${planoAtual.nome.toLowerCase()} — ${formatBRL(planoAtual.valorCentavos)}/mês`}
        </Button>
      </div>

      {state?.erro && <p className="text-sm text-red-600">{state.erro}</p>}

      {state?.ok && (
        <div ref={cobrancaRef} className="rounded-botao border border-marinho-200 bg-marinho-50 p-4">
          <p className="text-sm font-medium text-marinho-900">{state.ok}</p>

          {state.checkoutUrl && (
            <a
              href={state.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex min-h-11 w-full items-center justify-center rounded-botao bg-marinho-700 px-4 text-sm font-medium text-white sm:w-auto"
            >
              Abrir a fatura para pagar
            </a>
          )}

          {state.pixCopiaCola && (
            <div className="mt-3">
              <p className="text-xs text-marinho-800">Pix copia e cola:</p>
              <code className="mt-1 block overflow-x-auto rounded bg-white p-2 text-xs break-all text-areia-800">
                {state.pixCopiaCola}
              </code>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
