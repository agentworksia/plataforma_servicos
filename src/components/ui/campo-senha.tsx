"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CampoSenhaProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

export function CampoSenha({ className, ...props }: CampoSenhaProps) {
  const [visivel, setVisivel] = React.useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visivel ? "text" : "password"}
        // Espaço à direita para o texto não correr por baixo do botão.
        className={cn("pr-11", className)}
      />
      <button
        type="button"
        onClick={() => setVisivel((v) => !v)}
        aria-pressed={visivel}
        aria-label={visivel ? "Esconder a senha" : "Mostrar a senha"}
        title={visivel ? "Esconder a senha" : "Mostrar a senha"}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-botao text-areia-500 transition-colors hover:text-marinho-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marinho-600/25"
      >
        {visivel ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  );
}
