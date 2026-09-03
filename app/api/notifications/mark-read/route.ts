import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/firebase-admin";
import { markNotificationsRead, markAllNotificationsRead } from "@/lib/services/notification-service";

export async function POST(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ids, all } = body;

    if (all) {
      await markAllNotificationsRead(user.uid);
    } else if (Array.isArray(ids) && ids.length > 0) {
      await markNotificationsRead(user.uid, ids);
    } else {
      return NextResponse.json({ error: "Se requiere 'ids' (arreglo) o 'all: true'" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notifications mark-read error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
