"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { agendamentoSchema } from "@/lib/validation/agendamento";
import { resolverServiceArea } from "@/lib/areas";
import { calcularPreco } from "@/lib/pricing";
import { atribuirProximaDaFila } from "@/lib/matching";
import { payments } from "@/lib/payments";
import { horaParaMinutos, dataDeInput } from "@/lib/format";
import type { FormState } from "@/lib/auth/actions";

export async function criarAgendamento(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("CLIENTE");
  const cliente = await db.clientProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!cliente) return { message: "Perfil de cliente não encontrado." };

  const brutos = Object.fromEntries(
    [
      "tipoServico", "enderecoId", "cep", "logradouro", "numero", "complemento", "bairro", "cidade",
      "referencia", "metragem", "numeroComodos", "data", "inicio", "duracaoHoras", "recorrencia",
      "metodoPagamento", "observacoes",
    ].map((k) => [k, formData.get(k) ? String(formData.get(k)) : undefined]),
  );

  const parsed = agendamentoSchema.safeParse(brutos);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values: brutos as Record<string, string> };
  }
  const d = parsed.data;

  // --- endereço --------------------------------------------------------------
  let endereco;
  if (d.enderecoId && d.enderecoId !== "novo") {
    endereco = await db.address.findFirst({ where: { id: d.enderecoId, clientId: cliente.id } });
    if (!endereco) return { errors: { enderecoId: ["Endereço não encontrado."] }, values: brutos as Record<string, string> };
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

  // atualiza dados do imóvel usados no pós-obra
  if (d.tipoServico === "POS_OBRA" && (d.metragem || d.numeroComodos)) {
    endereco = await db.address.update({
      where: { id: endereco.id },
      data: { metragem: d.metragem ?? endereco.metragem, numeroComodos: d.numeroComodos ?? endereco.numeroComodos },
    });
  }

  // --- área atendida + preço ----------------------------------------------
  const serviceAreaId = await resolverServiceArea(endereco.cidade, endereco.bairro);
  if (!serviceAreaId) {
    await db.lead.create({
      data: {
        nome: user.name ?? null,
        email: user.email ?? null,
        cep: endereco.cep,
        cidade: endereco.cidade,
        uf: null,
        tipoServico: d.tipoServico,
        mensagem: "Lead gerado no fluxo de agendamento (fora da área atendida).",
      },
    });
    return {
      message: `Ainda não atendemos ${endereco.cidade}. Registramos seu interesse e avisaremos quando chegarmos aí.`,
      values: brutos as Record<string, string>,
    };
  }

  let preco;
  try {
    preco = await calcularPreco({ tipoServico: d.tipoServico, duracaoHoras: d.duracaoHoras, serviceAreaId });
  } catch (err) {
    return { message: err instanceof Error ? err.message : "Não foi possível calcular o preço.", values: brutos as Record<string, string> };
  }

  if (d.recorrencia !== "AVULSA") {
    return { message: "Agendamento recorrente entra na próxima etapa. Por ora, selecione 'Avulsa'.", values: brutos as Record<string, string> };
  }

  // --- booking + pagamento retido --------------------------------------
  const booking = await db.booking.create({
    data: {
      clientId: cliente.id,
      addressId: endereco.id,
      tipoServico: d.tipoServico,
      data: dataDeInput(d.data),
      inicioMin: horaParaMinutos(d.inicio),
      duracaoHoras: d.duracaoHoras,
      recorrencia: "AVULSA",
      status: "AGUARDANDO_PROFISSIONAL",
      valorServico: preco.valorServico,
      valorExtras: preco.valorExtras,
      taxaPlataforma: preco.taxaPlataforma,
      valorTotal: preco.valorTotal,
      repasseProfissional: preco.repasseProfissional,
      observacoesCliente: d.observacoes ?? null,
    },
  });

  const cobranca = await payments.criarCobranca({
    bookingId: booking.id,
    valorCentavos: preco.valorTotal,
    metodo: d.metodoPagamento,
    descricao: `Serviço de limpeza (${d.tipoServico}) em ${endereco.cidade}`,
    pagador: { nome: user.name ?? "Cliente", email: user.email ?? "" },
  });
  await db.payment.create({
    data: {
      bookingId: booking.id,
      provider: cobranca.provider,
      providerId: cobranca.providerId,
      metodo: d.metodoPagamento,
      status: cobranca.status,
      valor: preco.valorTotal,
      pixCopiaCola: cobranca.pixCopiaCola ?? null,
      checkoutUrl: cobranca.checkoutUrl ?? null,
      pagoEm: cobranca.status === "PAGO_RETIDO" ? new Date() : null,
    },
  });

  try {
    await atribuirProximaDaFila(booking.id);
  } catch (err) {
    console.error("[agendamento] matching falhou", err);
  }

  redirect(`/cliente/agendamentos/${booking.id}`);
}
