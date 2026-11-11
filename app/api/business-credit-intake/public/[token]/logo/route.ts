import { NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebase-admin";
import { getBusinessCreditBrandingByToken } from "@/lib/services/business-credit-intake-service";

const SIGNED_URL_EXPIRY_MS = 60 * 60 * 1000;

// Público (sin auth) — usado directo como <img src="..."> en el formulario
// que ve el cliente final. Nunca se guarda una URL pública permanente del
// logo; se redirige a una URL firmada fresca cada vez, igual que el patrón
// ya usado para adjuntos de Oficina Virtual E360.
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const branding = await getBusinessCreditBrandingByToken(token);
  if (!branding || !branding.logoStoragePath || !adminStorage) {
    return NextResponse.json({ error: "Este link no tiene logo" }, { status: 404 });
  }

  try {
    const [url] = await adminStorage
      .bucket()
      .file(branding.logoStoragePath)
      .getSignedUrl({ action: "read", expires: Date.now() + SIGNED_URL_EXPIRY_MS });
    return NextResponse.redirect(url);
  } catch (err) {
    console.error("No se pudo generar URL firmada para el logo del Business Credit Program:", err);
    return NextResponse.json({ error: "Error al cargar el logo" }, { status: 500 });
  }
}
