import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/firebase-admin";
import { getTicketMessages, addTicketMessage } from "@/lib/services/support-service";
import { TicketMessage } from "@/app/hub/broker-onboarding/types";

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ticketId = searchParams.get("ticketId");

  if (!ticketId) {
    return NextResponse.json({ error: "ticketId es requerido" }, { status: 400 });
  }

  try {
    const messages = await getTicketMessages(user.uid, ticketId);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error obteniendo mensajes del ticket:", error);
    return NextResponse.json({ error: "Error al obtener mensajes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ticketId, content } = body;

    if (!ticketId || !content) {
      return NextResponse.json({ error: "ticketId y content son requeridos" }, { status: 400 });
    }

    const message: TicketMessage = {
      sender: "broker",
      senderName: user.name || user.email || "Broker",
      content,
      createdAt: new Date().toISOString()
    };

    const messageId = await addTicketMessage(user.uid, ticketId, message);

    return NextResponse.json({ success: true, messageId, message });
  } catch (error) {
    console.error("Error agregando mensaje al ticket:", error);
    return NextResponse.json({ error: "Error al enviar el mensaje" }, { status: 500 });
  }
}
