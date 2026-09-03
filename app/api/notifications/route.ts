import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/firebase-admin";
import { getNotifications, getUnreadCount } from "@/lib/services/notification-service";

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const [notifications, unreadCount] = await Promise.all([
      getNotifications(user.uid),
      getUnreadCount(user.uid)
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Notifications GET error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
