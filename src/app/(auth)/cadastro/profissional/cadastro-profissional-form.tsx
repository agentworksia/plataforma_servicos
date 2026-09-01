"use client";

import { useActionState, useState } from "react";
import { cadastroProfissionalAction, type FormState } from "@/lib/auth/actions";
import { TIPOS_CHAVE_PIX, TIPOS_SERVICO } from "@/lib/validation/profissional";
import { downscaleImagem } from "@/lib/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Regiao = { id: string; cidade: string; bairro: string | null };

function Erro({ msg }: { msg?: string }) {
  return msg ? <p className="text-sm text-red-600">{msg}</p> : null;
}

// Reduz a imagem escolhida antes do submit, trocando o arquivo do input.
async function reduzirNoInput(ev: React.ChangeEvent<HTMLInputElement>, maxLado: number) {
  const input = ev.currentTarget;
  const file = input.files?.[0];
  if (!file || !file.type.startsWith("image/")) return;
  try {
    const menor = await downscaleImagem(file, maxLado);
    if (menor === file) return;
    const dt = new DataTransfer();
    dt.items.add(menor);
    input.files = dt.files;
  } catch {
    /* mantém o original; o backend valida tamanho/formato */
  }
}

export function CadastroProfissionalForm({ regioes }: { regioes: Regiao[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(cadastroProfissionalAction, undefined);
  const e = state?.errors ?? {};
  const raw = state?.values ?? {};
  const v = (k: string) => (typeof raw[k] === "string" ? (raw[k] as string) : "");
  const arr = (k: string) => (Array.isArray(raw[k]) ? (raw[k] as string[]) : []);
  const [tipoPix, setTipoPix] = useState<string>(v("repassePixTipo") || "CPF");
  const marcadoTipo = new Set(arr("tiposServico"));
  const marcadaRegiao = new Set(arr("serviceAreaIds"));

  return (
    <form action={action} className="space-y-6">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Dados pessoais</h2>
        <div className="space-y-1.5">
          <Label htmlFor="nome">Nome completo</Label>
          <Input id="nome" name="nome" defaultValue={v("nome")} autoComplete="name" required />
          <Erro msg={e.nome?.[0]} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" defaultValue={v("email")} autoComplete="email" required />
            <Erro msg={e.email?.[0]} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telefone">Telefone (com DDD)</Label>
            <Input id="telefone" name="telefone" type="tel" defaultValue={v("telefone")} placeholder="41 99999-9999" required />
            <Erro msg={e.telefone?.[0]} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cpf">CPF</Label>
            <Input id="cpf" name="cpf" defaultValue={v("cpf")} inputMode="numeric" placeholder="000.000.000-00" required />
            <Erro msg={e.cpf?.[0]} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dataNascimento">Data de nascimento</Label>
            <Input id="dataNascimento" name="dataNascimento" type="date" defaultValue={v("dataNascimento")} required />
            <Erro msg={e.dataNascimento?.[0]} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="senha">Senha</Label>
            <Input id="senha" name="senha" type="password" autoComplete="new-password" required />
            <Erro msg={e.senha?.[0]} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmarSenha">Confirmar senha</Label>
            <Input id="confirmarSenha" name="confirmarSenha" type="password" autoComplete="new-password" required />
            <Erro msg={e.confirmarSenha?.[0]} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Perfil e documento</h2>
        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio curta (opcional)</Label>
          <Textarea id="bio" name="bio" defaultValue={v("bio")} maxLength={500} placeholder="Conte um pouco da sua experiência." />
          <Erro msg={e.bio?.[0]} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fotoPerfil">Foto de perfil</Label>
          <Input
            id="fotoPerfil"
            name="fotoPerfil"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(ev) => reduzirNoInput(ev, 1200)}
            required
          />
          <Erro msg={e.fotoPerfil?.[0]} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="documento">Documento com foto (RG ou CNH)</Label>
          <Input
            id="documento"
            name="documento"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(ev) => reduzirNoInput(ev, 2000)}
            required
          />
          <p className="text-xs text-slate-500">Acesso restrito ao time de aprovação.</p>
          <Erro msg={e.documento?.[0]} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Tipos de serviço que atende</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {TIPOS_SERVICO.map((t) => (
            <label key={t.value} className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="tiposServico" value={t.value} defaultChecked={marcadoTipo.has(t.value)} />
              {t.label}
            </label>
          ))}
        </div>
        <Erro msg={e.tiposServico?.[0]} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Regiões que atende</h2>
        <div className="grid max-h-52 gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
          {regioes.map((r) => (
            <label key={r.id} className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="serviceAreaIds" value={r.id} defaultChecked={marcadaRegiao.has(r.id)} />
              {r.cidade}
              {r.bairro ? ` — ${r.bairro}` : ""}
            </label>
          ))}
        </div>
        <Erro msg={e.serviceAreaIds?.[0]} />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Dados de repasse (Pix)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="repassePixTipo">Tipo de chave</Label>
            <select
              id="repassePixTipo"
              name="repassePixTipo"
              value={tipoPix}
              onChange={(ev) => setTipoPix(ev.target.value)}
              className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              {TIPOS_CHAVE_PIX.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <Erro msg={e.repassePixTipo?.[0]} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="repassePixChave">Chave Pix</Label>
            <Input id="repassePixChave" name="repassePixChave" defaultValue={v("repassePixChave")} required />
            <Erro msg={e.repassePixChave?.[0]} />
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" name="aceiteTermos" className="mt-1" />
          <span>Li e aceito os termos de uso e a política de privacidade (LGPD).</span>
        </label>
        <Erro msg={e.aceiteTermos?.[0]} />
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" name="consentimentoDocumentos" className="mt-1" />
          <span>Autorizo o envio e a guarda dos meus documentos para verificação de identidade.</span>
        </label>
        <Erro msg={e.consentimentoDocumentos?.[0]} />
      </section>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Enviando cadastro…" : "Enviar cadastro"}
      </Button>
      <p className="text-center text-xs text-slate-500">
        Sua conta passa por aprovação manual antes de receber ofertas.
      </p>
    </form>
  );
}
