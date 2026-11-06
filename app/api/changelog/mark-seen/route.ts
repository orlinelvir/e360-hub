import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";

// Nunca deja que el marcador retroceda — si dos pestañas mandan ids distintos
// casi al mismo tiempo, siempre gana el más alto.
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
    const id = Number(body.id);
    if (!Number.isFinite(id) || id < 0) {
      return NextResponse.json({ error: "id inválido" }, { status: 400 });
    }

    const ref = adminDb.collection("brokers").doc(user.uid);
    const snap = await ref.get();
    const currentId = Number(snap.data()?.lastSeenChangelogId) || 0;

    if (id > currentId) {
      await ref.update({ lastSeenChangelogId: id });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error guardando última novedad vista:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
