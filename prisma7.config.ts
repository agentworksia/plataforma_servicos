// Config do Prisma CLI (migrate/db/studio). O runtime usa src/lib/db.ts com o driver adapter.
// Migrations precisam de conexão direta (sem pgbouncer): usa DIRECT_URL, com fallback pra DATABASE_URL.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
