import type { Metadata } from "next";
import { AuthCard } from "@/components/auth-card";
import { EsqueciSenhaForm } from "./esqueci-senha-form";

export const metadata: Metadata = { title: "Esqueci minha senha" };

export default function EsqueciSenhaPage() {
  return (
    <AuthCard className="max-w-md">
      <h1 className="titulo text-2xl text-mar-900">Esqueci minha senha</h1>
      <p className="mt-2 text-sm leading-relaxed text-pedra-600">
        A gente manda um link para você criar uma senha nova.
      </p>
      <div className="mt-6">
        <EsqueciSenhaForm />
      </div>
    </AuthCard>
  );
}
