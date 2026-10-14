"use server";

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { MARCA } from "@/lib/marca";
import { redefinirSenhaSchema, solicitarRecuperacaoSchema } from "@/lib/validation/auth";

const VALIDADE_MINUTOS = 60;
const PREFIXO = "recuperacao:";

/** O link carrega o token em claro; o banco guarda só o hash, como se faz com senha. */
function hash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type RecuperacaoState = { erro?: string; enviado?: boolean; email?: string } | undefined;
export type RedefinicaoState = { erros?: Record<string, string[]>; erro?: string } | undefined;

function corpoEmail(nome: string | null, link: string): string {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:520px;color:#18202a;line-height:1.6">
      <p>Olá${nome ? `, ${nome}` : ""}!</p>
      <p>Recebemos um pedido para redefinir a senha da sua conta na ${MARCA.nome}.</p>
      <p style="margin:28px 0">
        <a href="${link}"
           style="background:#123e61;color:#fff;padding:12px 22px;border-radius:10px;
                  text-decoration:none;font-weight:600;display:inline-block">
          Criar uma senha nova
        </a>
      </p>
      <p style="color:#53606f;font-size:14px">
        O link vale por ${VALIDADE_MINUTOS} minutos e só pode ser usado uma vez.
        Se não foi você que pediu, pode ignorar esta mensagem — sua senha continua a mesma.
      </p>
    </div>`;
}

export async function solicitarRecuperacao(
  _prev: RecuperacaoState,
  formData: FormData,
): Promise<RecuperacaoState> {
  const parsed = solicitarRecuperacaoSchema.safeParse({
    canal: formData.get("canal") ?? "EMAIL",
    email: formData.get("email"),
  });
  if (!parsed.success) return { erro: "Informe um e-mail válido." };

  if (parsed.data.canal === "SMS") {
    return { erro: "O envio por SMS ainda não está disponível. Use o e-mail cadastrado." };
  }

  const { email } = parsed.data;
  const user = await db.user.findUnique({ where: { email }, select: { id: true, name: true } });

  // Responde igual existindo ou não a conta: senão a tela vira um verificador de cadastro.
  if (user) {
    const token = randomBytes(32).toString("hex");
    const identifier = `${PREFIXO}${email}`;

    // Um pedido invalida os anteriores.
    await db.verificationToken.deleteMany({ where: { identifier } });
    await db.verificationToken.create({
      data: {
        identifier,
        token: hash(token),
        expires: new Date(Date.now() + VALIDADE_MINUTOS * 60_000),
      },
    });

    const base = env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
    const link = `${base}/redefinir-senha?token=${token}`;
    try {
      const { enviarEmail } = await import("@/lib/email");
      await enviarEmail({
        para: email,
        assunto: `Redefinir sua senha na ${MARCA.nome}`,
        html: corpoEmail(user.name, link),
      });
    } catch (err) {
      console.error("[recuperacao] envio de e-mail falhou", err);
      return { erro: "Não conseguimos enviar o e-mail agora. Tente de novo em alguns minutos." };
    }
  }

  return { enviado: true, email };
}

/** Confere o token sem consumir — usado pela página antes de mostrar o formulário. */
export async function tokenValido(token: string): Promise<boolean> {
  if (!token) return false;
  const registro = await db.verificationToken.findFirst({
    where: { token: hash(token), expires: { gt: new Date() } },
    select: { identifier: true },
  });
  return registro !== null;
}

export async function redefinirSenha(
  _prev: RedefinicaoState,
  formData: FormData,
): Promise<RedefinicaoState> {
  const parsed = redefinirSenhaSchema.safeParse({
    token: formData.get("token"),
    senha: formData.get("senha"),
    confirmarSenha: formData.get("confirmarSenha"),
  });
  if (!parsed.success) return { erros: z.flattenError(parsed.error).fieldErrors };

  const registro = await db.verificationToken.findFirst({
    where: { token: hash(parsed.data.token), expires: { gt: new Date() } },
  });
  if (!registro) {
    return { erro: "Esse link expirou ou já foi usado. Peça um novo em “Esqueci minha senha”." };
  }

  const email = registro.identifier.slice(PREFIXO.length);
  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return { erro: "Conta não encontrada." };

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.senha, 10) },
  });
  // Token é de uso único; some assim que a senha troca.
  await db.verificationToken.deleteMany({ where: { identifier: registro.identifier } });
  // Derruba sessões antigas: quem trocou a senha espera que o acesso anterior caia.
  await db.session.deleteMany({ where: { userId: user.id } });

  return {};
}
