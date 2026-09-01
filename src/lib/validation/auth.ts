import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("E-mail inválido").trim().toLowerCase(),
  senha: z.string().min(1, "Informe a senha"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const cadastroClienteSchema = z
  .object({
    nome: z.string().min(2, "Informe seu nome").trim(),
    email: z.email("E-mail inválido").trim().toLowerCase(),
    telefone: z.string().min(10, "Telefone inválido").max(20).trim(),
    senha: z.string().min(8, "Mínimo de 8 caracteres"),
    confirmarSenha: z.string(),
    tipo: z.enum(["PF", "PJ"]).default("PF"),
    cnpj: z.string().trim().optional(),
    razaoSocial: z.string().trim().optional(),
    aceiteTermos: z.literal(true, { error: "É necessário aceitar os termos" }),
  })
  .refine((d) => d.senha === d.confirmarSenha, {
    error: "As senhas não conferem",
    path: ["confirmarSenha"],
  })
  .refine((d) => d.tipo !== "PJ" || (d.cnpj && d.cnpj.length >= 14), {
    error: "Informe o CNPJ",
    path: ["cnpj"],
  });
export type CadastroClienteInput = z.infer<typeof cadastroClienteSchema>;
