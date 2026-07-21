import { NextResponse } from "next/server";
import { getGHLOpportunities } from "@/lib/ghl";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { isRateLimited } from "@/lib/rate-limit";

/**
 * Resuelve las credenciales CRM del broker en orden de prioridad:
 * 1. Firestore (Admin SDK)
 * 2. Headers x-crm-location-id / x-crm-api-key (fallback local)
 * 3. Variables de entorno globales (solo desarrollo)
 */
async function resolveBrokerCredentials(
  uid: string,
  request: Request
): Promise<{ locationId: string | undefined; apiKey: string | undefined }> {
  let locationId: string | undefined = process.env.GHL_DEFAULT_LOCATION_ID || undefined;
  let apiKey: string | undefined = process.env.GHL_PRIVATE_KEY || process.env.GHL_AGENCY_API_KEY || undefined;

  try {
    if (adminDb) {
      const brokerSnap = await adminDb.collection("brokers").doc(uid).get();
      if (brokerSnap.exists) {
        const data = brokerSnap.data();
        if (data?.ghlLocationId) locationId = data.ghlLocationId;
        if (data?.ghlApiKey) apiKey = data.ghlApiKey;
      }
    }
  } catch (e) {
    console.warn("No se pudo consultar Firestore Admin para credenciales del broker (usando fallback de headers):", e);
  }

  if (!locationId) {
    const headerLocationId = request.headers.get("x-crm-location-id");
    if (headerLocationId) locationId = headerLocationId;
  }
  if (!apiKey) {
    const headerApiKey = request.headers.get("x-crm-api-key");
    if (headerApiKey) apiKey = headerApiKey;
  }

  return { locationId, apiKey };
}

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

  const { locationId: authorizedLocationId, apiKey: brokerApiKey } = await resolveBrokerCredentials(user.uid, request);

  if (requestedLocationId && authorizedLocationId && requestedLocationId !== authorizedLocationId) {
    return NextResponse.json(
      { data: null, error: "Acceso denegado. No tienes autorización para consultar esa subcuenta CRM.", code: "FORBIDDEN_LOCATION_ACCESS" },
      { status: 403 }
    );
  }

  if (!authorizedLocationId || !brokerApiKey) {
    return NextResponse.json(
      {
        data: null,
        error: "No se han configurado las credenciales CRM. Ve a 'Mi Perfil' y vincula tu subcuenta StartPoint CRM.",
        code: "CRM_NOT_CONFIGURED"
      },
      { status: 400 }
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
