import "server-only";
import { db } from "@/lib/db";

/**
 * Acha a ServiceArea ativa para um endereço: casa o bairro primeiro; se não houver
 * regra por bairro, cai para a área a nível de cidade. Retorna null se a cidade não é atendida.
 */
export async function resolverServiceArea(cidade: string, bairro?: string | null): Promise<string | null> {
  const areas = await db.serviceArea.findMany({
    where: { ativo: true, cidade: { equals: cidade.trim(), mode: "insensitive" } },
    select: { id: true, bairro: true },
  });
  if (areas.length === 0) return null;

  if (bairro) {
    const alvo = bairro.trim().toLowerCase();
    const porBairro = areas.find((a) => a.bairro?.toLowerCase() === alvo);
    if (porBairro) return porBairro.id;
  }
  const nivelCidade = areas.find((a) => !a.bairro);
  return (nivelCidade ?? areas[0]).id;
}
