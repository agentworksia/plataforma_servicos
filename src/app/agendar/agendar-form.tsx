"use client";

import { useActionState, useState, type ReactNode } from "react";
import { criarAgendamento } from "@/lib/bookings/actions";
import type { FormState } from "@/lib/auth/actions";
import { RECORRENCIAS } from "@/lib/validation/agendamento";
import { TIPOS_SERVICO } from "@/lib/validation/profissional";
import { DURACOES, precoDeTabela, type Duracao } from "@/lib/pricing/tabela";
import { formatBRLRedondo, formatNota } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ServiceType } from "@/generated/prisma/enums";

type Endereco = {
  id: string;
  apelido: string | null;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
};

type Profissional = { id: string; nome: string; servicos: number; minhaNota: number | null };

function Erro({ msg }: { msg?: string }) {
  return msg ? <p className="text-sm text-red-700">{msg}</p> : null;
}

const campoSelect =
  "flex h-10 w-full rounded-botao border border-pedra-300 bg-white px-3 text-sm text-pedra-900 focus-visible:border-pinho-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pinho-600/25";

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-cartao border border-pedra-200 bg-white p-5 sm:p-6">
      <legend className="titulo-secao px-1 text-pedra-900">{titulo}</legend>
      <div className="mt-4 space-y-4">{children}</div>
    </fieldset>
  );
}

