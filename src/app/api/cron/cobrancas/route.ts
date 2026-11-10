import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { criarCobrancaDoAceite, liberarAceitesNaoPagos } from "@/lib/bookings/cobranca";

/** Quantas horas antes da data a ocorrência de uma série é cobrada. */
const ANTECEDENCIA_HORAS = 48;

function autorizado(request: Request): boolean {
  const esperado = env.CRON_SECRET;
  if (!esperado) return false;
  const recebido = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Rotina periódica de cobrança. Faz duas coisas que não podem depender de alguém
 * estar com o site aberto:
 *   1. devolve à fila os aceites que a cliente não pagou no prazo;
 *   2. cobra a próxima ocorrência das séries, perto da data.
 *
 * Agendada em vercel.json. Protegida por CRON_SECRET: sem ele a rota recusa tudo,
 * senão qualquer pessoa dispara cobrança e refila serviço alheio.
 */
export async function GET(request: Request) {
  if (!autorizado(request)) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const liberados = await liberarAceitesNaoPagos();

  const limite = new Date(Date.now() + ANTECEDENCIA_HORAS * 3600_000);
  const aCobrar = await db.booking.findMany({
    where: {
      status: "AGENDADO",
      seriesId: { not: null },
      payment: { is: null },
      data: { lte: limite, gte: new Date() },
    },
    select: { id: true },
    take: 200,
  });

  let cobradas = 0;
  for (const b of aCobrar) {
    try {
      await criarCobrancaDoAceite(b.id);
      cobradas++;
    } catch (err) {
      console.error("[cron:cobrancas] falhou em", b.id, err);
    }
  }

  return NextResponse.json({ liberados, cobradas });
}
