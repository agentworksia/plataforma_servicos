import "server-only";
import { db } from "@/lib/db";
import { getSettingNumber } from "@/lib/settings";
import { atribuirProximaDaFila, montarFilaDeOfertas } from "@/lib/matching";

/**
 * Tenta ofertar a série inteira ao melhor da fila (avaliada na primeira ocorrência).
 * Se ninguém for elegível para o conjunto, cai no matching individual por ocorrência.
 */
export async function atribuirSerie(seriesId: string): Promise<void> {
  const serie = await db.bookingSeries.findUnique({
    where: { id: seriesId },
    select: { bookings: { where: { status: "AGUARDANDO_PROFISSIONAL" }, orderBy: { data: "asc" }, select: { id: true } } },
  });
  if (!serie || serie.bookings.length === 0) return;

  const primeira = serie.bookings[0].id;
  const fila = await montarFilaDeOfertas(primeira);

  if (fila.length === 0) {
    for (const b of serie.bookings) await atribuirProximaDaFila(b.id);
    return;
  }

  const prazoMin = await getSettingNumber("PRAZO_OFERTA_MINUTOS", 60);
  await db.bookingOffer.create({
    data: {
      bookingId: primeira,
      professionalId: fila[0],
      status: "PENDENTE",
      abrangeSerie: true,
      ordemFila: 0,
      expiraEm: new Date(Date.now() + prazoMin * 60_000),
    },
  });
}
