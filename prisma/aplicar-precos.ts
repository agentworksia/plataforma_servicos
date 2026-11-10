import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { pgSsl } from "../src/lib/pg-ssl";
import { aplicarTabelaDePrecos } from "./tabela-precos";

const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL ?? "";
const adapter = new PrismaPg({ connectionString, ssl: pgSsl(connectionString) });
const db = new PrismaClient({ adapter });

aplicarTabelaDePrecos(db)
  .then(async () => {
    const total = await db.pricingRule.count();
    console.log(`Tabela de preços aplicada. ${total} regras ativas no banco.`);
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
