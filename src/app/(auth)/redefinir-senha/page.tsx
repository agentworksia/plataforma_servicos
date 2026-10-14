import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { tokenValido } from "@/lib/auth/recuperacao";
import { RedefinirSenhaForm } from "./redefinir-senha-form";

export const metadata: Metadata = { title: "Criar uma senha nova" };

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const valido = await tokenValido(token ?? "");

  return (
    <AuthCard className="max-w-md">
      <h1 className="titulo text-2xl text-mar-900">Criar uma senha nova</h1>

      {valido ? (
        <>
          <p className="mt-2 text-sm leading-relaxed text-pedra-600">
            Escolha uma senha de pelo menos 8 caracteres.
          </p>
          <div className="mt-6">
            <RedefinirSenhaForm token={token!} />
          </div>
        </>
      ) : (
        <div className="mt-4 space-y-4">
          <p className="leading-relaxed text-pedra-700">
            Esse link expirou ou já foi usado. Cada link vale por uma hora e serve uma vez só.
          </p>
          <Link
            href="/esqueci-senha"
            className="inline-block text-sm font-medium text-mar-700 hover:underline"
          >
            Pedir um link novo
          </Link>
        </div>
      )}
    </AuthCard>
  );
}
