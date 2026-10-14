"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { solicitarRecuperacao, type RecuperacaoState } from "@/lib/auth/recuperacao";
import { CANAIS_RECUPERACAO } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function EsqueciSenhaForm() {
  const [state, action, pending] = useActionState<RecuperacaoState, FormData>(
    solicitarRecuperacao,
    undefined,
  );
  const [canal, setCanal] = useState("EMAIL");

  if (state?.enviado) {
    return (
      <div className="space-y-4">
        <p className="leading-relaxed text-pedra-700">
          Se existir uma conta com <span className="font-medium text-pedra-900">{state.email}</span>,
          acabamos de enviar um link para criar uma senha nova.
        </p>
        <p className="text-sm leading-relaxed text-pedra-500">
          O link vale por uma hora e só funciona uma vez. Confira também a caixa de spam.
        </p>
        <Link href="/login" className="inline-block text-sm text-mar-700 hover:underline">
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <fieldset>
        <legend className="text-sm font-medium text-pedra-800">Como quer receber o link?</legend>
        <div className="mt-2 space-y-2">
          {CANAIS_RECUPERACAO.map((c) => (
            <label
              key={c.value}
              className={cn(
                "flex items-center gap-2.5 rounded-botao border p-3 text-sm",
                !c.disponivel && "cursor-not-allowed opacity-60",
                c.disponivel && canal === c.value
                  ? "cursor-pointer border-mar-600 bg-mar-50 text-mar-900"
                  : "cursor-pointer border-pedra-200 text-pedra-700",
              )}
            >
              <input
                type="radio"
                name="canal"
                value={c.value}
                checked={canal === c.value}
                disabled={!c.disponivel}
                onChange={() => setCanal(c.value)}
                className="accent-mar-700"
              />
              <span>{c.label}</span>
              {!c.disponivel && (
                <span className="ml-auto rounded-full bg-pedra-100 px-2 py-0.5 text-xs text-pedra-600">
                  em breve
                </span>
              )}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail cadastrado</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      {state?.erro && <p className="text-sm text-red-700">{state.erro}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Enviando…" : "Enviar link de recuperação"}
      </Button>

      <p className="text-center text-sm">
        <Link href="/login" className="text-mar-700 hover:underline">
          Lembrei a senha, voltar para o login
        </Link>
      </p>
    </form>
  );
}
