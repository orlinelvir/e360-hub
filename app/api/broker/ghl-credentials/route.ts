import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { encrypt } from "@/lib/crypto";

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
    const { ghlLocationId, ghlApiKey } = body;

    if (!ghlLocationId || typeof ghlLocationId !== "string") {
      return NextResponse.json({ error: "Location ID requerido" }, { status: 400 });
    }
    if (!ghlApiKey || typeof ghlApiKey !== "string") {
      return NextResponse.json({ error: "API Key requerida" }, { status: 400 });
    }

    const encryptedKey = encrypt(ghlApiKey.trim());

    await adminDb.collection("brokers").doc(user.uid).set({
      ghlLocationId: ghlLocationId.trim(),
      ghlApiKey: encryptedKey,
      ghlConnected: true,
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al guardar credenciales GHL:", error);
    return NextResponse.json({ error: "Error al guardar credenciales" }, { status: 500 });
  }
}
