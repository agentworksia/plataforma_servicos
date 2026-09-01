import "server-only";
import { z } from "zod";

// Validação das variáveis de ambiente do servidor.
// Em runtime, falha cedo se algo essencial faltar. Durante `next build` (sem env configurada
// ainda, ex.: 1º deploy na Vercel) apenas avisa, para o build do esqueleto não quebrar.
const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(1),
  AUTH_URL: z.string().url().optional(),

  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  SUPABASE_BUCKET_DOCUMENTOS: z.string().min(1).default("documentos"),
  SUPABASE_BUCKET_PERFIL: z.string().min(1).default("perfil"),

  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),

  PAYMENT_PROVIDER: z.enum(["fake", "mercadopago", "pagarme", "stripe", "asaas", "iugu"]).default("fake"),

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
