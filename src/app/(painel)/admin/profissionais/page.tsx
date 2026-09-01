import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { formatData } from "@/lib/format";
import { ORDEM_STATUS, STATUS_PROFISSIONAL } from "@/lib/professionals";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { ProfessionalStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Profissionais" };

function ehStatus(v: string | undefined): v is ProfessionalStatus {
  return !!v && (ORDEM_STATUS as string[]).includes(v);
}

export default async function AdminProfissionaisPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("ADMIN");
  const { status } = await searchParams;
  const filtro = ehStatus(status) ? status : undefined;

  const [profissionais, contagem] = await Promise.all([
    db.professionalProfile.findMany({
      where: filtro ? { status: filtro } : undefined,
      orderBy: [{ status: "asc" }, { criadoEm: "asc" }],
      select: {
        id: true,
        status: true,
        criadoEm: true,
        user: { select: { name: true, email: true } },
        areas: { select: { serviceArea: { select: { cidade: true } } } },
        _count: { select: { documentos: true } },
      },
    }),
    db.professionalProfile.groupBy({ by: ["status"], _count: true }),
  ]);
  const total = (s: ProfessionalStatus) => contagem.find((c) => c.status === s)?._count ?? 0;

  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">Profissionais</h1>
      <p className="mt-1 text-slate-600">Aprovar, reprovar ou suspender contas de diaristas.</p>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <FiltroLink label="Todos" href="/admin/profissionais" ativo={!filtro} />
        {ORDEM_STATUS.map((s) => (
          <FiltroLink
            key={s}
            label={`${STATUS_PROFISSIONAL[s].label} (${total(s)})`}
            href={`/admin/profissionais?status=${s}`}
            ativo={filtro === s}
          />
        ))}
      </div>

      <div className="mt-6 overflow-x-auto">
        {profissionais.length === 0 ? (
          <EmptyState titulo="Nenhuma profissional aqui" descricao="Ajuste o filtro acima." />
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-4 font-medium">Nome</th>
                <th className="py-2 pr-4 font-medium">Regiões</th>
                <th className="py-2 pr-4 font-medium">Docs</th>
                <th className="py-2 pr-4 font-medium">Cadastro</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {profissionais.map((p) => {
                const cidades = [...new Set(p.areas.map((a) => a.serviceArea.cidade))];
                const st = STATUS_PROFISSIONAL[p.status];
                return (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-slate-900">{p.user.name ?? "—"}</div>
                      <div className="text-slate-500">{p.user.email}</div>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {cidades.slice(0, 2).join(", ")}
                      {cidades.length > 2 ? ` +${cidades.length - 2}` : ""}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{p._count.documentos}</td>
                    <td className="py-3 pr-4 text-slate-600">{formatData(p.criadoEm)}</td>
                    <td className="py-3 pr-4">
                      <Badge cor={st.cor}>{st.label}</Badge>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/admin/profissionais/${p.id}`}
                        className="font-medium text-teal-700 hover:underline"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function FiltroLink({ label, href, ativo }: { label: string; href: string; ativo: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg px-3 py-1.5 font-medium",
        ativo ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
      )}
    >
      {label}
    </Link>
  );
}
