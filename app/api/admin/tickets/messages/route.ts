import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole, hasPermission } from "@/lib/roles";
import { getTicketMessages, addTicketMessage, updateTicketStatus } from "@/lib/services/support-service";
import { TicketMessage } from "@/app/hub/broker-onboarding/types";

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const brokerId = searchParams.get("brokerId");
  const ticketId = searchParams.get("ticketId");

  if (!brokerId || !ticketId) {
    return NextResponse.json({ error: "brokerId y ticketId son requeridos" }, { status: 400 });
  }

  try {
    const role = await resolveUserRole(adminDb, user.uid, user.email);
    if (!hasPermission(role, "view_tickets")) {
      return NextResponse.json(
        { error: "Acceso restringido. Se requiere rol de soporte o administrador." },
        { status: 403 }
      );
    }

    const messages = await getTicketMessages(brokerId, ticketId);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Admin ticket messages GET error:", error);
    return NextResponse.json({ error: "Error al obtener mensajes" }, { status: 500 });
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
    const role = await resolveUserRole(adminDb, user.uid, user.email);
    if (!hasPermission(role, "reply_tickets")) {
      return NextResponse.json(
        { error: "Acceso restringido. Se requiere permiso para responder tickets." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { brokerId, ticketId, content } = body;

    if (!brokerId || !ticketId || !content) {
      return NextResponse.json({ error: "brokerId, ticketId y content son requeridos" }, { status: 400 });
    }

    const message: TicketMessage = {
      sender: "agent",
      senderName: user.name || user.email || "Soporte E360",
      content,
      createdAt: new Date().toISOString()
    };

    const messageId = await addTicketMessage(brokerId, ticketId, message);

    // Al responder, el ticket pasa a "en proceso" si seguía abierto
    await updateTicketStatus(brokerId, ticketId, "in_progress");

    return NextResponse.json({ success: true, messageId, message });
  } catch (error) {
    console.error("Admin ticket messages POST error:", error);
    return NextResponse.json({ error: "Error al enviar el mensaje" }, { status: 500 });
  }
}
