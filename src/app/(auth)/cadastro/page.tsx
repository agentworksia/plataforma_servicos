import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Criar conta" };

export default function CadastroPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Criar conta</h1>
      <p className="mt-2 text-sm text-slate-600">
        O cadastro de cliente e o cadastro da profissional (com envio de documentos e aprovação manual)
        entram na próxima etapa do projeto. As regras de validação já estão definidas em{" "}
        <code className="rounded bg-slate-100 px-1">src/lib/validation/auth.ts</code>.
      </p>

      <p className="mt-6 text-sm text-slate-600">
        <Link href="/login" className="font-medium text-teal-700 hover:underline">
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}
