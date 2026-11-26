"use client";

import { useState } from "react";
import { useActionState } from "react";
import { atualizarPreco, type ConfigState } from "@/lib/admin/config-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COLUNAS } from "./grade";

export type LinhaPrecoProps = {
  id: string;
  servico: string;
  duracao: string;
  valorReais: string;
  multiplicador: string;
  /** Vazio quando a regra segue o padrão global. */
  repassePct: string;
  /** Repasse em vigor hoje, já resolvido no servidor — placeholder quando o campo é vazio. */
  repassePadrao: number;
  ativo: boolean;
};

export function LinhaPreco(p: LinhaPrecoProps) {
  const [state, formAction, pending] = useActionState<ConfigState, FormData>(
    atualizarPreco,
    undefined,
  );
  const [repasse, setRepasse] = useState(p.repassePct);

  // Mostrar o complemento ao vivo é o que impede o engano caro: digitar 15 pensando em
  // comissão apareceria na hora como "profissional 15% / plataforma 85%".
  const efetivo = repasse.trim() === "" ? p.repassePadrao : Number(repasse);
  const valido = Number.isFinite(efetivo) && efetivo >= 0 && efetivo <= 100;
  const plataforma = valido ? Math.round((100 - efetivo) * 100) / 100 : null;

  return (
    <form action={formAction} className="border-t border-areia-100 py-2">
      <div className={COLUNAS}>
        <input type="hidden" name="id" value={p.id} />

        <span className="truncate text-areia-800" title={p.servico}>
          {p.servico}
        </span>
        <span className="text-areia-600">{p.duracao}</span>

        <Input
          name="valorReais"
          aria-label={`Valor base de ${p.servico} ${p.duracao}`}
          type="number"
          step="0.01"
          min="0"
          defaultValue={p.valorReais}
          className="h-9"
        />
        <Input
          name="multiplicador"
          aria-label={`Multiplicador de ${p.servico} ${p.duracao}`}
          type="number"
          step="0.05"
          min="0"
          defaultValue={p.multiplicador}
          className="h-9"
        />
        <Input
          name="repassePct"
          aria-label={`Repasse à profissional de ${p.servico} ${p.duracao}, em por cento`}
          type="number"
          step="0.01"
          min="0"
          max="100"
          placeholder={`${p.repassePadrao}`}
          value={repasse}
          onChange={(e) => setRepasse(e.target.value)}
          className="h-9"
        />

        <span className={valido ? "text-sm text-areia-600" : "text-sm text-red-600"}>
          {plataforma === null ? "—" : `${plataforma}%`}
          {repasse.trim() === "" && valido && (
            <span className="ml-1 text-xs text-areia-400">padrão</span>
          )}
        </span>

        <label className="flex items-center justify-center">
          <input
            type="checkbox"
            name="ativo"
            defaultChecked={p.ativo}
            aria-label={`${p.servico} ${p.duracao} ativo`}
          />
        </label>

        <Button type="submit" size="sm" disabled={pending || !valido}>
          {pending ? "…" : "Salvar"}
        </Button>
      </div>

      {state?.erro && <p className="mt-1 text-sm text-red-600">{state.erro}</p>}
    </form>
  );
}
