import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/firebase-admin";
import { getCaseNotes } from "@/lib/services/case-service";

/**
 * Notas visibles para el broker sobre su propio cliente. Solo categoría "broker" —
 * las notas internas de observación/caso nunca llegan aquí (ver /api/admin/cases/notes).
 */
export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId es requerido" }, { status: 400 });
  }

  try {
    const notes = await getCaseNotes(user.uid, clientId, ["broker"]);
    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Broker case notes GET error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
