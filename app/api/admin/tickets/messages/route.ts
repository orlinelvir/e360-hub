import { NextResponse, after } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole, hasPermission } from "@/lib/roles";
import { getTicketMessages, addTicketMessage, updateTicketStatus, updateEnhancedTicket } from "@/lib/services/support-service";
import { createNotification } from "@/lib/services/notification-service";
import { sendTicketReplyEmail } from "@/lib/email/send";
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

    // Crítico: el broker debe enterarse de que le respondieron. Antes solo el
    // staff recibía aviso al crearse el ticket y la respuesta se quedaba aquí —
    // el reclamo "abrí un ticket y nadie me contestó" nacía de este hueco.
    const ticketSnap = await adminDb
      .collection("brokers")
      .doc(brokerId)
      .collection("enhancedTickets")
      .doc(ticketId)
      .get();
    const brokerSnap = await adminDb.collection("brokers").doc(brokerId).get();
    const brokerData = brokerSnap.data();
    const existingTicket = ticketSnap.data();
    const ticketSubject = existingTicket?.subject || "tu ticket de soporte";
    const brokerName = brokerData?.displayName || brokerData?.name || "Broker";
    const preview = content.replace(/\s+/g, " ").trim().slice(0, 180);

    // Métricas de SLA: la primera respuesta fija el reloj del tiempo de
    // respuesta; y si el ticket estaba escalado por el cron, responder lo
    // desescala (escalatedAt queda como histórico).
    const ticketUpdates: Record<string, unknown> = {};
    if (!existingTicket?.firstResponseAt) {
      ticketUpdates.firstResponseAt = new Date().toISOString();
    }
    if (existingTicket?.escalated) {
      ticketUpdates.escalated = false;
    }
    if (Object.keys(ticketUpdates).length > 0) {
      await updateEnhancedTicket(brokerId, ticketId, ticketUpdates);
    }

    after(() =>
      createNotification(brokerId, {
        title: "Soporte respondió a tu ticket",
        message: `${ticketSubject} — ${preview}`,
        link: "soporte"
      })
    );

    after(() =>
      sendTicketReplyEmail({
        brokerEmail: brokerData?.email || "",
        brokerName,
        ticketSubject,
        senderName: message.senderName,
        messagePreview: preview
      })
    );

    return NextResponse.json({ success: true, messageId, message });
  } catch (error) {
    console.error("Admin ticket messages POST error:", error);
    return NextResponse.json({ error: "Error al enviar el mensaje" }, { status: 500 });
  }
}
