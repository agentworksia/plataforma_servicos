import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";
import { pgSsl } from "@/lib/pg-ssl";

// Prisma 7 exige um driver adapter. Reaproveitamos a instância entre hot-reloads no dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  // Em serverless (Vercel) cada instância mantém seu próprio pool; limita a 1 conexão
  // para não estourar o pooler do Supabase. Em dev, pool normal.
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
    max: process.env.NODE_ENV === "production" ? 1 : 10,
    ssl: pgSsl(env.DATABASE_URL),
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
