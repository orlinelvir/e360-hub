import { NextResponse } from "next/server";
import { getGHLOpportunities } from "@/lib/ghl";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { isRateLimited } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json(
      { data: null, error: "No autorizado. Sesión inválida o expirada.", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  // Rate Limiting (30 peticiones/min por usuario)
  if (isRateLimited(user.uid, 30, 60000)) {
    return NextResponse.json(
      { data: null, error: "Demasiadas peticiones. Por favor espera un momento.", code: "TOO_MANY_REQUESTS" },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const requestedLocationId = searchParams.get("locationId");
  const pipelineId = searchParams.get("pipelineId") || undefined;

  let authorizedLocationId = process.env.GHL_DEFAULT_LOCATION_ID;
  let brokerApiKey = process.env.GHL_PRIVATE_KEY || process.env.GHL_AGENCY_API_KEY;

  try {
    if (adminDb) {
      const brokerSnap = await adminDb.collection("brokers").doc(user.uid).get();
      if (brokerSnap.exists) {
        const data = brokerSnap.data();
        if (data?.ghlLocationId) authorizedLocationId = data.ghlLocationId;
        if (data?.ghlApiKey) brokerApiKey = data.ghlApiKey;
      }
    }
  } catch (e) {
    console.warn("Error al consultar Firestore para locationId y apiKey en pipelines:", e);
  }

  // Rechazar solicitudes que intenten forzar un locationId ajeno
  if (requestedLocationId && authorizedLocationId && requestedLocationId !== authorizedLocationId) {
    return NextResponse.json(
      { data: null, error: "Acceso denegado. No tienes autorización para consultar la subcuenta CRM especificada.", code: "FORBIDDEN_LOCATION_ACCESS" },
      { status: 403 }
    );
  }

  try {
    const rawData = await getGHLOpportunities(authorizedLocationId, pipelineId, brokerApiKey);
    return NextResponse.json({ data: rawData, error: null });
  } catch (error: any) {
    console.error("CRM Pipelines API Error:", error);
    const safeMsg = typeof error?.message === "string" && !error.message.includes("<html")
      ? error.message 
      : "Error al consultar pipeline del CRM";
    return NextResponse.json(
      { data: null, error: safeMsg, code: "CRM_API_ERROR" },
      { status: 500 }
    );
  }
}
