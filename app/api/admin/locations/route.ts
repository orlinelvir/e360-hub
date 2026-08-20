import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { getAgencyLocations, CRMError } from "@/lib/ghl";

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

    const agencyId = process.env.GHL_AGENCY_ID;
    const agencyKey = process.env.GHL_AGENCY_API_KEY;

    if (!agencyId || !agencyKey) {
      return NextResponse.json(
        { error: "Credenciales de agencia no configuradas (GHL_AGENCY_ID / GHL_AGENCY_API_KEY)." },
        { status: 500 }
      );
    }

    const { locations, total } = await getAgencyLocations(agencyId, agencyKey);

    const cleaned = locations.map((loc) => ({
      id: loc.id,
      name: loc.name || `${loc.firstName || ""} ${loc.lastName || ""}`.trim() || "(sin nombre)",
      state: loc.state || "",
      country: loc.country || "",
      timezone: loc.timezone || "",
      email: loc.email || "",
      phone: loc.phone || "",
    }));

    return NextResponse.json({ locations: cleaned, total });
  } catch (error) {
    console.error("Admin locations error:", error);
    const status = error instanceof CRMError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status });
  }
}
