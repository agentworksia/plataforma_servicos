"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { cadastroClienteSchema, loginSchema } from "@/lib/validation/auth";
import { painelHref } from "@/lib/auth/dal";

export type FormState = {
  errors?: Record<string, string[]>;
  message?: string;
  values?: Record<string, string>;
} | undefined;

export type LoginState = { error?: string } | undefined;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  });
  if (!parsed.success) {
    return { error: "Preencha e-mail e senha." };
  }

  try {
    await signIn("credentials", { ...parsed.data, redirect: false });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "E-mail ou senha incorretos." };
    }
    throw err;
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { role: true },
  });
  redirect(user ? painelHref(user.role) : "/");
}

export async function cadastroClienteAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const brutos = {
    nome: String(formData.get("nome") ?? ""),
    email: String(formData.get("email") ?? ""),
    telefone: String(formData.get("telefone") ?? ""),
    tipo: String(formData.get("tipo") ?? "PF"),
    cnpj: String(formData.get("cnpj") ?? ""),
    razaoSocial: String(formData.get("razaoSocial") ?? ""),
    senha: String(formData.get("senha") ?? ""),
    confirmarSenha: String(formData.get("confirmarSenha") ?? ""),
    aceiteTermos: formData.get("aceiteTermos") === "on",
  };
  const manter = { nome: brutos.nome, email: brutos.email, telefone: brutos.telefone, tipo: brutos.tipo, cnpj: brutos.cnpj, razaoSocial: brutos.razaoSocial };

  const parsed = cadastroClienteSchema.safeParse(brutos);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values: manter };
  }
  const dados = parsed.data;

  const jaExiste = await db.user.findUnique({ where: { email: dados.email }, select: { id: true } });
  if (jaExiste) {
    return { errors: { email: ["Já existe uma conta com esse e-mail."] }, values: manter };
  }

  const agora = new Date();
  await db.user.create({
    data: {
      name: dados.nome,
      email: dados.email,
      telefone: dados.telefone,
      passwordHash: await bcrypt.hash(dados.senha, 10),
      role: "CLIENTE",
      aceiteTermosEm: agora,
      aceitePrivacidadeEm: agora,
      clientProfile: {
        create: {
          tipo: dados.tipo,
          cnpj: dados.tipo === "PJ" ? dados.cnpj : null,
          razaoSocial: dados.tipo === "PJ" ? dados.razaoSocial : null,
        },
      },
    },
  });

  try {
    await signIn("credentials", { email: dados.email, senha: dados.senha, redirect: false });
  } catch (err) {
    if (err instanceof AuthError) {
      // Conta criada mas o auto-login falhou — manda pro login manual.
      redirect("/login");
    }
    throw err;
  }

  redirect("/cliente");
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
