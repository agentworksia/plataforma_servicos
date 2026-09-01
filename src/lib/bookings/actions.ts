"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { agendamentoSchema } from "@/lib/validation/agendamento";
import { resolverServiceArea } from "@/lib/areas";
import { calcularPreco, type PrecoCalculado } from "@/lib/pricing";
import { atribuirProximaDaFila } from "@/lib/matching";
import { datasDaSerie } from "@/lib/bookings/recorrencia";
import { payments } from "@/lib/payments";
import { horaParaMinutos, dataDeInput } from "@/lib/format";
import type { FormState } from "@/lib/auth/actions";
import type { PaymentMethod, ServiceType } from "@/generated/prisma/enums";

type DadosPagamento = { metodo: PaymentMethod; nome: string; email: string; descricao: string };

async function registrarPagamento(bookingId: string, valorCentavos: number, p: DadosPagamento) {
  const cobranca = await payments.criarCobranca({
    bookingId,
    valorCentavos,
    metodo: p.metodo,
    descricao: p.descricao,
    pagador: { nome: p.nome, email: p.email },
  });
  await db.payment.create({
    data: {
      bookingId,
      provider: cobranca.provider,
      providerId: cobranca.providerId,
      metodo: p.metodo,
      status: cobranca.status,
      valor: valorCentavos,
      pixCopiaCola: cobranca.pixCopiaCola ?? null,
      checkoutUrl: cobranca.checkoutUrl ?? null,
      pagoEm: cobranca.status === "PAGO_RETIDO" ? new Date() : null,
    },
  });
}

function dadosBooking(tipoServico: ServiceType, inicioMin: number, duracaoHoras: number, preco: PrecoCalculado, observacoes?: string) {
  return {
    tipoServico,
    inicioMin,
    duracaoHoras,
    status: "AGUARDANDO_PROFISSIONAL" as const,
    valorServico: preco.valorServico,
    valorExtras: preco.valorExtras,
    taxaPlataforma: preco.taxaPlataforma,
    valorTotal: preco.valorTotal,
    repasseProfissional: preco.repasseProfissional,
    observacoesCliente: observacoes ?? null,
  };
}

export async function criarAgendamento(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("CLIENTE");
  const cliente = await db.clientProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!cliente) return { message: "Perfil de cliente não encontrado." };

  const campos = [
    "tipoServico", "enderecoId", "cep", "logradouro", "numero", "complemento", "bairro", "cidade",
    "referencia", "metragem", "numeroComodos", "data", "inicio", "duracaoHoras", "recorrencia",
    "metodoPagamento", "observacoes",
  ];
  const brutos = Object.fromEntries(campos.map((k) => [k, formData.get(k) ? String(formData.get(k)) : undefined]));

  const parsed = agendamentoSchema.safeParse(brutos);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values: brutos as Record<string, string> };
  }
  const d = parsed.data;
  const valores = brutos as Record<string, string>;

  // --- endereço --------------------------------------------------------------
  let endereco;
  if (d.enderecoId && d.enderecoId !== "novo") {
    endereco = await db.address.findFirst({ where: { id: d.enderecoId, clientId: cliente.id } });
    if (!endereco) return { errors: { enderecoId: ["Endereço não encontrado."] }, values: valores };
  } else {
    endereco = await db.address.create({
      data: {
        clientId: cliente.id,
        cep: d.cep!,
        logradouro: d.logradouro!,
        numero: d.numero!,
        complemento: d.complemento ?? null,
        bairro: d.bairro!,
        cidade: d.cidade!,
        referencia: d.referencia ?? null,
      },
    });
  }
  if (d.tipoServico === "POS_OBRA" && (d.metragem || d.numeroComodos)) {
    endereco = await db.address.update({
      where: { id: endereco.id },
      data: { metragem: d.metragem ?? endereco.metragem, numeroComodos: d.numeroComodos ?? endereco.numeroComodos },
    });
  }

  // --- área + preço ------------------------------------------------------
  const serviceAreaId = await resolverServiceArea(endereco.cidade, endereco.bairro);
  if (!serviceAreaId) {
    await db.lead.create({
      data: {
        nome: user.name ?? null,
        email: user.email ?? null,
        cep: endereco.cep,
        cidade: endereco.cidade,
        tipoServico: d.tipoServico,
        mensagem: "Lead gerado no fluxo de agendamento (fora da área atendida).",
      },
    });
    return { message: `Ainda não atendemos ${endereco.cidade}. Registramos seu interesse e avisaremos quando chegarmos aí.`, values: valores };
  }

  let preco: PrecoCalculado;
  try {
    preco = await calcularPreco({ tipoServico: d.tipoServico, duracaoHoras: d.duracaoHoras, serviceAreaId });
  } catch (err) {
    return { message: err instanceof Error ? err.message : "Não foi possível calcular o preço.", values: valores };
  }

  const inicioMin = horaParaMinutos(d.inicio);
  const pgto: DadosPagamento = {
    metodo: d.metodoPagamento,
    nome: user.name ?? "Cliente",
    email: user.email ?? "",
    descricao: `Serviço de limpeza (${d.tipoServico}) em ${endereco.cidade}`,
  };

  // --- avulsa -----------------------------------------------------------------
  if (d.recorrencia === "AVULSA") {
    const booking = await db.booking.create({
      data: {
        clientId: cliente.id,
        addressId: endereco.id,
        recorrencia: "AVULSA",
        data: dataDeInput(d.data),
        ...dadosBooking(d.tipoServico, inicioMin, d.duracaoHoras, preco, d.observacoes),
      },
    });
    await registrarPagamento(booking.id, preco.valorTotal, pgto);
    try {
      await atribuirProximaDaFila(booking.id);
    } catch (err) {
      console.error("[agendamento] matching falhou", err);
    }
    redirect(`/cliente/agendamentos/${booking.id}`);
  }

  // --- recorrente -----------------------------------------------------------
  const inicio = dataDeInput(d.data);
  const datas = datasDaSerie(d.recorrencia, inicio);
  const serie = await db.bookingSeries.create({
    data: {
      clientId: cliente.id,
      addressId: endereco.id,
      tipoServico: d.tipoServico,
      duracaoHoras: d.duracaoHoras,
      recorrencia: d.recorrencia,
      diaSemana: inicio.getUTCDay(),
      inicioMin,
      dataInicio: inicio,
      dataFim: datas[datas.length - 1],
    },
  });

  const bookings = await Promise.all(
    datas.map((data) =>
      db.booking.create({
        data: {
          clientId: cliente.id,
          addressId: endereco.id,
          seriesId: serie.id,
          recorrencia: d.recorrencia,
          data,
          ...dadosBooking(d.tipoServico, inicioMin, d.duracaoHoras, preco, d.observacoes),
        },
      }),
    ),
  );
  await Promise.all(bookings.map((b) => registrarPagamento(b.id, preco.valorTotal, pgto)));

  // oferta da série inteira para o topo da fila (na primeira ocorrência)
  try {
    const { atribuirSerie } = await import("@/lib/matching/serie");
    await atribuirSerie(serie.id);
  } catch (err) {
    console.error("[agendamento] matching de série falhou", err);
  }

  redirect(`/cliente/series/${serie.id}`);
}
