import { z } from "zod";
import { emailSchema } from "@/lib/validation/email";

const digitos = (v: string) => v.replace(/\D/g, "");

export const TIPOS_SERVICO = [
  { value: "DIARIA_PADRAO", label: "Diária de limpeza padrão" },
  { value: "PASSADORIA", label: "Passadoria" },
  { value: "POS_OBRA", label: "Limpeza pós-obra" },
  { value: "CORPORATIVA", label: "Corporativa / governamental" },
  { value: "DOG_WALKER", label: "Dog walker (passeio com cães)" },
] as const;

export const TIPOS_CHAVE_PIX = [
  { value: "CPF", label: "CPF" },
  { value: "EMAIL", label: "E-mail" },
  { value: "TELEFONE", label: "Telefone" },
  { value: "ALEATORIA", label: "Chave aleatória" },
] as const;

function maiorDeIdade(dataISO: string): boolean {
  const nasc = new Date(dataISO);
  if (Number.isNaN(nasc.getTime())) return false;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade >= 18 && idade < 100;
}

export const cadastroProfissionalSchema = z
  .object({
    nome: z.string().trim().min(2, "Informe seu nome completo").max(120),
    email: emailSchema,
    telefone: z
      .string()
      .trim()
      .transform(digitos)
      .refine((v) => v.length >= 10 && v.length <= 11, "Telefone com DDD (10 ou 11 dígitos)"),
    cpf: z
      .string()
      .trim()
      .transform(digitos)
      .refine((v) => v.length === 11, "CPF deve ter 11 dígitos"),
    dataNascimento: z.string().refine(maiorDeIdade, "É preciso ter 18 anos ou mais"),
    bio: z.string().trim().max(500, "Máximo de 500 caracteres").default(""),
    senha: z.string().min(8, "Mínimo de 8 caracteres").max(72),
    confirmarSenha: z.string(),
    tiposServico: z
      .array(z.enum(["DIARIA_PADRAO", "PASSADORIA", "POS_OBRA", "CORPORATIVA", "DOG_WALKER"]))
      .min(1, "Escolha ao menos um tipo de serviço"),
    serviceAreaIds: z.array(z.string().min(1)).min(1, "Escolha ao menos uma região"),
    // Endereço e renda vão para o Asaas abrir a conta que recebe o repasse. Sem eles a
    // subconta não é criada e a profissional não consegue receber.
    cep: z
      .string()
      .trim()
      .transform(digitos)
      .refine((v) => v.length === 8, "CEP deve ter 8 dígitos"),
    logradouro: z.string().trim().min(3, "Informe a rua").max(200),
    numeroEnd: z.string().trim().min(1, "Informe o número").max(20),
    complemento: z.string().trim().max(120).default(""),
    bairro: z.string().trim().min(2, "Informe o bairro").max(120),
    cidade: z.string().trim().min(2, "Informe a cidade").max(120),
    uf: z.string().trim().length(2, "UF com 2 letras").toUpperCase(),
    rendaMensal: z.coerce
      .number()
      .min(1, "Informe uma renda mensal aproximada")
      .max(1_000_000, "Valor acima do permitido"),
    repassePixTipo: z.enum(["CPF", "EMAIL", "TELEFONE", "ALEATORIA"]),
    repassePixChave: z.string().trim().min(3, "Informe a chave Pix").max(140),
    aceiteTermos: z.literal(true, { error: "É preciso aceitar os termos e a política de privacidade" }),
    consentimentoDocumentos: z.literal(true, {
      error: "É preciso consentir com o envio e a guarda dos documentos",
    }),
  })
  .refine((d) => d.senha === d.confirmarSenha, {
    error: "As senhas não conferem",
    path: ["confirmarSenha"],
  });

export type CadastroProfissionalInput = z.infer<typeof cadastroProfissionalSchema>;

// Regras dos arquivos (validadas na server action, não no zod).
export const MAX_ARQUIVO_BYTES = 6 * 1024 * 1024;
export const MIME_FOTO = ["image/jpeg", "image/png", "image/webp"];
export const MIME_DOCUMENTO = [...MIME_FOTO, "application/pdf"];
