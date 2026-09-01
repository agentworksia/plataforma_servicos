import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { formatData, formatBRL, minutosParaHora } from "@/lib/format";
import { LABEL_SERVICO } from "@/lib/bookings/display";
import { aceitarOferta, recusarOferta } from "@/lib/professionals/ofertas-actions";
import { ActionForm } from "@/components/action-form";
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
    select: { id: true, status: true },
  });
  const aviso = perfil ? AVISO[perfil.status] : null;

  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);

  const [ofertas, proximos] = perfil
    ? await Promise.all([
        db.bookingOffer.findMany({
          where: { professionalId: perfil.id, status: "PENDENTE", expiraEm: { gt: new Date() } },
          orderBy: { criadoEm: "asc" },
          select: {
            id: true,
            expiraEm: true,
            booking: {
              select: {
                id: true,
                tipoServico: true,
                data: true,
                inicioMin: true,
                duracaoHoras: true,
                repasseProfissional: true,
                address: { select: { bairro: true, cidade: true } },
              },
            },
          },
        }),
        db.booking.findMany({
          where: { professionalId: perfil.id, status: { in: ["AGENDADO", "EM_ANDAMENTO"] }, data: { gte: hoje } },
          orderBy: { data: "asc" },
          select: {
            id: true,
            tipoServico: true,
            data: true,
            inicioMin: true,
            duracaoHoras: true,
            status: true,
            address: { select: { bairro: true, cidade: true } },
          },
        }),
      ])
    : [[], []];

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ofertas de serviço</h1>
        <p className="mt-1 text-slate-600">Aceite ou recuse cada oferta dentro do prazo.</p>
      </div>

      {aviso && (
        <div className={`rounded-xl border p-4 ${aviso.cor}`}>
          <p className="font-semibold">{aviso.titulo}</p>
          <p className="mt-1 text-sm">{aviso.texto}</p>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="font-semibold text-slate-900">Ofertas pendentes</h2>
        {ofertas.length === 0 ? (
          <EmptyState titulo="Sem ofertas no momento" descricao="Quando um serviço combinar com seu perfil e agenda, aparece aqui." />
        ) : (
          <ul className="space-y-3">
            {ofertas.map((o) => (
              <li key={o.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="text-sm">
                    <div className="font-medium text-slate-900">{LABEL_SERVICO[o.booking.tipoServico] ?? o.booking.tipoServico}</div>
                    <div className="text-slate-500">
                      {formatData(o.booking.data)} · {minutosParaHora(o.booking.inicioMin)} · {o.booking.duracaoHoras}h ·{" "}
                      {o.booking.address.bairro}, {o.booking.address.cidade}
                    </div>
                    <div className="mt-1 text-slate-700">Você recebe {formatBRL(o.booking.repasseProfissional)}</div>
                  </div>
                  <div className="flex gap-2">
                    <ActionForm action={aceitarOferta} submitLabel="Aceitar" size="sm" className="space-y-0">
                      <input type="hidden" name="offerId" value={o.id} />
                    </ActionForm>
                    <ActionForm action={recusarOferta} submitLabel="Recusar" variant="outline" size="sm" className="space-y-0">
                      <input type="hidden" name="offerId" value={o.id} />
                    </ActionForm>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-slate-900">Próximos serviços</h2>
        {proximos.length === 0 ? (
          <p className="text-sm text-slate-500">Nada agendado.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {proximos.map((b) => (
              <li key={b.id}>
                <Link href={`/profissional/servicos/${b.id}`} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50">
                  <span>
                    <strong>{formatData(b.data)}</strong> · {minutosParaHora(b.inicioMin)} · {b.duracaoHoras}h —{" "}
                    {LABEL_SERVICO[b.tipoServico] ?? b.tipoServico}, {b.address.bairro}
                  </span>
                  <span className="text-teal-700">abrir</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
