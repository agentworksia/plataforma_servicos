"use client";

import { useActionState, useState } from "react";
import { cadastroClienteAction, type FormState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Erro({ msg }: { msg?: string }) {
  return msg ? <p className="text-sm text-red-600">{msg}</p> : null;
}

export function CadastroClienteForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(cadastroClienteAction, undefined);
  const e = state?.errors ?? {};
  const raw = state?.values ?? {};
  const v = (k: string) => (typeof raw[k] === "string" ? (raw[k] as string) : "");
  const [tipo, setTipo] = useState<string>(v("tipo") || "PF");

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="nome">Nome completo</Label>
        <Input id="nome" name="nome" defaultValue={v("nome")} autoComplete="name" required />
        <Erro msg={e.nome?.[0]} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" defaultValue={v("email")} autoComplete="email" required />
        <Erro msg={e.email?.[0]} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="telefone">Telefone (com DDD)</Label>
        <Input id="telefone" name="telefone" type="tel" defaultValue={v("telefone")} autoComplete="tel" placeholder="41 99999-9999" required />
        <Erro msg={e.telefone?.[0]} />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-800">Tipo de conta</legend>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="tipo" value="PF" checked={tipo === "PF"} onChange={() => setTipo("PF")} />
            Pessoa física
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="tipo" value="PJ" checked={tipo === "PJ"} onChange={() => setTipo("PJ")} />
            Empresa (PJ)
          </label>
        </div>
      </fieldset>

      {tipo === "PJ" && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input id="cnpj" name="cnpj" defaultValue={v("cnpj")} placeholder="00.000.000/0000-00" inputMode="numeric" />
            <Erro msg={e.cnpj?.[0]} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="razaoSocial">Razão social</Label>
            <Input id="razaoSocial" name="razaoSocial" defaultValue={v("razaoSocial")} />
            <Erro msg={e.razaoSocial?.[0]} />
          </div>
        </>
      )}

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

      <div className="space-y-1.5">
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" name="aceiteTermos" className="mt-1" />
          <span>Li e aceito os termos de uso e a política de privacidade (LGPD).</span>
        </label>
        <Erro msg={e.aceiteTermos?.[0]} />
      </div>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Criando conta…" : "Criar conta"}
      </Button>
    </form>
  );
}
