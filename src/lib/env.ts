import "server-only";
import { z } from "zod";

// Validação das variáveis de ambiente do servidor. Falha cedo (no boot) se algo essencial faltar.
const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(1),
  AUTH_URL: z.string().url().optional(),

  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_BUCKET_DOCUMENTOS: z.string().min(1).default("documentos"),
  SUPABASE_BUCKET_PERFIL: z.string().min(1).default("perfil"),

  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),

  PAYMENT_PROVIDER: z.enum(["fake", "mercadopago", "pagarme", "stripe", "asaas", "iugu"]).default("fake"),

  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

const parsed = serverSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variáveis de ambiente inválidas:", z.flattenError(parsed.error).fieldErrors);
  throw new Error("Configuração de ambiente inválida. Confira o .env (base em .env.example).");
}

export const env = parsed.data;
