import { NextResponse } from "next/server";
import { getGHLOpportunities, CRMError } from "@/lib/ghl";
import { verifyAuthToken } from "@/lib/firebase-admin";
import { isRateLimited } from "@/lib/rate-limit";
import { resolveBrokerCredentials } from "@/lib/resolve-broker-credentials";

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

  if (requestedLocationId && authorizedLocationId && requestedLocationId.trim() !== authorizedLocationId) {
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
  } catch (error) {
    console.error("CRM Pipelines API Error:", error);
    const status = error instanceof CRMError ? error.status : 500;
    const message = error instanceof Error ? error.message : "";
    const safeMsg = message && !message.includes("<html")
      ? message
      : "Error al consultar pipeline del CRM";
    return NextResponse.json(
      { data: null, error: safeMsg, code: "CRM_API_ERROR" },
      { status }
    );
  }
}
