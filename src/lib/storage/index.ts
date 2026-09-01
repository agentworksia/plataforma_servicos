import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

// Cliente com service role: só no servidor. Buckets são privados (LGPD: documentos com foto
// só o admin acessa). Downloads sempre via URL assinada de curta duração.
// Inicialização preguiçosa: não quebra o build quando as env vars ainda não existem.
let client: SupabaseClient | null = null;

function supabaseAdmin(): SupabaseClient {
  if (!client) {
    client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export const BUCKET = {
  documentos: env.SUPABASE_BUCKET_DOCUMENTOS ?? "documentos",
  perfil: env.SUPABASE_BUCKET_PERFIL ?? "perfil",
} as const;

export type BucketName = (typeof BUCKET)[keyof typeof BUCKET];

export async function uploadArquivo(
  bucket: BucketName,
  path: string,
  arquivo: ArrayBuffer | Blob,
  contentType: string,
): Promise<{ path: string }> {
  const { data, error } = await supabaseAdmin()
    .storage.from(bucket)
    .upload(path, arquivo, { contentType, upsert: true });
  if (error) throw error;
  return { path: data.path };
}

export async function urlAssinada(bucket: BucketName, path: string, expiraEmSegundos = 60): Promise<string> {
  const { data, error } = await supabaseAdmin().storage.from(bucket).createSignedUrl(path, expiraEmSegundos);
  if (error) throw error;
  return data.signedUrl;
}

export async function removerArquivo(bucket: BucketName, path: string): Promise<void> {
  const { error } = await supabaseAdmin().storage.from(bucket).remove([path]);
  if (error) throw error;
}
