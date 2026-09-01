import "server-only";
import { db } from "@/lib/db";

/**
 * Fila de atribuição de uma diária.
 *
 * Elegibilidade: profissional APROVADA, que atende o tipo de serviço, cobre a região do
 * endereço, tem o horário livre na agenda e sem conflito com outro serviço.
 *
 * Ordenação: melhor média de avaliação primeiro; desempate por menor nº de serviços na
 * semana, maior taxa de aceite e proximidade. Regra simples e configurável.
 *
 * Recorrência: ao criar uma série, tenta-se alocar a mesma profissional (titular) para todas
 * as ocorrências futuras; se numa data ela não puder, só aquela ocorrência é realocada.
 *
 * Implementação real entra na feature de matching. Aqui fica só a assinatura + o esqueleto
 * da consulta de elegibilidade.
 */
export async function montarFilaDeOfertas(bookingId: string): Promise<string[]> {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { address: true },
  });
  if (!booking) throw new Error("Agendamento não encontrado.");

  // TODO(feature: matching):
  //  1. filtrar ProfessionalProfile por status APROVADA + tiposServico contém booking.tipoServico
  //  2. filtrar por ProfessionalServiceArea cobrindo a cidade/bairro do endereço
  //  3. checar Availability (diaSemana/intervalo) e ausência de AvailabilityException BLOQUEIO
  //  4. checar ausência de Booking conflitante no mesmo intervalo
  //  5. ordenar por média de Review, depois nº de serviços na semana, taxa de aceite, proximidade
  return [];
}

export type ResultadoAtribuicao =
  | { status: "OFERTA_ENVIADA"; professionalId: string; offerId: string }
  | { status: "AGUARDANDO_PROFISSIONAL" };

export async function atribuirProximaDaFila(_bookingId: string): Promise<ResultadoAtribuicao> {
  // TODO(feature: matching): cria BookingOffer PENDENTE com expiraEm (Setting PRAZO_OFERTA_MINUTOS)
  // para o topo da fila; se a fila estiver vazia, mantém AGUARDANDO_PROFISSIONAL e notifica o admin.
  return { status: "AGUARDANDO_PROFISSIONAL" };
}
