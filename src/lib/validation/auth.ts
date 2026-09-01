import { z } from "zod";

const digitos = (v: string) => v.replace(/\D/g, "");

export const loginSchema = z.object({
  email: z.email("E-mail inválido").trim().toLowerCase(),
  senha: z.string().min(1, "Informe a senha"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const cadastroClienteSchema = z
  .object({
    nome: z.string().trim().min(2, "Informe seu nome completo").max(120),
    email: z.email("E-mail inválido").trim().toLowerCase(),
    telefone: z
      .string()
      .trim()
      .transform(digitos)
      .refine((v) => v.length >= 10 && v.length <= 11, "Telefone com DDD (10 ou 11 dígitos)"),
    senha: z.string().min(8, "Mínimo de 8 caracteres").max(72),
    confirmarSenha: z.string(),
    tipo: z.enum(["PF", "PJ"]),
    cnpj: z.string().trim().transform(digitos).default(""),
    razaoSocial: z.string().trim().max(200).default(""),
    aceiteTermos: z.literal(true, { error: "É preciso aceitar os termos e a política de privacidade" }),
  })
  .refine((d) => d.senha === d.confirmarSenha, {
    error: "As senhas não conferem",
    path: ["confirmarSenha"],
  })
  .refine((d) => d.tipo !== "PJ" || d.cnpj.length === 14, {
    error: "Informe um CNPJ válido (14 dígitos)",
    path: ["cnpj"],
  })
  .refine((d) => d.tipo !== "PJ" || d.razaoSocial.length >= 2, {
    error: "Informe a razão social",
    path: ["razaoSocial"],
  });
export type CadastroClienteInput = z.infer<typeof cadastroClienteSchema>;
