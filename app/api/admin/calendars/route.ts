import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { getGHLCalendars, CRMError } from "@/lib/ghl";

/**
 * Lista los calendarios de una subcuenta GHL, para no tener que buscar el Calendar ID
 * a mano en la interfaz. Uso: GET /api/admin/calendars?locationId=XXXX
 * Por defecto usa la subcuenta "Emprende 360" si no se pasa locationId.
 */
export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const brokerSnap = await adminDb.collection("brokers").doc(user.uid).get();
    const role = brokerSnap.exists ? brokerSnap.data()?.role : undefined;

    if (role !== "admin") {
      return NextResponse.json(
        { error: "Acceso restringido. Se requiere rol de administrador." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId") || process.env.GHL_ONBOARDING_FORM_LOCATION_ID || "";

    const agencyKey = process.env.GHL_AGENCY_API_KEY;

    if (!locationId) {
      return NextResponse.json(
        { error: "Falta locationId (query param) o GHL_ONBOARDING_FORM_LOCATION_ID en el servidor." },
        { status: 400 }
      );
    }

    if (!agencyKey) {
      return NextResponse.json(
        { error: "Credenciales de agencia no configuradas (GHL_AGENCY_API_KEY)." },
        { status: 500 }
      );
    }

    const calendars = await getGHLCalendars(locationId, agencyKey);

    return NextResponse.json({
      locationId,
      calendars: calendars.map((c) => ({ id: c.id, name: c.name, eventType: c.eventType }))
    });
  } catch (error) {
    console.error("Admin calendars error:", error);
    const status = error instanceof CRMError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status });
  }
}
