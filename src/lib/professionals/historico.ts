import "server-only";
import { db } from "@/lib/db";

export type ProfissionalConhecida = {
  id: string;
  nome: string;
  servicos: number;
  minhaNota: number | null;
};

/**
 * Profissionais que já concluíram um serviço para este cliente e continuam aprovadas.
 * É a lista de onde ele escolhe a preferida — o cadastro completo de profissionais não
 * é exposto ao cliente.
 */
export async function profissionaisJaAtenderam(clientId: string): Promise<ProfissionalConhecida[]> {
  const concluidos = await db.booking.findMany({
    where: { clientId, status: "CONCLUIDO", professional: { status: "APROVADA" } },
    select: {
      professionalId: true,
      professional: { select: { user: { select: { name: true } } } },
      review: { select: { nota: true } },
    },
  });

  const porProfissional = new Map<string, { nome: string; servicos: number; notas: number[] }>();
  for (const b of concluidos) {
    if (!b.professionalId) continue;
    const atual = porProfissional.get(b.professionalId) ?? {
      nome: b.professional?.user.name ?? "Profissional",
      servicos: 0,
      notas: [],
    };
    atual.servicos += 1;
    if (b.review) atual.notas.push(b.review.nota);
    porProfissional.set(b.professionalId, atual);
  }

  return [...porProfissional.entries()]
    .map(([id, p]) => ({
      id,
      nome: p.nome,
      servicos: p.servicos,
      minhaNota: p.notas.length ? p.notas.reduce((s, n) => s + n, 0) / p.notas.length : null,
    }))
    .sort((a, b) => b.servicos - a.servicos);
}

/** Confirma no backend que a profissional pedida realmente já atendeu este cliente. */
export async function podeEscolher(clientId: string, professionalId: string): Promise<boolean> {
  const atendeu = await db.booking.findFirst({
    where: {
      clientId,
      professionalId,
      status: "CONCLUIDO",
      professional: { status: "APROVADA" },
    },
    select: { id: true },
  });
  return atendeu !== null;
}
