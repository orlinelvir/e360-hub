import { NextResponse } from "next/server";
import { getGHLContacts, createGHLContact, CRMError } from "@/lib/ghl";
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
  const query = searchParams.get("query") || undefined;

  const { locationId: authorizedLocationId, apiKey: brokerApiKey } = await resolveBrokerCredentials(user.uid, request);

  // Validar que no se acceda a una subcuenta ajena
  if (requestedLocationId && authorizedLocationId && requestedLocationId.trim() !== authorizedLocationId) {
    return NextResponse.json(
      { data: null, error: "Acceso denegado. No tienes autorización para consultar esa subcuenta CRM.", code: "FORBIDDEN_LOCATION_ACCESS" },
      { status: 403 }
    );
  }

  // Credenciales requeridas para continuar
  if (!authorizedLocationId || !brokerApiKey) {
    return NextResponse.json(
      {
        data: null,
        error: "No se han configurado las credenciales CRM. Ve a 'Mi Perfil' y vincula tu subcuenta StartPoint CRM con tu Location ID y Token PIT.",
        code: "CRM_NOT_CONFIGURED"
      },
      { status: 400 }
    );
  }

  try {
    const rawData = await getGHLContacts(authorizedLocationId, query, brokerApiKey);
    return NextResponse.json({ data: rawData, contacts: rawData.contacts || [], error: null });
  } catch (error: any) {
    const status = error.status || 500;
    const safeMsg = typeof error?.message === "string" && !error.message.includes("<html")
      ? error.message
      : "Error al comunicarse con el servidor CRM";
    
    console.error("CRM Contacts API Error:", {
      uid: user.uid,
      locationId: authorizedLocationId?.substring(0, 8) + "...",
      ghlStatus: status,
      ghlMessage: safeMsg,
      hasApiKey: Boolean(brokerApiKey),
    });
    
    return NextResponse.json(
      { data: null, error: safeMsg, code: "CRM_API_ERROR", ghlStatus: status },
      { status }
    );
  }
}

export async function POST(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json(
      { data: null, error: "No autorizado. Sesión inválida o expirada.", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  // Rate Limiting más estricto para creación (10 creaciones/min por usuario)
  if (isRateLimited(`create_${user.uid}`, 10, 60000)) {
    return NextResponse.json(
      { data: null, error: "Límite de creación alcanzado. Espera un minuto antes de crear más leads.", code: "TOO_MANY_REQUESTS" },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, locationId: requestedLocationId, service, amount } = body;

    if (!firstName || !email) {
      return NextResponse.json(
        { data: null, error: "El nombre y correo electrónico son obligatorios.", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    const { locationId: authorizedLocationId, apiKey: brokerApiKey } = await resolveBrokerCredentials(user.uid, request);

    // Validar que no se envíe a una subcuenta ajena
    if (requestedLocationId && authorizedLocationId && requestedLocationId.trim() !== authorizedLocationId) {
      return NextResponse.json(
        { data: null, error: "Acceso denegado. No tienes autorización para enviar datos a esa subcuenta CRM.", code: "FORBIDDEN_LOCATION_ACCESS" },
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

    const contactData = {
      firstName,
      lastName,
      email,
      phone,
      tags: [service ? `Servicio: ${service}` : "General Lead"],
      customFields: amount ? [{ id: "estimated_amount", key: "monto_estimado", value: amount }] : []
    };

    const newContact = await createGHLContact(contactData, authorizedLocationId, brokerApiKey);
    return NextResponse.json({ data: { success: true, contact: newContact }, contact: newContact, error: null });
  } catch (error: any) {
    console.error("CRM Create Contact API Error:", error);
    const status = error.status || 500;
    const safeMsg = typeof error?.message === "string" && !error.message.includes("<html")
      ? error.message
      : "Error al registrar cliente en el CRM";
    return NextResponse.json(
      { data: null, error: safeMsg, code: "CRM_API_ERROR" },
      { status }
    );
  }
}
