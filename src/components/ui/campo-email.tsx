"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

/**
 * Espaço e caractere invisível nunca são válidos num endereço, então saem na digitação.
 * Colar de WhatsApp, PDF ou cartão de contato traz espaço não-separável (U+00A0) ou de
 * largura zero junto: o navegador não limpa esses (só o espaço ASCII), trava o envio com
 * "a parte depois de @ não deve conter o símbolo ' '" e a pessoa não vê o que está errado.
 */
const INVISIVEIS = /[\s​-‍]/g;

type CampoEmailProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

export function CampoEmail(props: CampoEmailProps) {
  function limpar(e: React.FormEvent<HTMLInputElement>) {
    const el = e.currentTarget;
    const bruto = el.value;
    const limpo = bruto.replace(INVISIVEIS, "");
    if (limpo === bruto) return;

    // Recoloca o cursor descontando o que saiu antes dele, senão ele pula para o fim.
    const cursor = el.selectionStart ?? bruto.length;
    const removidosAntes = (bruto.slice(0, cursor).match(INVISIVEIS) ?? []).length;
    el.value = limpo;
    const novo = cursor - removidosAntes;
    el.setSelectionRange(novo, novo);
  }

  return <Input {...props} type="email" onInput={limpar} />;
}
