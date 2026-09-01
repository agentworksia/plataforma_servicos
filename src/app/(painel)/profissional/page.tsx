import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { EmptyState } from "@/components/ui/empty-state";
import type { ProfessionalStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Ofertas de serviço" };

const AVISO: Record<ProfessionalStatus, { cor: string; titulo: string; texto: string } | null> = {
  PENDENTE: {
    cor: "border-amber-300 bg-amber-50 text-amber-900",
    titulo: "Cadastro em análise",
    texto: "Estamos conferindo seus dados e documentos. Você recebe um e-mail assim que a conta for aprovada.",
  },
  REPROVADA: {
    cor: "border-red-300 bg-red-50 text-red-900",
    titulo: "Cadastro não aprovado",
    texto: "Entre em contato com o suporte para entender o motivo e reenviar seus dados.",
  },
  SUSPENSA: {
    cor: "border-red-300 bg-red-50 text-red-900",
    titulo: "Conta suspensa",
    texto: "Sua conta está temporariamente suspensa. Fale com o suporte.",
  },
  APROVADA: null,
};

export default async function ProfissionalPage() {
  const user = await requireRole("PROFISSIONAL");
  const perfil = await db.professionalProfile.findUnique({
    where: { userId: user.id },
    select: { status: true },
  });
  const aviso = perfil ? AVISO[perfil.status] : null;

  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">Ofertas de serviço</h1>
      <p className="mt-1 text-slate-600">Aceite ou recuse cada oferta dentro do prazo.</p>

      {aviso && (
        <div className={`mt-6 rounded-xl border p-4 ${aviso.cor}`}>
          <p className="font-semibold">{aviso.titulo}</p>
          <p className="mt-1 text-sm">{aviso.texto}</p>
        </div>
      )}

      <div className="mt-6">
        <EmptyState
          titulo="Sem ofertas no momento"
          descricao="Agenda de disponibilidade e recebimento de ofertas entram nas próximas etapas."
        />
      </div>
    </section>
  );
}
