import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { pgSsl } from "../src/lib/pg-ssl";
import { precoDeTabela, type Duracao } from "../src/lib/pricing/tabela";
import { aplicarTabelaDePrecos } from "./tabela-precos";

// Usa DATABASE_URL (mesmo caminho do runtime, com sslmode que o node-postgres entende).
const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL ?? "";
const adapter = new PrismaPg({ connectionString, ssl: pgSsl(connectionString) });
const db = new PrismaClient({ adapter });

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

  await aplicarTabelaDePrecos(db);

  // --- Usuários de demonstração (apenas para desenvolvimento) -------------
  const senhaHash = await bcrypt.hash("senha12345", 10);

  await db.user.upsert({
    where: { email: "admin@plataforma.local" },
    create: { email: "admin@plataforma.local", name: "Admin", role: "ADMIN", passwordHash: senhaHash },
    // A senha do admin NÃO é reescrita: essa conta existe em produção e a senha de
    // demonstração já foi trocada. Rodar o seed para reaplicar preços não pode derrubá-la.
    update: { role: "ADMIN" },
  });

  const cliente = await db.user.upsert({
    where: { email: "cliente@plataforma.local" },
    create: { email: "cliente@plataforma.local", name: "Cliente Demo", role: "CLIENTE", passwordHash: senhaHash },
    update: { passwordHash: senhaHash },
  });
  const clientProfile = await db.clientProfile.upsert({
    where: { userId: cliente.id },
    create: { userId: cliente.id, tipo: "PF" },
    update: {},
  });

  const endereco = await db.address.upsert({
    where: { id: "demo-endereco" },
    create: {
      id: "demo-endereco",
      clientId: clientProfile.id,
      apelido: "Casa",
      cep: "80030000",
      logradouro: "Rua Mateus Leme",
      numero: "1200",
      bairro: "São Francisco",
      cidade: "Curitiba",
    },
    update: {},
  });

  const curitiba = await db.serviceArea.findFirst({ where: { cidade: "Curitiba", bairro: null } });

  // Três diaristas com históricos diferentes, para o ranking do admin e a escolha de
  // profissional preferida terem o que mostrar já na primeira execução.
  const DEMO_PROFISSIONAIS = [
    { slug: "rosangela", nome: "Rosângela Martins", notas: [5, 5, 5, 4, 5, 5] },
    { slug: "ivete", nome: "Ivete Nascimento", notas: [4, 4, 5] },
    { slug: "cleide", nome: "Cleide Barbosa", notas: [] as number[] },
  ];

  for (const [indice, demo] of DEMO_PROFISSIONAIS.entries()) {
    const usuario = await db.user.upsert({
      where: { email: `${demo.slug}@plataforma.local` },
      create: {
        email: `${demo.slug}@plataforma.local`,
        name: demo.nome,
        role: "PROFISSIONAL",
        passwordHash: senhaHash,
      },
      update: { passwordHash: senhaHash, name: demo.nome },
    });

    const perfil = await db.professionalProfile.upsert({
      where: { userId: usuario.id },
      create: {
        userId: usuario.id,
        status: "APROVADA",
        tiposServico: ["DIARIA_PADRAO", "PASSADORIA", "DOG_WALKER"],
        aprovadoEm: new Date(),
      },
      update: { status: "APROVADA" },
    });

    if (curitiba) {
      await db.professionalServiceArea.upsert({
        where: { professionalId_serviceAreaId: { professionalId: perfil.id, serviceAreaId: curitiba.id } },
        create: { professionalId: perfil.id, serviceAreaId: curitiba.id },
        update: {},
      });
    }

    // Disponível todos os dias das 8h às 18h — o passeio com cão é vendido também
    // no sábado e no domingo, quando custa 30% a mais.
    for (const diaSemana of [0, 1, 2, 3, 4, 5, 6]) {
      const id = `demo-disp-${demo.slug}-${diaSemana}`;
      await db.availability.upsert({
        where: { id },
        create: { id, professionalId: perfil.id, diaSemana, inicioMin: 480, fimMin: 1080 },
        update: { inicioMin: 480, fimMin: 1080 },
      });
    }

    // Serviços já concluídos, cada um com a avaliação que a cliente deu.
    for (const [n, nota] of demo.notas.entries()) {
      const bookingId = `demo-servico-${demo.slug}-${n}`;
      const duracao: Duracao = 240;
      const valorTotal = precoDeTabela("DIARIA_PADRAO", duracao)!;
      const taxaPlataforma = Math.round(valorTotal * 0.2);
      const data = new Date(Date.UTC(2026, 6, 6 + indice + n * 7, 12));

      await db.booking.upsert({
        where: { id: bookingId },
        create: {
          id: bookingId,
          clientId: clientProfile.id,
          addressId: endereco.id,
          professionalId: perfil.id,
          tipoServico: "DIARIA_PADRAO",
          data,
          inicioMin: 480,
          duracaoMinutos: duracao,
          status: "CONCLUIDO",
          concluidoEm: data,
          valorServico: valorTotal,
          taxaPlataforma,
          valorTotal,
          repasseProfissional: valorTotal - taxaPlataforma,
        },
        update: { status: "CONCLUIDO", professionalId: perfil.id },
      });

      await db.review.upsert({
        where: { bookingId },
        create: { bookingId, professionalId: perfil.id, clientId: clientProfile.id, nota },
        update: { nota },
      });
    }
  }

  console.log(
    "Seed concluído: configurações, regiões, tabela de preços (4h 160 / 6h 220 / 8h 300), " +
      "admin, cliente e 3 diaristas demo com histórico. Senha de todos: senha12345.",
  );
}

main()
  .then(() => db.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await db.$disconnect();
    process.exit(1);
  });
