import { NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebase-admin";
import { getGuideBySlug } from "@/lib/ai/guides";

const GUIDE_SIGNED_URL_EXPIRY_MS = 24 * 60 * 60 * 1000;

// Sin auth a propósito: a diferencia de /api/support/chat (que ya firma URLs
// de estas mismas guías, ver resolveGuideDocuments), este endpoint existe
// para que un enlace a una guía funcione en lugares donde no hay sesión de
// broker — ej. el correo de bienvenida de un broker recién registrado, que
// puede abrirlo antes de haber iniciado sesión en el Hub por primera vez.
// Las guías son material de referencia general del catálogo (lib/ai/guides.ts),
// no datos sensibles de un broker/cliente específico.
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) {
    return NextResponse.json({ error: "Guía no encontrada" }, { status: 404 });
  }

  if (!adminStorage) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const file = adminStorage.bucket().file(guide.storagePath);
    const [exists] = await file.exists();
    if (!exists) {
      return NextResponse.json({ error: "El archivo de esta guía no está disponible todavía" }, { status: 404 });
    }

    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + GUIDE_SIGNED_URL_EXPIRY_MS
    });

    return NextResponse.redirect(url);
  } catch (err) {
    console.error(`No se pudo generar URL firmada para la guía "${slug}":`, err);
    return NextResponse.json({ error: "Error al abrir la guía" }, { status: 500 });
  }
}
