"use client";

import { useActionState, useState } from "react";
import { salvarEndereco, excluirEndereco, type EnderecoState } from "@/lib/bookings/enderecos-actions";
import { CIDADES_ATENDIDAS } from "@/lib/regioes";
import { formatCep } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ActionForm } from "@/components/action-form";

export type Endereco = {
  id: string;
  apelido: string | null;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  referencia: string | null;
  usado: boolean;
};

const campoSelect =
  "flex h-10 w-full rounded-botao border border-areia-300 bg-white px-3 text-sm text-areia-900 focus-visible:border-marinho-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marinho-600/25";

export function EnderecoForm({ endereco, aoFechar }: { endereco?: Endereco; aoFechar?: () => void }) {
  const [state, action, pending] = useActionState<EnderecoState, FormData>(salvarEndereco, undefined);

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {endereco && <input type="hidden" name="id" value={endereco.id} />}

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="apelido">Apelido (opcional)</Label>
        <Input
          id="apelido"
          name="apelido"
          defaultValue={endereco?.apelido ?? ""}
          placeholder="Casa, Escritório, Apartamento da praia…"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cep">CEP</Label>
        <Input
          id="cep"
          name="cep"
          defaultValue={endereco ? formatCep(endereco.cep) : ""}
          inputMode="numeric"
          placeholder="80000-000"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cidade">Cidade</Label>
        <select id="cidade" name="cidade" defaultValue={endereco?.cidade ?? "Curitiba"} className={campoSelect}>
          {CIDADES_ATENDIDAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="logradouro">Rua</Label>
        <Input id="logradouro" name="logradouro" defaultValue={endereco?.logradouro ?? ""} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="numero">Número</Label>
        <Input id="numero" name="numero" defaultValue={endereco?.numero ?? ""} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="complemento">Complemento</Label>
        <Input id="complemento" name="complemento" defaultValue={endereco?.complemento ?? ""} placeholder="Apto 42, bloco B" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bairro">Bairro</Label>
        <Input id="bairro" name="bairro" defaultValue={endereco?.bairro ?? ""} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="referencia">Ponto de referência</Label>
        <Input id="referencia" name="referencia" defaultValue={endereco?.referencia ?? ""} placeholder="Portão verde, ao lado da padaria" />
      </div>

      {state?.erro && <p className="text-sm text-red-700 sm:col-span-2">{state.erro}</p>}

      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : endereco ? "Salvar alterações" : "Adicionar endereço"}
        </Button>
        {aoFechar && (
          <Button type="button" variant="ghost" onClick={aoFechar}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}

export function CartaoEndereco({ endereco }: { endereco: Endereco }) {
  const [editando, setEditando] = useState(false);

  return (
    <li className="rounded-cartao border border-areia-200 bg-white p-5">
      {editando ? (
        <EnderecoForm endereco={endereco} aoFechar={() => setEditando(false)} />
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="text-sm">
            <p className="titulo-secao text-areia-900">{endereco.apelido ?? endereco.logradouro}</p>
            <p className="mt-1 leading-relaxed text-areia-600">
              {endereco.logradouro}, {endereco.numero}
              {endereco.complemento ? ` — ${endereco.complemento}` : ""}
              <br />
              {endereco.bairro}, {endereco.cidade}/{endereco.uf} · CEP {formatCep(endereco.cep)}
              {endereco.referencia ? <><br />{endereco.referencia}</> : null}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditando(true)}>
              Editar
            </Button>
            {!endereco.usado && (
              <ActionForm
                action={excluirEndereco}
                submitLabel="Excluir"
                pendingLabel="Excluindo…"
                variant="ghost"
                size="sm"
                confirm="Excluir este endereço?"
                className="space-y-0"
              >
                <input type="hidden" name="id" value={endereco.id} />
              </ActionForm>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

export function NovoEndereco() {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return <Button onClick={() => setAberto(true)}>Adicionar endereço</Button>;
  }
  return (
    <div className="rounded-cartao border border-areia-200 bg-white p-5">
      <p className="titulo-secao mb-4 text-areia-900">Novo endereço</p>
      <EnderecoForm aoFechar={() => setAberto(false)} />
    </div>
  );
}
