"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { cadastroClienteSchema, loginSchema } from "@/lib/validation/auth";
import {
  cadastroProfissionalSchema,
  MAX_ARQUIVO_BYTES,
  MIME_DOCUMENTO,
  MIME_FOTO,
} from "@/lib/validation/profissional";
import { BUCKET, uploadArquivo } from "@/lib/storage";
import { painelHref } from "@/lib/auth/dal";

export type FormState = {
  errors?: Record<string, string[]>;
  message?: string;
  values?: Record<string, string | string[]>;
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

function extensao(file: File): string {
  const sub = (file.type.split("/")[1] ?? "bin").toLowerCase();
  return sub === "jpeg" ? "jpg" : sub;
}

function checarArquivo(valor: unknown, mimes: string[], label: string): File | string {
  if (!(valor instanceof File) || valor.size === 0) return `Envie ${label}.`;
  if (valor.size > MAX_ARQUIVO_BYTES) return `${label}: tamanho máximo de 6 MB.`;
  if (!mimes.includes(valor.type)) return `${label}: formato não aceito (use JPG, PNG${mimes.includes("application/pdf") ? " ou PDF" : ""}).`;
  return valor;
}

export async function cadastroProfissionalAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const brutos = {
    nome: String(formData.get("nome") ?? ""),
    email: String(formData.get("email") ?? ""),
    telefone: String(formData.get("telefone") ?? ""),
    cpf: String(formData.get("cpf") ?? ""),
    dataNascimento: String(formData.get("dataNascimento") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    senha: String(formData.get("senha") ?? ""),
    confirmarSenha: String(formData.get("confirmarSenha") ?? ""),
    tiposServico: formData.getAll("tiposServico").map(String),
    serviceAreaIds: formData.getAll("serviceAreaIds").map(String),
    repassePixTipo: String(formData.get("repassePixTipo") ?? ""),
    repassePixChave: String(formData.get("repassePixChave") ?? ""),
    aceiteTermos: formData.get("aceiteTermos") === "on",
    consentimentoDocumentos: formData.get("consentimentoDocumentos") === "on",
  };
  const manter: Record<string, string | string[]> = {
    nome: brutos.nome,
    email: brutos.email,
    telefone: brutos.telefone,
    cpf: brutos.cpf,
    dataNascimento: brutos.dataNascimento,
    bio: brutos.bio,
    tiposServico: brutos.tiposServico,
    serviceAreaIds: brutos.serviceAreaIds,
    repassePixTipo: brutos.repassePixTipo,
    repassePixChave: brutos.repassePixChave,
  };

  const parsed = cadastroProfissionalSchema.safeParse(brutos);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values: manter };
  }
  const dados = parsed.data;

  const foto = checarArquivo(formData.get("fotoPerfil"), MIME_FOTO, "a foto de perfil");
  const documento = checarArquivo(formData.get("documento"), MIME_DOCUMENTO, "o documento com foto");
  const errosArquivo: Record<string, string[]> = {};
  if (typeof foto === "string") errosArquivo.fotoPerfil = [foto];
  if (typeof documento === "string") errosArquivo.documento = [documento];
  if (Object.keys(errosArquivo).length) return { errors: errosArquivo, values: manter };

  const jaExiste = await db.user.findUnique({ where: { email: dados.email }, select: { id: true } });
  if (jaExiste) {
    return { errors: { email: ["Já existe uma conta com esse e-mail."] }, values: manter };
  }

  const areas = await db.serviceArea.findMany({
    where: { id: { in: dados.serviceAreaIds }, ativo: true },
    select: { id: true },
  });
  if (areas.length !== dados.serviceAreaIds.length) {
    return { errors: { serviceAreaIds: ["Alguma região selecionada não é válida."] }, values: manter };
  }

  // Sobe os arquivos antes de criar o registro. Se algo falhar aqui, nada é persistido.
  const marcador = crypto.randomUUID();
  const fotoPath = `pendentes/${marcador}/foto.${extensao(foto as File)}`;
  const docPath = `pendentes/${marcador}/documento.${extensao(documento as File)}`;
  try {
    await uploadArquivo(BUCKET.perfil, fotoPath, foto as File, (foto as File).type);
    await uploadArquivo(BUCKET.documentos, docPath, documento as File, (documento as File).type);
  } catch (err) {
    console.error("[cadastro profissional] upload falhou", err);
    return { message: "Não foi possível enviar os arquivos. Tente novamente.", values: manter };
  }

  const agora = new Date();
  await db.user.create({
    data: {
      name: dados.nome,
      email: dados.email,
      telefone: dados.telefone,
      passwordHash: await bcrypt.hash(dados.senha, 10),
      role: "PROFISSIONAL",
      aceiteTermosEm: agora,
      aceitePrivacidadeEm: agora,
      professionalProfile: {
        create: {
          status: "PENDENTE",
          bio: dados.bio || null,
          cpf: dados.cpf,
          dataNascimento: new Date(dados.dataNascimento),
          tiposServico: dados.tiposServico,
          repassePixTipo: dados.repassePixTipo,
          repassePixChave: dados.repassePixChave,
          fotoUrl: fotoPath,
          areas: { create: dados.serviceAreaIds.map((serviceAreaId) => ({ serviceAreaId })) },
          documentos: {
            create: {
              tipo: "IDENTIDADE",
              storagePath: docPath,
              nomeArquivo: (documento as File).name || null,
            },
          },
        },
      },
    },
  });

  try {
    await signIn("credentials", { email: dados.email, senha: dados.senha, redirect: false });
  } catch (err) {
    if (err instanceof AuthError) redirect("/login");
    throw err;
  }

  redirect("/profissional");
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
