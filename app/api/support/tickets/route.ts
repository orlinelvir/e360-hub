import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/firebase-admin";
import {
  getEnhancedTickets,
  createEnhancedTicket,
  updateTicketStatus,
  updateConversationStatus
} from "@/lib/services/support-service";
import { SupportTicketV2 } from "@/app/hub/broker-onboarding/types";

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const tickets = await getEnhancedTickets(user.uid);
    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Error obteniendo tickets:", error);
    return NextResponse.json({ error: "Error al obtener tickets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { subject, category, priority, description, conversationId } = body;

    if (!subject || !category || !priority || !description) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const newTicket: Omit<SupportTicketV2, "id"> = {
      subject,
      category,
      priority,
      status: "open",
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(conversationId ? { conversationId } : {})
    };

    const ticketId = await createEnhancedTicket(user.uid, newTicket);

    if (conversationId) {
      await updateConversationStatus(user.uid, conversationId, { status: "escalated" });
    }

    return NextResponse.json({
      success: true,
      ticketId,
      ticket: { id: ticketId, ...newTicket }
    });
  } catch (error) {
    console.error("Error creando ticket:", error);
    return NextResponse.json({ error: "Error al crear el ticket" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ticketId, status } = body;

    if (!ticketId || !status) {
      return NextResponse.json({ error: "ticketId y status son requeridos" }, { status: 400 });
    }

    await updateTicketStatus(user.uid, ticketId, status);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error actualizando ticket:", error);
    return NextResponse.json({ error: "Error al actualizar el ticket" }, { status: 500 });
  }
}
