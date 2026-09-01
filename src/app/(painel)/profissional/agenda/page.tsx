import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { minutosParaHora, formatData } from "@/lib/format";
import {
  adicionarBloqueio,
  adicionarDisponibilidade,
  removerBloqueio,
  removerDisponibilidade,
} from "@/lib/professionals/agenda-actions";
import { ActionForm } from "@/components/action-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Agenda" };

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default async function AgendaPage() {
  const user = await requireRole("PROFISSIONAL");
  const perfil = await db.professionalProfile.findUnique({
    where: { userId: user.id },
    select: {
      disponibilidade: { orderBy: [{ diaSemana: "asc" }, { inicioMin: "asc" }] },
      excecoes: { where: { tipo: "BLOQUEIO" }, orderBy: { data: "asc" } },
    },
  });
  const disponibilidade = perfil?.disponibilidade ?? [];
  const bloqueios = perfil?.excecoes ?? [];

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Agenda</h1>
        <p className="mt-1 text-slate-600">
          Disponibilidade recorrente por dia da semana e bloqueios em datas específicas.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold text-slate-900">Disponibilidade semanal</h2>
        {disponibilidade.length === 0 ? (
          <EmptyState titulo="Sem horários" descricao="Adicione as janelas em que você costuma atender." />
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {disponibilidade.map((d) => (
              <li key={d.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-slate-800">
                  <strong>{DIAS[d.diaSemana]}</strong> · {minutosParaHora(d.inicioMin)}–{minutosParaHora(d.fimMin)}
                </span>
                <ActionForm action={removerDisponibilidade} submitLabel="Remover" variant="ghost" size="sm" className="space-y-0">
                  <input type="hidden" name="id" value={d.id} />
                </ActionForm>
              </li>
            ))}
          </ul>
        )}

        <div className="rounded-xl border border-slate-200 p-4">
          <ActionForm action={adicionarDisponibilidade} submitLabel="Adicionar janela">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="diaSemana">Dia</Label>
                <select
                  id="diaSemana"
                  name="diaSemana"
                  defaultValue="1"
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                >
                  {DIAS.map((nome, i) => (
                    <option key={i} value={i}>
                      {nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inicio">Início</Label>
                <Input id="inicio" name="inicio" type="time" defaultValue="08:00" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fim">Fim</Label>
                <Input id="fim" name="fim" type="time" defaultValue="17:00" required />
              </div>
            </div>
          </ActionForm>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold text-slate-900">Bloqueios</h2>
        {bloqueios.length === 0 ? (
          <EmptyState titulo="Nenhum bloqueio" descricao="Marque folgas ou compromissos em datas específicas." />
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {bloqueios.map((b) => (
              <li key={b.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-slate-800">
                  <strong>{formatData(b.data)}</strong>
                  {b.inicioMin != null && b.fimMin != null
                    ? ` · ${minutosParaHora(b.inicioMin)}–${minutosParaHora(b.fimMin)}`
                    : " · dia inteiro"}
                  {b.motivo ? ` — ${b.motivo}` : ""}
                </span>
                <ActionForm action={removerBloqueio} submitLabel="Remover" variant="ghost" size="sm" className="space-y-0">
                  <input type="hidden" name="id" value={b.id} />
                </ActionForm>
              </li>
            ))}
          </ul>
        )}

        <div className="rounded-xl border border-slate-200 p-4">
          <ActionForm action={adicionarBloqueio} submitLabel="Adicionar bloqueio">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="data">Data</Label>
                <Input id="data" name="data" type="date" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="motivo">Motivo (opcional)</Label>
                <Input id="motivo" name="motivo" maxLength={200} />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="diaInteiro" defaultChecked /> Dia inteiro
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Input name="inicio" type="time" aria-label="Início do bloqueio" />
                <Input name="fim" type="time" aria-label="Fim do bloqueio" />
              </div>
            </div>
          </ActionForm>
        </div>
      </div>
    </section>
  );
}
