import { z } from "zod";

/**
 * Limpa antes de validar. O teclado do celular completa o endereço e deixa um espaço;
 * copiar de WhatsApp, PDF ou contato traz espaço não-separável (U+00A0) ou caractere de
 * largura zero, que `type="email"` do navegador não remove por não serem espaço ASCII.
 */
export function normalizarEmail(valor: string): string {
  return valor
    .replace(/[​-‍﻿]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Normaliza e só então valida — `z.email().trim()` faz o contrário, e recusa
 * "maria@gmail.com " como endereço inválido.
 */
export const emailSchema = z
  .string()
  .transform(normalizarEmail)
  .pipe(z.email("E-mail inválido"));
