// Redução de imagem no navegador antes do upload: mantém os arquivos pequenos
// (custo de storage + limite de corpo da função serverless na Vercel).

export async function downscaleImagem(file: File, maxLado = 1400, qualidade = 0.82): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // formato que o navegador não decodifica — deixa o backend validar
  }

  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
  if (escala === 1 && file.size < 900_000) {
    bitmap.close?.();
    return file;
  }

  const w = Math.round(bitmap.width * escala);
  const h = Math.round(bitmap.height * escala);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close?.();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", qualidade),
  );
  if (!blob) return file;

  const nome = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], nome, { type: "image/jpeg" });
}
