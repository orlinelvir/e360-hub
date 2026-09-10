import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/firebase-admin";
import { getServiceOverrides } from "@/lib/services/service-catalog-service";

/**
 * Overrides de contenido del catálogo de servicios (precio, requisitos, etc.)
 * editados desde el panel de admin sin necesitar un deploy. Cualquier broker
 * autenticado puede leerlos — el catálogo de servicios ya es público dentro
 * del Hub, esto solo le agrega el contenido actualizado.
 */
export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const overrides = await getServiceOverrides();
    return NextResponse.json({ overrides });
  } catch (error) {
    console.error("Service overrides GET error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
