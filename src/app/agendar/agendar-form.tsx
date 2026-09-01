"use client";

import { useActionState, useState } from "react";
import { criarAgendamento } from "@/lib/bookings/actions";
import type { FormState } from "@/lib/auth/actions";
import { RECORRENCIAS } from "@/lib/validation/agendamento";
import { TIPOS_SERVICO } from "@/lib/validation/profissional";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Endereco = { id: string; apelido: string | null; logradouro: string; numero: string; bairro: string; cidade: string };

function Erro({ msg }: { msg?: string }) {
  return msg ? <p className="text-sm text-red-600">{msg}</p> : null;
}

const inputSelect = "flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm";

export function AgendarForm({ enderecos }: { enderecos: Endereco[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(criarAgendamento, undefined);
  const e = state?.errors ?? {};
  const raw = state?.values ?? {};
  const v = (k: string) => (typeof raw[k] === "string" ? (raw[k] as string) : "");

  const [tipo, setTipo] = useState<string>(v("tipoServico") || "DIARIA_PADRAO");
  const [enderecoId, setEnderecoId] = useState<string>(enderecos[0]?.id ?? "novo");
  const usarNovo = enderecoId === "novo";

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="tipoServico">Tipo de serviço</Label>
        <select
          id="tipoServico"
          name="tipoServico"
          value={tipo}
          onChange={(ev) => setTipo(ev.target.value)}
          className={inputSelect}
        >
          {TIPOS_SERVICO.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <Erro msg={e.tipoServico?.[0]} />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-slate-800">Endereço do serviço</legend>
        {enderecos.map((en) => (
          <label key={en.id} className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="enderecoId"
              value={en.id}
              checked={enderecoId === en.id}
              onChange={() => setEnderecoId(en.id)}
              className="mt-1"
            />
            <span>
              {en.apelido ? `${en.apelido} — ` : ""}
              {en.logradouro}, {en.numero} · {en.bairro}, {en.cidade}
            </span>
          </label>
        ))}
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="radio"
            name="enderecoId"
            value="novo"
            checked={usarNovo}
            onChange={() => setEnderecoId("novo")}
          />
          Usar um novo endereço
        </label>

        {usarNovo && (
          <div className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cep">CEP</Label>
              <Input id="cep" name="cep" defaultValue={v("cep")} inputMode="numeric" placeholder="80000-000" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" name="cidade" defaultValue={v("cidade")} placeholder="Curitiba" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="logradouro">Rua / logradouro</Label>
              <Input id="logradouro" name="logradouro" defaultValue={v("logradouro")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="numero">Número</Label>
              <Input id="numero" name="numero" defaultValue={v("numero")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="complemento">Complemento</Label>
              <Input id="complemento" name="complemento" defaultValue={v("complemento")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bairro">Bairro</Label>
              <Input id="bairro" name="bairro" defaultValue={v("bairro")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="referencia">Ponto de referência</Label>
              <Input id="referencia" name="referencia" defaultValue={v("referencia")} />
            </div>
          </div>
        )}
        <Erro msg={e.cidade?.[0] ?? e.enderecoId?.[0]} />
      </fieldset>

      {tipo === "POS_OBRA" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="metragem">Metragem aproximada (m²)</Label>
            <Input id="metragem" name="metragem" type="number" min="1" defaultValue={v("metragem")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="numeroComodos">Nº de cômodos</Label>
            <Input id="numeroComodos" name="numeroComodos" type="number" min="1" defaultValue={v("numeroComodos")} />
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="data">Data</Label>
          <Input id="data" name="data" type="date" defaultValue={v("data")} required />
          <Erro msg={e.data?.[0]} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inicio">Início</Label>
          <Input id="inicio" name="inicio" type="time" defaultValue={v("inicio") || "08:00"} required />
          <Erro msg={e.inicio?.[0]} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="duracaoHoras">Duração</Label>
          <select id="duracaoHoras" name="duracaoHoras" defaultValue={v("duracaoHoras") || "4"} className={inputSelect}>
            <option value="4">4 horas</option>
            <option value="6">6 horas</option>
            <option value="8">8 horas</option>
          </select>
          <Erro msg={e.duracaoHoras?.[0]} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="recorrencia">Recorrência</Label>
          <select id="recorrencia" name="recorrencia" defaultValue={v("recorrencia") || "AVULSA"} className={inputSelect}>
            {RECORRENCIAS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="metodoPagamento">Pagamento</Label>
          <select id="metodoPagamento" name="metodoPagamento" defaultValue={v("metodoPagamento") || "PIX"} className={inputSelect}>
            <option value="PIX">Pix</option>
            <option value="CARTAO">Cartão</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="observacoes">Observações (opcional)</Label>
        <Textarea id="observacoes" name="observacoes" defaultValue={v("observacoes")} maxLength={500} />
      </div>

      {state?.message && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{state.message}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Agendando…" : "Agendar e pagar"}
      </Button>
      <p className="text-center text-xs text-slate-500">
        O valor fica retido e só é repassado à profissional após a conclusão do serviço.
      </p>
    </form>
  );
}
