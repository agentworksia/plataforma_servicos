import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Cadastro de profissional" };

export default function CadastroProfissionalPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Cadastro de profissional</h1>
      <p className="mt-2 text-sm text-slate-600">
        O cadastro da diarista (dados pessoais, CPF, foto de perfil, documento com foto, regiões,
        tipos de serviço, chave Pix de repasse e consentimento LGPD) é a próxima entrega. O envio
        de arquivos vai para um bucket privado no Supabase Storage, e a conta passa por aprovação
        manual antes de ficar visível.
      </p>
      <p className="mt-6 text-sm text-slate-600">
        <Link href="/cadastro" className="font-medium text-teal-700 hover:underline">
          Voltar ao cadastro de cliente
        </Link>
      </p>
    </div>
  );
}
