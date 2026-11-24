/**
 * Remove do banco os dados de demonstração criados pelo seed.
 *
 * Alvo: tudo que pertence a contas `@plataforma.local` (as que o seed cria) e os
 * agendamentos de teste. Contas com e-mail real NÃO são tocadas.
 *
 * Roda em modo relatório por padrão. Para apagar de verdade:
 *   npx tsx scripts/limpar-dados-demo.ts --confirmar
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { pgSsl } from "../src/lib/pg-ssl";

const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL ?? "";
const adapter = new PrismaPg({ connectionString, ssl: pgSsl(connectionString) });
const db = new PrismaClient({ adapter });

const SUFIXO_DEMO = "@plataforma.local";
const confirmar = process.argv.includes("--confirmar");

async function main() {
  const usuarios = await db.user.findMany({
    where: { email: { endsWith: SUFIXO_DEMO } },
    select: {
      id: true,
      email: true,
      role: true,
      clientProfile: { select: { id: true } },
      professionalProfile: { select: { id: true } },
    },
  });

  const clientIds = usuarios.map((u) => u.clientProfile?.id).filter((v): v is string => !!v);
  const profIds = usuarios.map((u) => u.professionalProfile?.id).filter((v): v is string => !!v);

  // Três origens: cliente demo, id marcado pelo seed, e agendamento de cliente real
  // atribuído a uma profissional demo — esse último precisa sair junto, senão fica
  // AGENDADO apontando para uma profissional que deixou de existir.
  const bookings = await db.booking.findMany({
    where: {
      OR: [
        { clientId: { in: clientIds.length ? clientIds : ["__none__"] } },
        { id: { startsWith: "demo-" } },
        { professionalId: { in: profIds.length ? profIds : ["__none__"] } },
      ],
    },
    select: { id: true, clientId: true },
  });
  const bookingIds = bookings.map((b) => b.id);

  const reviews = await db.review.count({
    where: { bookingId: { in: bookingIds.length ? bookingIds : ["__none__"] } },
  });

  console.log("--- dados de demonstração encontrados ---");
  console.log(`usuários .............. ${usuarios.length}`);
  for (const u of usuarios) console.log(`    ${u.role.padEnd(13)} ${u.email}`);
  console.log(`perfis de profissional  ${profIds.length}`);
  console.log(`perfis de cliente ..... ${clientIds.length}`);
  const deClienteReal = bookings.filter((b) => !clientIds.includes(b.clientId)).length;
  console.log(`agendamentos .......... ${bookingIds.length}` + (deClienteReal ? ` (${deClienteReal} de conta real, presos a profissional demo)` : ""));
  console.log(`avaliações ............ ${reviews}`);

  const restantes = await db.user.count({ where: { email: { not: { endsWith: SUFIXO_DEMO } } } });
  console.log(`\ncontas reais que ficam: ${restantes}`);

  if (!confirmar) {
    console.log("\n(relatório apenas — rode com --confirmar para apagar)");
    return;
  }

  // Booking e os perfis cascateiam para payment, payout, offer, extra, review e
  // endereço; apagar o User leva o perfil junto. A ordem abaixo só garante que os
  // agendamentos marcados com id "demo-" de clientes reais também saiam.
  await db.booking.deleteMany({ where: { id: { in: bookingIds.length ? bookingIds : ["__none__"] } } });
  await db.bookingSeries.deleteMany({
    where: { clientId: { in: clientIds.length ? clientIds : ["__none__"] } },
  });
  const apagados = await db.user.deleteMany({ where: { email: { endsWith: SUFIXO_DEMO } } });

  console.log(`\napagados: ${bookingIds.length} agendamentos e ${apagados.count} usuários.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
