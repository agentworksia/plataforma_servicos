import type { PoolConfig } from "pg";

/**
 * Postgres gerenciado (Supabase, Neon, RDS…) apresenta um certificado que o Node não
 * valida por padrão. A conexão continua criptografada (TLS); apenas não verificamos a
 * cadeia de certificação. Banco local sem SSL não força TLS.
 */
export function pgSsl(connectionString: string): PoolConfig["ssl"] {
  const precisaSsl = /supabase\.|sslmode=require|sslmode=verify|neon\.tech|\.rds\.|render\.com/.test(
    connectionString,
  );
  return precisaSsl ? { rejectUnauthorized: false } : undefined;
}
