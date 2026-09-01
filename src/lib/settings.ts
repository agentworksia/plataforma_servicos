import "server-only";
import { db } from "@/lib/db";

/** Lê uma configuração da tabela Setting, com fallback. */
export async function getSetting(chave: string, padrao: string): Promise<string> {
  const s = await db.setting.findUnique({ where: { chave } });
  return s?.valor ?? padrao;
}

export async function getSettingNumber(chave: string, padrao: number): Promise<number> {
  const v = Number(await getSetting(chave, String(padrao)));
  return Number.isFinite(v) ? v : padrao;
}
