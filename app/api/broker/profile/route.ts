import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const brokerRef = adminDb.collection("brokers").doc(user.uid);
    const snap = await brokerRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ profile: snap.data() });
  } catch (error) {
    console.error("Broker profile GET error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const {
      displayName,
      businessName,
      phone,
      whatsapp,
      city,
      state,
      nmlsId,
      licenseNumber,
      bio,
      specialties,
      referralSlug,
      documentsStatus
    } = body;

    const brokerRef = adminDb.collection("brokers").doc(user.uid);

    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date().toISOString()
    };

    if (displayName !== undefined) updatePayload.displayName = String(displayName).trim();
    if (businessName !== undefined) updatePayload.businessName = String(businessName).trim();
    if (phone !== undefined) updatePayload.phone = String(phone).trim();
    if (whatsapp !== undefined) updatePayload.whatsapp = String(whatsapp).trim();
    if (city !== undefined) updatePayload.city = String(city).trim();
    if (state !== undefined) updatePayload.state = String(state).trim();
    if (nmlsId !== undefined) updatePayload.nmlsId = String(nmlsId).trim();
    if (licenseNumber !== undefined) updatePayload.licenseNumber = String(licenseNumber).trim();
    if (bio !== undefined) updatePayload.bio = String(bio).trim();
    if (specialties !== undefined) updatePayload.specialties = Array.isArray(specialties) ? specialties : [];
    if (referralSlug !== undefined) updatePayload.referralSlug = String(referralSlug).toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (documentsStatus !== undefined) updatePayload.documentsStatus = documentsStatus;

    await brokerRef.set(updatePayload, { merge: true });

    return NextResponse.json({ success: true, updated: updatePayload });
  } catch (error) {
    console.error("Broker profile POST error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
