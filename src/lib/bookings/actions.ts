"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { agendamentoSchema } from "@/lib/validation/agendamento";
import { documentoValido } from "@/lib/validation/documento";
import { resolverServiceArea } from "@/lib/areas";
import { calcularPreco, type PrecoCalculado } from "@/lib/pricing";
import { atribuirProximaDaFila } from "@/lib/matching";
import { datasDaSerie } from "@/lib/bookings/recorrencia";
import { podeEscolher } from "@/lib/professionals/historico";
import { pracaPorNome, UF_PADRAO } from "@/lib/regioes";
import { horaParaMinutos, dataDeInput } from "@/lib/format";
import type { FormState } from "@/lib/auth/actions";
import type { PaymentMethod, ServiceType } from "@/generated/prisma/enums";

function dadosBooking(
  tipoServico: ServiceType,
  inicioMin: number,
  duracaoMinutos: number,
  preco: PrecoCalculado,
  metodoPagamento: PaymentMethod,
  observacoes?: string,
  preferidaId?: string,
  detalhesPosObra?: string,
) {
  return {
    tipoServico,
    inicioMin,
    duracaoMinutos,
    status: "AGUARDANDO_PROFISSIONAL" as const,
    metodoPagamento,
    valorServico: preco.valorServico,
    valorExtras: preco.valorExtras,
    taxaPlataforma: preco.taxaPlataforma,
    valorTotal: preco.valorTotal,
    repasseProfissional: preco.repasseProfissional,
    observacoesCliente: observacoes ?? null,
    preferidaId: preferidaId ?? null,
    detalhesPosObra: tipoServico === "POS_OBRA" ? (detalhesPosObra ?? null) : null,
  };
}

export async function criarAgendamento(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("CLIENTE");
  const cliente = await db.clientProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, tipo: true, cpf: true, cnpj: true },
  });
  if (!cliente) return { message: "Perfil de cliente não encontrado." };

  const campos = [
    "tipoServico", "enderecoId", "cep", "logradouro", "numero", "complemento", "bairro", "cidade",
    "referencia", "metragem", "numeroComodos", "data", "inicio", "duracaoMinutos", "recorrencia",
    "metodoPagamento", "observacoes", "preferidaId", "detalhesPosObra", "documento",
  ];
  const brutos = Object.fromEntries(campos.map((k) => [k, formData.get(k) ? String(formData.get(k)) : undefined]));

  const parsed = agendamentoSchema.safeParse(brutos);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values: brutos as Record<string, string> };
  }
  const d = parsed.data;
  const valores = brutos as Record<string, string>;

  // --- documento de quem paga ------------------------------------------------
  // O Asaas recusa a cobrança sem CPF/CNPJ, e a cobrança nasce no aceite da
  // profissional — longe desta tela. Por isso o documento é exigido aqui, e não lá.
  const rotulo = cliente.tipo === "PJ" ? "CNPJ" : "CPF";
  const documentoAtual = cliente.tipo === "PJ" ? cliente.cnpj : cliente.cpf;
  if (!documentoAtual) {
    if (!d.documento) {
      return { errors: { documento: [`Informe seu ${rotulo} para emitirmos a cobrança.`] }, values: valores };
    }
    if (!documentoValido(d.documento, cliente.tipo)) {
      return { errors: { documento: [`${rotulo} inválido.`] }, values: valores };
    }
    await db.clientProfile.update({
      where: { id: cliente.id },
      data: cliente.tipo === "PJ" ? { cnpj: d.documento } : { cpf: d.documento },
    });
  }

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
        uf: pracaPorNome(d.cidade!)?.uf ?? UF_PADRAO,
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
    preco = await calcularPreco({
      tipoServico: d.tipoServico,
      duracaoMinutos: d.duracaoMinutos,
      serviceAreaId,
      data: d.data,
    });
  } catch (err) {
    return { message: err instanceof Error ? err.message : "Não foi possível calcular o preço.", values: valores };
  }

  // A preferida vem do <select>, então é conferida aqui: só vale quem já atendeu este cliente.
  let preferidaId: string | undefined;
  if (d.preferidaId) {
    if (!(await podeEscolher(cliente.id, d.preferidaId))) {
      return {
        errors: { preferidaId: ["Escolha uma profissional que já atendeu você."] },
        values: valores,
      };
    }
    preferidaId = d.preferidaId;
  }

  const inicioMin = horaParaMinutos(d.inicio);

  // --- avulsa -----------------------------------------------------------------
  if (d.recorrencia === "AVULSA") {
    const booking = await db.booking.create({
      data: {
        clientId: cliente.id,
        addressId: endereco.id,
        recorrencia: "AVULSA",
        data: dataDeInput(d.data),
        ...dadosBooking(d.tipoServico, inicioMin, d.duracaoMinutos, preco, d.metodoPagamento, d.observacoes, preferidaId, d.detalhesPosObra),
      },
    });
    // Nada é cobrado aqui: a cobrança nasce quando uma profissional aceita, porque é
    // só nesse momento que existe uma carteira de destino para o split.
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
      duracaoMinutos: d.duracaoMinutos,
      recorrencia: d.recorrencia,
      diaSemana: inicio.getUTCDay(),
      inicioMin,
      dataInicio: inicio,
      dataFim: datas[datas.length - 1],
      titularProfessionalId: preferidaId ?? null,
    },
  });

  await Promise.all(
    datas.map((data) =>
      db.booking.create({
        data: {
          clientId: cliente.id,
          addressId: endereco.id,
          seriesId: serie.id,
          recorrencia: d.recorrencia,
          data,
          ...dadosBooking(d.tipoServico, inicioMin, d.duracaoMinutos, preco, d.metodoPagamento, d.observacoes, preferidaId, d.detalhesPosObra),
        },
      }),
    ),
  );
  // oferta da série inteira para o topo da fila (na primeira ocorrência)
  try {
    const { atribuirSerie } = await import("@/lib/matching/serie");
    await atribuirSerie(serie.id);
  } catch (err) {
    console.error("[agendamento] matching de série falhou", err);
  }

  redirect(`/cliente/series/${serie.id}`);
}
