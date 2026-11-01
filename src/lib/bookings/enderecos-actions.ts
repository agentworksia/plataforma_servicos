"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { pracaPorNome, UF_PADRAO } from "@/lib/regioes";

export type EnderecoState = { erro?: string } | undefined;

const digitos = (v: string) => v.replace(/\D/g, "");

const enderecoSchema = z.object({
  apelido: z.string().trim().max(40).optional(),
  cep: z
    .string()
    .trim()
    .transform(digitos)
    .refine((v) => v.length === 8, "CEP precisa ter 8 dígitos"),
  logradouro: z.string().trim().min(3, "Informe a rua").max(200),
  numero: z.string().trim().min(1, "Informe o número").max(20),
  complemento: z.string().trim().max(120).optional(),
  bairro: z.string().trim().min(2, "Informe o bairro").max(120),
  cidade: z.string().trim().min(2, "Informe a cidade").max(120),
  referencia: z.string().trim().max(200).optional(),
});

async function clienteAtual() {
  const user = await requireRole("CLIENTE");
  const cliente = await db.clientProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!cliente) throw new Error("Perfil de cliente não encontrado.");
  return cliente.id;
}

export async function salvarEndereco(_prev: EnderecoState, formData: FormData): Promise<EnderecoState> {
  const clientId = await clienteAtual();
  const id = String(formData.get("id") ?? "");

  const parsed = enderecoSchema.safeParse({
    apelido: formData.get("apelido"),
    cep: formData.get("cep"),
    logradouro: formData.get("logradouro"),
    numero: formData.get("numero"),
    complemento: formData.get("complemento"),
    bairro: formData.get("bairro"),
    cidade: formData.get("cidade"),
    referencia: formData.get("referencia"),
  });
  if (!parsed.success) return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const d = parsed.data;
  const dados = {
    apelido: d.apelido || null,
    cep: d.cep,
    logradouro: d.logradouro,
    numero: d.numero,
    complemento: d.complemento || null,
    bairro: d.bairro,
    cidade: d.cidade,
    uf: pracaPorNome(d.cidade)?.uf ?? UF_PADRAO,
    referencia: d.referencia || null,
  };

  if (id) {
    // Confere a posse antes de alterar: o id vem de campo oculto do formulário.
    const meu = await db.address.findFirst({ where: { id, clientId }, select: { id: true } });
    if (!meu) return { erro: "Endereço não encontrado." };
    await db.address.update({ where: { id }, data: dados });
  } else {
    await db.address.create({ data: { ...dados, clientId } });
  }

  revalidatePath("/cliente/enderecos");
}

export async function excluirEndereco(_prev: EnderecoState, formData: FormData): Promise<EnderecoState> {
  const clientId = await clienteAtual();
  const id = String(formData.get("id") ?? "");
  if (!id) return { erro: "Registro inválido." };

  const endereco = await db.address.findFirst({
    where: { id, clientId },
    select: { id: true, _count: { select: { bookings: true, series: true } } },
  });
  if (!endereco) return { erro: "Endereço não encontrado." };

  // Agendamento guarda o endereço do dia do serviço; apagar quebraria o histórico.
  if (endereco._count.bookings > 0 || endereco._count.series > 0) {
    return { erro: "Esse endereço já foi usado em um agendamento e por isso não pode ser excluído." };
  }

  await db.address.delete({ where: { id } });
  revalidatePath("/cliente/enderecos");
}
