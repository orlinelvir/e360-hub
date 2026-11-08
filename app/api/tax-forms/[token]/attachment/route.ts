import { NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebase-admin";
import { getPublishedTaxFormByToken } from "@/lib/services/tax-office-service";

const ATTACHMENT_SIGNED_URL_EXPIRY_MS = 60 * 60 * 1000;

// Mismo patrón que /api/guides/[slug]: redirige a una URL firmada fresca en
// cada visita en vez de guardar un link permanente, así nunca expira del
// lado del cliente que recibió el formulario.
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await getPublishedTaxFormByToken(token);
  if (!result || !result.form.attachmentStoragePath) {
    return NextResponse.json({ error: "Este formulario no tiene ningún documento adjunto" }, { status: 404 });
  }

  if (!adminStorage) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const file = adminStorage.bucket().file(result.form.attachmentStoragePath);
    const [url] = await file.getSignedUrl({ action: "read", expires: Date.now() + ATTACHMENT_SIGNED_URL_EXPIRY_MS });
    return NextResponse.redirect(url);
  } catch (err) {
    console.error("No se pudo generar URL firmada para el adjunto del formulario:", err);
    return NextResponse.json({ error: "Error al abrir el documento adjunto" }, { status: 500 });
  }
}
