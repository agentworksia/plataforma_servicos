"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { CampoSenha } from "@/components/ui/campo-senha";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, undefined);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor="senha">Senha</Label>
          <Link href="/esqueci-senha" className="text-sm text-marinho-700 hover:underline">
            Esqueci minha senha
          </Link>
        </div>
        <CampoSenha id="senha" name="senha" autoComplete="current-password" required />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
