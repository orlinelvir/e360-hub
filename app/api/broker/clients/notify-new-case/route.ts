import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/firebase-admin";
import { notifyStaffOfNewReferredCase } from "@/lib/services/notification-service";

/**
 * El broker avisa al sistema que acaba de referir un cliente nuevo (ver
 * handleAddClient en MisClientesSection.tsx) — brokerId siempre es el propio
 * uid del token, nunca un parámetro, así un broker no puede disparar esto
 * sobre el caso de otro.
 */
export async function POST(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { clientId } = body;
    if (!clientId) {
      return NextResponse.json({ error: "clientId es requerido" }, { status: 400 });
    }

    const result = await notifyStaffOfNewReferredCase(user.uid, clientId);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "No se pudo enviar la notificación" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Broker notify-new-case POST error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
