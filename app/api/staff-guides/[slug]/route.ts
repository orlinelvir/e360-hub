import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb, adminStorage } from "@/lib/firebase-admin";
import { resolveUserRole } from "@/lib/roles";
import { getStaffGuideBySlug } from "@/lib/staff-guides";

const GUIDE_SIGNED_URL_EXPIRY_MS = 10 * 60 * 1000; // más corto que el de /api/guides — estos sí son de uso interno

// A diferencia de /api/guides/[slug] (público, sin auth, para el correo de
// bienvenida), esto exige sesión y bloquea el rol "broker" explícitamente —
// son materiales de uso interno del staff (guion de la llamada de onboarding),
// nunca para compartir con brokers ni clientes.
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  const role = await resolveUserRole(adminDb, user.uid, user.email);
  if (role === "broker") {
    return NextResponse.json({ error: "Este material es de uso interno del staff." }, { status: 403 });
  }

  const { slug } = await params;
  const guide = getStaffGuideBySlug(slug);
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

    // JSON en vez de redirect: esta ruta exige un header Authorization, que
    // un <a href> normal no puede mandar — el cliente pide la URL firmada
    // aquí y luego abre esa URL directamente (ver botón en AdminPanelSection.tsx).
    return NextResponse.json({ url });
  } catch (err) {
    console.error(`No se pudo generar URL firmada para la guía de staff "${slug}":`, err);
    return NextResponse.json({ error: "Error al abrir la guía" }, { status: 500 });
  }
}
