import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { ServiceType } from "../src/generated/prisma/enums";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const CIDADES = [
  "Curitiba",
  "São José dos Pinhais",
  "Colombo",
  "Pinhais",
  "Araucária",
  "Fazenda Rio Grande",
  "Almirante Tamandaré",
  "Campo Largo",
  "Piraquara",
  "Quatro Barras",
  "Campina Grande do Sul",
  "Campo Magro",
];

// Preço-base (centavos) por tipo e duração. Curitiba usa a tabela cheia; demais cidades da RMC
// entram com o mesmo valor no MVP e podem ser ajustadas depois pelo admin.
const PRECO_BASE: Record<ServiceType, Record<number, number>> = {
  DIARIA_PADRAO: { 4: 16000, 6: 22000, 8: 28000 },
  PASSADORIA: { 4: 14000, 6: 19000, 8: 24000 },
  POS_OBRA: { 4: 24000, 6: 33000, 8: 42000 },
  CORPORATIVA: { 4: 20000, 6: 28000, 8: 36000 },
};
const MULTIPLICADOR: Record<ServiceType, number> = {
  DIARIA_PADRAO: 1,
  PASSADORIA: 1,
  POS_OBRA: 1.5,
  CORPORATIVA: 1.2,
};
const TIPOS = Object.keys(PRECO_BASE) as ServiceType[];
const DURACOES = [4, 6, 8];

async function main() {
  // --- Configurações -------------------------------------------------------
  const settings: Array<[string, string, string]> = [
    ["TAXA_PLATAFORMA_PCT", "20", "Percentual retido pela plataforma sobre o valor total."],
    ["PRAZO_LIBERACAO_REPASSE_DIAS", "2", "Dias após a conclusão para liberar o repasse sem disputa."],
    ["PRAZO_CANCELAMENTO_SEM_CUSTO_HORAS", "24", "Antecedência mínima para cancelamento sem custo."],
    ["PRAZO_OFERTA_MINUTOS", "60", "Tempo que a profissional tem para aceitar/recusar uma oferta."],
  ];
  for (const [chave, valor, descricao] of settings) {
    await db.setting.upsert({ where: { chave }, create: { chave, valor, descricao }, update: { descricao } });
  }

  // --- Regiões + tabela de preços ---------------------------------------
  for (const cidade of CIDADES) {
    // where compound com campo nullable não é aceito no upsert do Prisma; faz find + create.
    const existente = await db.serviceArea.findFirst({ where: { cidade, bairro: null } });
    const area = existente
      ? await db.serviceArea.update({ where: { id: existente.id }, data: { ativo: true } })
      : await db.serviceArea.create({ data: { cidade, ativo: true } });

    for (const tipo of TIPOS) {
      for (const duracao of DURACOES) {
        await db.pricingRule.upsert({
          where: {
            tipoServico_duracaoHoras_serviceAreaId: {
              tipoServico: tipo,
              duracaoHoras: duracao,
              serviceAreaId: area.id,
            },
          },
          create: {
            tipoServico: tipo,
            duracaoHoras: duracao,
            serviceAreaId: area.id,
            valorBase: PRECO_BASE[tipo][duracao],
            multiplicador: MULTIPLICADOR[tipo],
          },
          update: {},
        });
      }
    }
  }

  // --- Usuários de demonstração (apenas para desenvolvimento) -------------
  const senhaHash = await bcrypt.hash("senha12345", 10);

  await db.user.upsert({
    where: { email: "admin@plataforma.local" },
    create: { email: "admin@plataforma.local", name: "Admin", role: "ADMIN", passwordHash: senhaHash },
    update: { passwordHash: senhaHash, role: "ADMIN" },
  });

  const cliente = await db.user.upsert({
    where: { email: "cliente@plataforma.local" },
    create: { email: "cliente@plataforma.local", name: "Cliente Demo", role: "CLIENTE", passwordHash: senhaHash },
    update: { passwordHash: senhaHash },
  });
  await db.clientProfile.upsert({
    where: { userId: cliente.id },
    create: { userId: cliente.id, tipo: "PF" },
    update: {},
  });

  const prof = await db.user.upsert({
    where: { email: "profissional@plataforma.local" },
    create: {
      email: "profissional@plataforma.local",
      name: "Profissional Demo",
      role: "PROFISSIONAL",
      passwordHash: senhaHash,
    },
    update: { passwordHash: senhaHash },
  });
  await db.professionalProfile.upsert({
    where: { userId: prof.id },
    create: {
      userId: prof.id,
      status: "APROVADA",
      tiposServico: ["DIARIA_PADRAO", "PASSADORIA"],
      aprovadoEm: new Date(),
    },
    update: { status: "APROVADA" },
  });

  console.log("Seed concluído: configurações, regiões, preços e 3 usuários demo (senha: senha12345).");
}

main()
  .then(() => db.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await db.$disconnect();
    process.exit(1);
  });
