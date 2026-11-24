import "server-only";
import { z } from "zod";

// Validação das variáveis de ambiente do servidor.
// Em runtime, falha cedo se algo essencial faltar. Durante `next build` (sem env configurada
// ainda, ex.: 1º deploy na Vercel) apenas avisa, para o build do esqueleto não quebrar.
//
// Obrigatórias = o que o app já usa hoje (banco, auth, storage server-side).
// Opcionais = o que só será usado quando a feature correspondente entrar.
const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(1),
  AUTH_URL: z.string().url().optional(),

  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(), // só p/ uso client-side (ainda não há)
  SUPABASE_BUCKET_DOCUMENTOS: z.string().min(1).default("documentos"),
  SUPABASE_BUCKET_PERFIL: z.string().min(1).default("perfil"),

  RESEND_API_KEY: z.string().min(1).optional(), // e-mail transacional (nenhuma feature envia ainda)
  EMAIL_FROM: z.string().min(1).optional(),

  PAYMENT_PROVIDER: z
    .enum(["fake", "mercadopago", "pagarme", "stripe", "asaas", "iugu"])
    .default("fake")
    .catch((ctx) => {
      console.error("PAYMENT_PROVIDER inválido; caindo para 'fake'.", ctx.error.issues);
      return "fake";
    }),

  // Asaas. Só exigidas quando PAYMENT_PROVIDER=asaas — a checagem está em payments/asaas.ts,
  // para o build e o ambiente de desenvolvimento não quebrarem sem elas.
  // Estas aceitam qualquer coisa de propósito. O formato é conferido no ponto de uso,
  // e não aqui: um valor malformado numa variável de feature não pode derrubar o site
  // inteiro — foi exatamente o que aconteceu em 24/11/2026.
  ASAAS_API_KEY: z.string().optional(),
  ASAAS_AMBIENTE: z.enum(["sandbox", "producao"]).default("sandbox").catch("sandbox"),
  /** Token que o Asaas devolve no header asaas-access-token. Mínimo de 32 conferido no uso. */
  ASAAS_WEBHOOK_TOKEN: z.string().optional(),
  /**
   * Split liga o repasse automático para a carteira da profissional. Desligado, o valor
   * inteiro fica na conta da plataforma e o repasse sai por transferência na conclusão.
   */
  ASAAS_SPLIT: z
    .enum(["on", "off"])
    .default("on")
    .catch("on")
    .transform((v) => v === "on"),

  /** Protege /api/cron/*. A Vercel manda no header Authorization: Bearer <valor>. */
  CRON_SECRET: z.string().optional(),

  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

export type Env = z.infer<typeof serverSchema>;

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
const parsed = serverSchema.safeParse(process.env);

if (!parsed.success) {
  const detalhe = z.flattenError(parsed.error).fieldErrors;
  if (isBuildPhase) {
    console.warn("⚠️  Variáveis de ambiente incompletas no build:", detalhe);
    console.warn("    Configure-as no painel da Vercel antes de usar o app.");
  } else {
    console.error("❌ Variáveis de ambiente inválidas:", detalhe);
    throw new Error("Configuração de ambiente inválida. Confira o .env (base em .env.example).");
  }
}

export const env: Env = parsed.success ? parsed.data : (process.env as unknown as Env);
