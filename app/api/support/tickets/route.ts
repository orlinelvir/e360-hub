import { NextResponse, after } from "next/server";
import { verifyAuthToken, adminDb, adminStorage } from "@/lib/firebase-admin";
import {
  getEnhancedTickets,
  createEnhancedTicket,
  updateEnhancedTicket,
  updateTicketStatus,
  updateConversationStatus
} from "@/lib/services/support-service";
import { SupportTicketV2, TicketCategory } from "@/app/hub/broker-onboarding/types";
import { getRoleIdsForTicketCategory } from "@/lib/roles";
import { findStaffUidsByRoles, notifyMany } from "@/lib/services/notification-service";

const MAX_ATTACHMENT_SIZE = 8 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const ATTACHMENT_SIGNED_URL_EXPIRY_MS = 15 * 60 * 1000;

async function resolveAttachmentUrl(ticket: SupportTicketV2): Promise<SupportTicketV2> {
  if (!ticket.attachmentPath || !adminStorage) return ticket;
  try {
    const [url] = await adminStorage.bucket().file(ticket.attachmentPath).getSignedUrl({
      action: "read",
      expires: Date.now() + ATTACHMENT_SIGNED_URL_EXPIRY_MS
    });
    return { ...ticket, attachmentUrl: url };
  } catch (err) {
    console.error("No se pudo generar URL firmada del adjunto del ticket:", err);
    return ticket;
  }
}

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const tickets = await getEnhancedTickets(user.uid);
    const enriched = await Promise.all(tickets.map(resolveAttachmentUrl));
    return NextResponse.json({ tickets: enriched });
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
  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const subject = (formData.get("subject") as string) || "";
    const category = (formData.get("category") as TicketCategory) || "general";
    const priority = (formData.get("priority") as SupportTicketV2["priority"]) || "medium";
    const description = (formData.get("description") as string) || "";
    const conversationId = (formData.get("conversationId") as string) || undefined;
    const relatedClientId = (formData.get("relatedClientId") as string) || undefined;
    const relatedClientName = (formData.get("relatedClientName") as string) || undefined;
    const categoryFieldsRaw = formData.get("categoryFields") as string | null;

    if (!subject || !category || !priority || !description) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    let categoryFields: Record<string, string> | undefined;
    if (categoryFieldsRaw) {
      try {
        categoryFields = JSON.parse(categoryFieldsRaw);
      } catch {
        categoryFields = undefined;
      }
    }

    const attachmentEntry = formData.get("attachment");
    const attachment = attachmentEntry instanceof File && attachmentEntry.size > 0 ? attachmentEntry : null;
    if (attachment) {
      if (!ALLOWED_ATTACHMENT_TYPES.includes(attachment.type)) {
        return NextResponse.json({ error: "Tipo de archivo no permitido (solo imagen o PDF)" }, { status: 400 });
      }
      if (attachment.size > MAX_ATTACHMENT_SIZE) {
        return NextResponse.json({ error: "El archivo no debe superar 8MB" }, { status: 400 });
      }
    }

    const newTicket: Omit<SupportTicketV2, "id"> = {
      subject,
      category,
      priority,
      status: "open",
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(conversationId ? { conversationId } : {}),
      ...(relatedClientId ? { relatedClientId } : {}),
      ...(relatedClientName ? { relatedClientName } : {}),
      ...(categoryFields ? { categoryFields } : {})
    };

    const ticketId = await createEnhancedTicket(user.uid, newTicket);

    if (conversationId) {
      await updateConversationStatus(user.uid, conversationId, { status: "escalated" });
    }

    if (attachment && adminStorage) {
      try {
        const buffer = Buffer.from(await attachment.arrayBuffer());
        const attachmentPath = `ticket-attachments/${user.uid}/${ticketId}/${Date.now()}-${attachment.name}`;
        await adminStorage.bucket().file(attachmentPath).save(buffer, { contentType: attachment.type });
        await updateEnhancedTicket(user.uid, ticketId, {
          attachmentPath,
          attachmentFileName: attachment.name,
          attachmentContentType: attachment.type
        });
        newTicket.attachmentPath = attachmentPath;
        newTicket.attachmentFileName = attachment.name;
        newTicket.attachmentContentType = attachment.type;
      } catch (err) {
        console.error("Error subiendo el adjunto del ticket:", err);
      }
    }

    const brokerSnap = await adminDb.collection("brokers").doc(user.uid).get();
    const brokerName = brokerSnap.data()?.displayName || brokerSnap.data()?.name || "Un broker";

    after(async () => {
      const staffUids = await findStaffUidsByRoles(getRoleIdsForTicketCategory(category));
      await notifyMany(staffUids, {
        title: "Nuevo ticket de soporte",
        message: `${brokerName}: ${subject}`,
        link: "admin"
      });
    });

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
