/**
 * Redimensiona una imagen en el navegador antes de subirla, para que el
 * broker no tenga que adivinar las dimensiones correctas — se ajusta a un
 * rectángulo máximo preservando la proporción, nunca la agranda si ya es
 * más chica. Conserva el formato original (PNG, para no perder fondos
 * transparentes en un logo; cualquier otro tipo se normaliza a JPEG).
 */
export async function resizeImageFile(
  file: File,
  maxWidth = 600,
  maxHeight = 240,
  quality = 0.9
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, outputType, quality));
  return blob || file;
}
