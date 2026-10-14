"use client";

import { useActionState, useState, type ReactNode } from "react";
import Image from "next/image";
import { criarAgendamento } from "@/lib/bookings/actions";
import type { FormState } from "@/lib/auth/actions";
import { RECORRENCIAS, MIN_DETALHES_POS_OBRA } from "@/lib/validation/agendamento";
import { SERVICOS, ROTEIRO_POS_OBRA, EXEMPLO_POS_OBRA, servicoPorTipo } from "@/lib/servicos";
import { duracoesDisponiveis, precoDeTabela, type Duracao } from "@/lib/pricing/tabela";
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
  "flex h-10 w-full rounded-botao border border-pedra-300 bg-white px-3 text-sm text-pedra-900 focus-visible:border-mar-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mar-600/25";

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
  tipoInicial,
}: {
  enderecos: Endereco[];
  profissionais: Profissional[];
  tipoInicial: ServiceType;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(criarAgendamento, undefined);
  const e = state?.errors ?? {};
  const raw = state?.values ?? {};
  const v = (k: string) => (typeof raw[k] === "string" ? (raw[k] as string) : "");

  const [tipo, setTipo] = useState<ServiceType>((v("tipoServico") as ServiceType) || tipoInicial);
  const [duracao, setDuracao] = useState<Duracao>((Number(v("duracaoHoras")) as Duracao) || 4);
  const [enderecoId, setEnderecoId] = useState<string>(enderecos[0]?.id ?? "novo");
  const [detalhes, setDetalhes] = useState<string>(v("detalhesPosObra"));
  const usarNovo = enderecoId === "novo";

  const disponiveis = duracoesDisponiveis(tipo);
  // Pós-obra não vende 8 h: se o cliente vinha com ela marcada, cai para a maior disponível.
  const duracaoEfetiva = disponiveis.includes(duracao) ? duracao : disponiveis[disponiveis.length - 1];
  const total = precoDeTabela(tipo, duracaoEfetiva);

  function trocarTipo(novo: ServiceType) {
    setTipo(novo);
    const permitidas = duracoesDisponiveis(novo);
    if (!permitidas.includes(duracao)) setDuracao(permitidas[permitidas.length - 1]);
  }

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
      <div className="space-y-5">
        <Secao titulo="Qual serviço">
          <div className="grid gap-3 sm:grid-cols-2">
            {SERVICOS.map((s) => {
              const ativo = tipo === s.tipo;
              return (
                <label
                  key={s.tipo}
                  className={cn(
                    "flex cursor-pointer gap-3 overflow-hidden rounded-botao border p-2 transition-colors",
                    ativo
                      ? "border-mar-600 bg-mar-50 ring-1 ring-mar-600"
                      : "border-pedra-200 hover:border-pedra-300",
                  )}
                >
                  <input
                    type="radio"
                    name="tipoServico"
                    value={s.tipo}
                    checked={ativo}
                    onChange={() => trocarTipo(s.tipo)}
                    className="sr-only"
                  />
                  <Image
                    src={s.foto}
                    alt=""
                    width={160}
                    height={160}
                    className="size-16 shrink-0 rounded-md object-cover"
                  />
                  <span className="min-w-0 py-0.5">
                    <span
                      className={cn(
                        "block text-sm font-medium",
                        ativo ? "text-mar-900" : "text-pedra-800",
                      )}
                    >
                      {s.nome}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-pedra-600">{s.resumo}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <Erro msg={e.tipoServico?.[0]} />

          <div>
            <Label>Duração</Label>
            <div className="mt-1.5 flex gap-1.5">
              {disponiveis.map((h) => {
                const ativo = duracaoEfetiva === h;
                return (
                  <label
                    key={h}
                    className={cn(
                      "flex h-10 flex-1 cursor-pointer items-center justify-center rounded-botao border text-sm transition-colors",
                      ativo
                        ? "border-mar-700 bg-mar-700 font-medium text-white"
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
            {tipo === "POS_OBRA" && (
              <p className="mt-2 text-xs leading-relaxed text-pedra-500">
                Pós-obra acima de seis horas quase sempre pede equipe, então passa por orçamento. Descreva
                a obra abaixo e a gente retorna com o valor.
              </p>
            )}
            <Erro msg={e.duracaoHoras?.[0]} />
          </div>
        </Secao>

        {/* Análise do pós-obra -------------------------------------------- */}
        {tipo === "POS_OBRA" && (
          <Secao titulo="Como ficou a obra">
            <p className="text-sm leading-relaxed text-pedra-600">
              Pós-obra varia demais de um imóvel para outro. Quanto mais específico você for, melhor a
              profissional se prepara — e menos chance de o serviço não caber nas horas contratadas.
            </p>

            <div className="rounded-botao border border-mar-200 bg-mar-50 p-4">
              <p className="text-sm font-medium text-mar-900">Responda, se souber:</p>
              <ul className="mt-2 space-y-1">
                {ROTEIRO_POS_OBRA.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-relaxed text-mar-800">
                    <span aria-hidden="true" className="select-none text-mar-400">
                      —
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="detalhesPosObra">Descrição do serviço</Label>
              <Textarea
                id="detalhesPosObra"
                name="detalhesPosObra"
                value={detalhes}
                onChange={(ev) => setDetalhes(ev.target.value)}
                maxLength={2000}
                className="min-h-40"
                placeholder={EXEMPLO_POS_OBRA}
              />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setDetalhes(EXEMPLO_POS_OBRA)}
                  className="text-xs font-medium text-mar-700 underline underline-offset-2 hover:text-mar-900"
                >
                  Preencher com um exemplo e editar
                </button>
                <span
                  className={cn(
                    "numeros text-xs",
                    detalhes.trim().length >= MIN_DETALHES_POS_OBRA ? "text-folha-600" : "text-pedra-500",
                  )}
                >
                  {detalhes.trim().length} de {MIN_DETALHES_POS_OBRA} caracteres
                </span>
              </div>
              <Erro msg={e.detalhesPosObra?.[0]} />
            </div>

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
          </Secao>
        )}

        <Secao titulo="Onde">
          {enderecos.map((en) => (
            <label key={en.id} className="flex items-start gap-2.5 text-sm text-pedra-700">
              <input
                type="radio"
                name="enderecoId"
                value={en.id}
                checked={enderecoId === en.id}
                onChange={() => setEnderecoId(en.id)}
                className="mt-1 accent-mar-700"
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
              className="accent-mar-700"
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
        <div className="overflow-hidden rounded-cartao border border-pedra-200 bg-white shadow-[0_18px_40px_-24px_rgb(10_34_56_/_0.45)]">
          <Image
            src={servicoPorTipo(tipo).foto}
            alt=""
            width={640}
            height={360}
            className="aspect-[16/9] w-full object-cover"
          />
          <div className="p-5">
            <p className="text-sm text-pedra-600">
              {servicoPorTipo(tipo).nome}, {duracaoEfetiva} horas
            </p>
            <p key={total} className="troca numeros titulo mt-2 text-4xl text-mar-900">
              {total === null ? "Sob orçamento" : formatBRLRedondo(total)}
            </p>
            <p className="mt-1 text-xs text-pedra-500">Valor de Curitiba e RMC; o litoral de SC é 25% maior.</p>

            {state?.message && (
              <p className="mt-4 rounded-botao bg-folha-50 p-3 text-sm leading-relaxed text-folha-700">
                {state.message}
              </p>
            )}

            <Button type="submit" disabled={pending} size="lg" className="mt-5 w-full">
              {pending ? "Agendando…" : "Agendar e pagar"}
            </Button>
            <p className="mt-3 text-xs leading-relaxed text-pedra-500">
              O valor fica retido na plataforma e só é repassado à profissional depois que o serviço
              termina.
            </p>
          </div>
        </div>
      </aside>
    </form>
  );
}
