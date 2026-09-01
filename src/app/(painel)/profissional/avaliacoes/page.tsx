import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { formatData } from "@/lib/format";
import { LABEL_SERVICO } from "@/lib/bookings/display";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Avaliações" };

export default async function AvaliacoesPage() {
  const user = await requireRole("PROFISSIONAL");
  const perfil = await db.professionalProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  const reviews = perfil
    ? await db.review.findMany({
        where: { professionalId: perfil.id },
        orderBy: { criadoEm: "desc" },
        select: { id: true, nota: true, comentario: true, criadoEm: true, booking: { select: { tipoServico: true } } },
      })
    : [];

  const media = reviews.length ? reviews.reduce((s, r) => s + r.nota, 0) / reviews.length : null;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Avaliações recebidas</h1>
        {media !== null && (
          <p className="mt-1 text-slate-600">
            Média <strong>{media.toFixed(1)}</strong> em {reviews.length} avaliação(ões).
          </p>
        )}
      </div>

      {reviews.length === 0 ? (
        <EmptyState titulo="Nenhuma avaliação ainda" descricao="As avaliações dos clientes aparecem aqui após cada serviço concluído." />
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-xl border border-slate-200 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-900">
                  {r.nota}/5 · {LABEL_SERVICO[r.booking.tipoServico] ?? r.booking.tipoServico}
                </span>
                <span className="text-slate-400">{formatData(r.criadoEm)}</span>
              </div>
              {r.comentario && <p className="mt-1 text-slate-700">&ldquo;{r.comentario}&rdquo;</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
