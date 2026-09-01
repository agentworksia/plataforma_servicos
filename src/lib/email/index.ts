import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";

const resend = new Resend(env.RESEND_API_KEY);

type EnviarEmailInput = {
  para: string | string[];
  assunto: string;
  html: string;
};

export async function enviarEmail({ para, assunto, html }: EnviarEmailInput) {
  const { data, error } = await resend.emails.send({
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
