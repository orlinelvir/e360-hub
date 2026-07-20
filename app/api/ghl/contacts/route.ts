import { NextResponse } from "next/server";
import { getGHLContacts, createGHLContact } from "@/lib/ghl";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("locationId") || undefined;
  const query = searchParams.get("query") || undefined;

  try {
    const data = await getGHLContacts(locationId, query);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("GHL Contacts API Error:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener contactos de GHL" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, locationId, service, amount } = body;

    if (!firstName || !email) {
      return NextResponse.json(
        { error: "El nombre y correo electrónico son obligatorios." },
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

    const newContact = await createGHLContact(contactData, locationId);
    return NextResponse.json({ success: true, contact: newContact });
  } catch (error: any) {
    console.error("GHL Create Contact API Error:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear cliente en GHL" },
      { status: 500 }
    );
  }
}
