import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole, hasPermission } from "@/lib/roles";
import { getAllEnhancedTicketsAdmin, updateTicketStatus } from "@/lib/services/support-service";

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const role = await resolveUserRole(adminDb, user.uid, user.email);

    if (!hasPermission(role, "view_tickets")) {
      return NextResponse.json(
        { error: "Acceso restringido. Se requiere rol de soporte o administrador." },
        { status: 403 }
      );
    }

    const tickets = await getAllEnhancedTicketsAdmin();

    const db = adminDb;
    const brokerIds = Array.from(new Set(tickets.map((t) => t.brokerId).filter(Boolean)));
    const brokerNames = new Map<string, string>();
    await Promise.all(
      brokerIds.map(async (id) => {
        const snap = await db.collection("brokers").doc(id).get();
        const data = snap.data();
        brokerNames.set(id, data?.displayName || data?.name || data?.email || id);
      })
    );

    const enriched = tickets.map((t) => ({
      ...t,
      brokerName: brokerNames.get(t.brokerId) || t.brokerId
    }));

    return NextResponse.json({ tickets: enriched, total: enriched.length });
  } catch (error) {
    console.error("Admin tickets GET error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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
    const { brokerId, ticketId, status } = body;

    if (!brokerId || !ticketId || !status) {
      return NextResponse.json({ error: "brokerId, ticketId y status son requeridos" }, { status: 400 });
    }

    await updateTicketStatus(brokerId, ticketId, status);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin tickets PATCH error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
