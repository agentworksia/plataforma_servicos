"use client";

import { useActionState } from "react";
import Link from "next/link";
import { redefinirSenha, type RedefinicaoState } from "@/lib/auth/recuperacao";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RedefinirSenhaForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<RedefinicaoState, FormData>(
    redefinirSenha,
    undefined,
  );
  const concluido = state !== undefined && !state.erro && !state.erros;

  if (concluido) {
    return (
      <div className="space-y-4">
        <p className="leading-relaxed text-pedra-700">
          Senha trocada. As sessões abertas em outros aparelhos foram encerradas.
        </p>
        <Link href="/login" className="inline-block text-sm text-mar-700 hover:underline">
          Entrar com a senha nova
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <div className="space-y-1.5">
        <Label htmlFor="senha">Senha nova</Label>
        <Input
          id="senha"
          name="senha"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        {state?.erros?.senha?.[0] && <p className="text-sm text-red-700">{state.erros.senha[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmarSenha">Repita a senha nova</Label>
        <Input
          id="confirmarSenha"
          name="confirmarSenha"
          type="password"
          autoComplete="new-password"
          required
        />
        {state?.erros?.confirmarSenha?.[0] && (
          <p className="text-sm text-red-700">{state.erros.confirmarSenha[0]}</p>
        )}
      </div>

      {state?.erro && <p className="text-sm leading-relaxed text-red-700">{state.erro}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Salvando…" : "Salvar senha nova"}
      </Button>
    </form>
  );
}
