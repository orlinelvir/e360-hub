import { NextResponse } from "next/server";
import { getGHLContacts, createGHLContact } from "@/lib/ghl";
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
  const query = searchParams.get("query") || undefined;

  let authorizedLocationId = process.env.GHL_DEFAULT_LOCATION_ID;

  try {
    if (adminDb) {
      const brokerSnap = await adminDb.collection("brokers").doc(user.uid).get();
      if (brokerSnap.exists && brokerSnap.data()?.ghlLocationId) {
        authorizedLocationId = brokerSnap.data()?.ghlLocationId;
      }
    }
  } catch (e) {
    console.warn("Error al consultar Firestore para locationId del broker:", e);
  }

  // Rechazar solicitudes que intenten forzar un locationId ajeno
  if (requestedLocationId && authorizedLocationId && requestedLocationId !== authorizedLocationId) {
    return NextResponse.json(
      { data: null, error: "Acceso denegado. No tienes autorización para consultar la subcuenta GHL especificada.", code: "FORBIDDEN_LOCATION_ACCESS" },
      { status: 403 }
    );
  }

  try {
    const rawData = await getGHLContacts(authorizedLocationId, query);
    return NextResponse.json({ data: rawData, contacts: rawData.contacts || [], error: null });
  } catch (error: any) {
    console.error("GHL Contacts API Error:", error);
    const safeMsg = typeof error?.message === "string" && !error.message.includes("<html")
      ? error.message 
      : "Error al comunicarse con GoHighLevel API";
    return NextResponse.json(
      { data: null, error: safeMsg, code: "GHL_API_ERROR" },
      { status: 500 }
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
    let { firstName, lastName, email, phone, locationId: requestedLocationId, service, amount } = body;

    if (!firstName || !email) {
      return NextResponse.json(
        { data: null, error: "El nombre y correo electrónico son obligatorios.", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    let authorizedLocationId = process.env.GHL_DEFAULT_LOCATION_ID;

    try {
      if (adminDb) {
        const brokerSnap = await adminDb.collection("brokers").doc(user.uid).get();
        if (brokerSnap.exists && brokerSnap.data()?.ghlLocationId) {
          authorizedLocationId = brokerSnap.data()?.ghlLocationId;
        }
      }
    } catch (e) {
      console.warn("Error al consultar Firestore para locationId en POST:", e);
    }

    // Rechazar si intenta forzar un locationId ajeno
    if (requestedLocationId && authorizedLocationId && requestedLocationId !== authorizedLocationId) {
      return NextResponse.json(
        { data: null, error: "Acceso denegado. No tienes autorización para enviar datos a la subcuenta GHL especificada.", code: "FORBIDDEN_LOCATION_ACCESS" },
        { status: 403 }
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

    const newContact = await createGHLContact(contactData, authorizedLocationId);
    return NextResponse.json({ data: { success: true, contact: newContact }, contact: newContact, error: null });
  } catch (error: any) {
    console.error("GHL Create Contact API Error:", error);
    const safeMsg = typeof error?.message === "string" && !error.message.includes("<html")
      ? error.message 
      : "Error al registrar cliente en GoHighLevel API";
    return NextResponse.json(
      { data: null, error: safeMsg, code: "GHL_API_ERROR" },
      { status: 500 }
    );
  }
}
