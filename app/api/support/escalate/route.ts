import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/firebase-admin";
import { 
  createEnhancedTicket, 
  updateConversationStatus, 
  getConversationMessages 
} from "@/lib/services/support-service";
import { SupportTicketV2, EscalationDepartment } from "@/app/hub/broker-onboarding/types";

export async function POST(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { conversationId, department, reason } = body as {
      conversationId: string;
      department: EscalationDepartment;
      reason?: string;
    };

    if (!conversationId || !department) {
      return NextResponse.json({ error: "conversationId y department son requeridos" }, { status: 400 });
    }

    // Obtener los últimos mensajes para la descripción del ticket
    const messages = await getConversationMessages(user.uid, conversationId);
    const lastMessages = messages.slice(-4).map(m => 
      `[${m.role === 'user' ? 'Broker' : 'Asistente IA'}]: ${m.content}`
    ).join('\n\n');

    let ticketCategory: SupportTicketV2["category"] = "general";
    if (department === "Comisiones & Casos" || department === "MCA James") {
      ticketCategory = "commission";
    } else if (department === "Soporte VIP General") {
      ticketCategory = "ghl_crm";
    } else if (department === "Taxes & Legal") {
      ticketCategory = "general"; // No hay categoría específica, usamos general
    }

    const ticketDescription = `Escalación solicitada a: ${department}\nMotivo: ${reason || 'No especificado'}\n\n--- Contexto reciente de la conversación ---\n\n${lastMessages}`;

    const newTicket: Omit<SupportTicketV2, "id"> = {
      subject: `Escalación: ${department}`,
      category: ticketCategory,
      priority: "high", // Escalaciones de IA son prioridad alta por defecto
      status: "open",
      description: ticketDescription,
      conversationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 1. Crear el ticket
    const ticketId = await createEnhancedTicket(user.uid, newTicket);

    // 2. Marcar la conversación como escalada
    await updateConversationStatus(user.uid, conversationId, {
      status: "escalated",
      escalatedTo: department
    });

    return NextResponse.json({ 
      success: true, 
      ticketId,
      message: "Conversación escalada exitosamente"
    });

  } catch (error) {
    console.error("Error al escalar conversación:", error);
    return NextResponse.json({ error: "Error interno al escalar" }, { status: 500 });
  }
}