export function AgendarForm({
  enderecos,
  profissionais,
}: {
  enderecos: Endereco[];
  profissionais: Profissional[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(criarAgendamento, undefined);
  const e = state?.errors ?? {};
  const raw = state?.values ?? {};
  const v = (k: string) => (typeof raw[k] === "string" ? (raw[k] as string) : "");

  const [tipo, setTipo] = useState<ServiceType>((v("tipoServico") as ServiceType) || "DIARIA_PADRAO");
  const [duracao, setDuracao] = useState<Duracao>((Number(v("duracaoHoras")) as Duracao) || 4);
  const [enderecoId, setEnderecoId] = useState<string>(enderecos[0]?.id ?? "novo");
  const usarNovo = enderecoId === "novo";

  const total = precoDeTabela(tipo, duracao);

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
      <div className="space-y-5">
        <Secao titulo="Qual serviço">
          <div className="grid gap-2 sm:grid-cols-2">
            {TIPOS_SERVICO.map((t) => {
              const ativo = tipo === t.value;
              return (
                <label
                  key={t.value}
                  className={cn(
                    "cursor-pointer rounded-botao border p-3 text-sm transition-colors",
                    ativo
                      ? "border-pinho-600 bg-pinho-50 text-pinho-900"
                      : "border-pedra-200 text-pedra-700 hover:border-pedra-300",
                  )}
                >
                  <input
                    type="radio"
                    name="tipoServico"
                    value={t.value}
                    checked={ativo}
                    onChange={() => setTipo(t.value as ServiceType)}
                    className="sr-only"
                  />
                  <span className="font-medium">{t.label}</span>
                </label>
              );
            })}
          </div>
          <Erro msg={e.tipoServico?.[0]} />

          <div>
            <Label>Duração</Label>
            <div className="mt-1.5 flex gap-1.5">
              {DURACOES.map((h) => {
                const ativo = duracao === h;
                return (
                  <label
                    key={h}
                    className={cn(
                      "flex h-10 flex-1 cursor-pointer items-center justify-center rounded-botao border text-sm transition-colors",
                      ativo
                        ? "border-pinho-700 bg-pinho-700 font-medium text-white"
                        : "border-pedra-200 text-pedra-600 hover:border-pedra-300",
                    )}
                  >
                    <input
                      type="radio"
                      name="duracaoHoras"
                      value={h}
                      checked={ativo}
                      onChange={() => setDuracao(h)}
                      className="sr-only"
                    />
                    {h} horas
                  </label>
                );
              })}
            </div>
            <Erro msg={e.duracaoHoras?.[0]} />
          </div>

          {tipo === "POS_OBRA" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="metragem">Metragem aproximada (m²)</Label>
                <Input id="metragem" name="metragem" type="number" min="1" defaultValue={v("metragem")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="numeroComodos">Número de cômodos</Label>
                <Input
                  id="numeroComodos"
                  name="numeroComodos"
                  type="number"
                  min="1"
                  defaultValue={v("numeroComodos")}
                />
              </div>
            </div>
          )}
        </Secao>

        <Secao titulo="Onde">
          {enderecos.map((en) => (
            <label key={en.id} className="flex items-start gap-2.5 text-sm text-pedra-700">
              <input
                type="radio"
                name="enderecoId"
                value={en.id}
                checked={enderecoId === en.id}
                onChange={() => setEnderecoId(en.id)}
                className="mt-1 accent-pinho-700"
              />
              <span>
                {en.apelido ? `${en.apelido} — ` : ""}
                {en.logradouro}, {en.numero}, {en.bairro}, {en.cidade}
              </span>
            </label>
          ))}
          <label className="flex items-center gap-2.5 text-sm text-pedra-700">
            <input
              type="radio"
              name="enderecoId"
              value="novo"
              checked={usarNovo}
              onChange={() => setEnderecoId("novo")}
              className="accent-pinho-700"
            />
            Usar um endereço novo
          </label>

          {usarNovo && (
            <div className="grid gap-3 rounded-botao border border-pedra-200 bg-pedra-50 p-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  name="cep"
                  defaultValue={v("cep")}
                  inputMode="numeric"
                  placeholder="80000-000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cidade">Cidade</Label>
                <Input id="cidade" name="cidade" defaultValue={v("cidade")} placeholder="Curitiba" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="logradouro">Rua</Label>
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
        </Secao>

        <Secao titulo="Quando">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="data">Data</Label>
              <Input id="data" name="data" type="date" defaultValue={v("data")} required />
              <Erro msg={e.data?.[0]} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inicio">Começa às</Label>
              <Input id="inicio" name="inicio" type="time" defaultValue={v("inicio") || "08:00"} required />
              <Erro msg={e.inicio?.[0]} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recorrencia">Repete</Label>
              <select
                id="recorrencia"
                name="recorrencia"
                defaultValue={v("recorrencia") || "AVULSA"}
                className={campoSelect}
              >
                {RECORRENCIAS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Secao>

        <Secao titulo="Quem atende">
          {profissionais.length > 0 ? (
            <div className="space-y-1.5">
              <Label htmlFor="preferidaId">Profissional preferida</Label>
              <select
                id="preferidaId"
                name="preferidaId"
                defaultValue={v("preferidaId")}
                className={campoSelect}
              >
                <option value="">Sem preferência — a plataforma escolhe</option>
                {profissionais.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} ({p.servicos} {p.servicos === 1 ? "serviço" : "serviços"}
                    {p.minhaNota ? `, você deu ${formatNota(p.minhaNota)}` : ""})
                  </option>
                ))}
              </select>
              <p className="text-xs leading-relaxed text-pedra-500">
                Ela recebe a oferta primeiro. Se não puder atender nesse horário, a plataforma chama outra
                profissional e avisa você.
              </p>
              <Erro msg={e.preferidaId?.[0]} />
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-pedra-600">
              A plataforma escolhe entre as profissionais aprovadas que atendem sua região nesse horário.
              Depois do primeiro serviço concluído, você pode pedir a mesma profissional nos próximos.
            </p>
          )}
        </Secao>

        <Secao titulo="Pagamento">
          <div className="space-y-1.5">
            <Label htmlFor="metodoPagamento">Forma de pagamento</Label>
            <select
              id="metodoPagamento"
              name="metodoPagamento"
              defaultValue={v("metodoPagamento") || "PIX"}
              className={campoSelect}
            >
              <option value="PIX">Pix</option>
              <option value="CARTAO">Cartão</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="observacoes">Alguma observação para a profissional?</Label>
            <Textarea
              id="observacoes"
              name="observacoes"
              defaultValue={v("observacoes")}
              maxLength={500}
              placeholder="Tenho um cachorro; a chave fica com o porteiro; comece pela cozinha…"
            />
          </div>
        </Secao>
      </div>

      {/* Resumo ------------------------------------------------------------ */}
      <aside className="lg:sticky lg:top-24">
        <div className="rounded-cartao border border-pedra-200 bg-white p-5 shadow-[0_18px_40px_-24px_rgb(20_61_45_/_0.45)]">
          <p className="text-sm text-pedra-600">
            {TIPOS_SERVICO.find((t) => t.value === tipo)?.label}, {duracao} horas
          </p>
          <p key={total} className="troca numeros titulo mt-2 text-4xl text-pinho-900">
            {formatBRLRedondo(total)}
          </p>

          {state?.message && (
            <p className="mt-4 rounded-botao bg-mel-50 p-3 text-sm leading-relaxed text-mel-700">
              {state.message}
            </p>
          )}

          <Button type="submit" disabled={pending} size="lg" className="mt-5 w-full">
            {pending ? "Agendando…" : "Agendar e pagar"}
          </Button>
          <p className="mt-3 text-xs leading-relaxed text-pedra-500">
            O valor fica retido na plataforma e só é repassado à profissional depois que o serviço termina.
          </p>
        </div>
      </aside>
    </form>
  );
}
