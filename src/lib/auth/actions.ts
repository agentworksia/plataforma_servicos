"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validation/auth";
import { painelHref } from "@/lib/auth/dal";

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

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
