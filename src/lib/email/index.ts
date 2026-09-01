import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";

// Inicialização preguiçosa: não instancia o client no load do módulo (build sem env vars).
let resend: Resend | null = null;
function client(): Resend {
  if (!resend) resend = new Resend(env.RESEND_API_KEY);
  return resend;
}

type EnviarEmailInput = {
  para: string | string[];
  assunto: string;
  html: string;
};

export async function enviarEmail({ para, assunto, html }: EnviarEmailInput) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    throw new Error("E-mail não configurado: defina RESEND_API_KEY e EMAIL_FROM.");
  }
  const { data, error } = await client().emails.send({
    from: env.EMAIL_FROM,
    to: para,
    subject: assunto,
    html,
  });
  if (error) throw error;
  return data;
}

// Templates entram conforme as features (aprovação de profissional, oferta de serviço,
// confirmação de agendamento, repasse liberado, etc.).
