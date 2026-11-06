import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole } from "@/lib/roles";
import { CHANGELOG } from "@/lib/changelog";

// Un broker solo ve lo que le toca a él ("broker" o "all"); cualquier otro
// rol (staff/admin) ve absolutamente todo, incluido lo que ven los brokers —
// les sirve de contexto para dar soporte.
export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const role = await resolveUserRole(adminDb, user.uid, user.email);
    const isBroker = role === "broker";

    const brokerSnap = await adminDb.collection("brokers").doc(user.uid).get();
    const lastSeenId = Number(brokerSnap.data()?.lastSeenChangelogId) || 0;

    const entries = CHANGELOG.filter((e) => e.id > lastSeenId && (isBroker ? e.audience !== "staff" : true)).sort((a, b) => b.id - a.id);

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Error obteniendo novedades del Hub:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
