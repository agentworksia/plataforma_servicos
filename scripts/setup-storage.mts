// Garante os buckets do Supabase Storage usados pelo cadastro da profissional.
// Rode uma vez (ou sempre que precisar recriar o ambiente): `npx tsx scripts/setup-storage.mts`
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY no .env");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const BUCKETS = [
  {
    id: process.env.SUPABASE_BUCKET_DOCUMENTOS ?? "documentos",
    // Privado: documento com foto só é acessível ao admin, via URL assinada (LGPD).
    options: {
      public: false,
      fileSizeLimit: "6MB",
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    },
  },
  {
    id: process.env.SUPABASE_BUCKET_PERFIL ?? "perfil",
    // Privado também: foto de rosto é dado pessoal. Servida por URL assinada.
    options: {
      public: false,
      fileSizeLimit: "4MB",
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    },
  },
];

for (const b of BUCKETS) {
  const { error } = await supabase.storage.createBucket(b.id, b.options);
  if (error && !/already exists/i.test(error.message)) {
    console.error(`falha ao criar bucket "${b.id}":`, error.message);
    process.exit(1);
  }
  // Atualiza a config caso o bucket já existisse com outros limites.
  await supabase.storage.updateBucket(b.id, b.options);
  console.log(`bucket "${b.id}" ok (privado)`);
}

const { data } = await supabase.storage.listBuckets();
console.log(
  "buckets no projeto:",
  data?.map((x) => `${x.name}${x.public ? " (público)" : ""}`).join(", "),
);
