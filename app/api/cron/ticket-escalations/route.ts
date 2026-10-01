import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getAllEnhancedTicketsAdmin, updateEnhancedTicket } from "@/lib/services/support-service";
import { findStaffUidsByRoles, notifyMany } from "@/lib/services/notification-service";
import { getRoleIdsForTicketCategory } from "@/lib/roles";
import { getTicketSlaHours, getTicketSlaShortLabel } from "@/lib/support/ticket-sla";

// Un ticket "en proceso" sin ninguna actividad durante 72h también escala,
// aunque su SLA de respuesta ya se haya cumplido — nadie puede quedar invisible.
const STALL_HOURS = 72;

/**
 * Cron horario (ver vercel.json) que escala automáticamente los tickets cuyo
 * SLA de respuesta se venció sin que nadie contestara, y los que llevan 72h+
 * sin actividad estando en proceso. Cada escalación:
 *  1. marca el ticket (`escalated: true` + motivo, visible en listados admin),
 *  2. notifica al staff de esa categoría (siempre incluye "admin").
 * El ticket deja de estar escalado cuando un agente responde (se limpia en la
 * ruta de mensajes) o cuando cambia de estado.
 *
 * Autenticado con CRON_SECRET, igual que los demás crons de Vercel.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const tickets = await getAllEnhancedTicketsAdmin();
    const now = Date.now();
    const escalated: { ticketId: string; brokerId: string; reason: string }[] = [];

    for (const t of tickets) {
      if (t.status === "resolved") continue;
      if (t.escalated) continue; // ya escalado y sin respuesta: no repetir aviso

      const slaHours = getTicketSlaHours(t.priority);
      const createdMs = Date.parse(t.createdAt);
      if (Number.isNaN(createdMs)) continue;

      let reason: string | null = null;
      if (!t.firstResponseAt && now - createdMs > slaHours * 3_600_000) {
        reason = `SLA de respuesta vencido (${getTicketSlaShortLabel(t.priority)}) sin primera respuesta`;
      } else {
        // Cualquier ticket activo (abierto o en proceso) sin actividad durante
        // 72h también escala — cubre conversaciones estancadas y reabiertas.
        const updatedMs = Date.parse(t.updatedAt || t.createdAt);
        if (!Number.isNaN(updatedMs) && now - updatedMs > STALL_HOURS * 3_600_000) {
          reason = `Sin actividad en ${STALL_HOURS}h (${t.status === "in_progress" ? "en proceso" : "abierto"})`;
        }
      }
      if (!reason) continue;

      await updateEnhancedTicket(t.brokerId, t.id, {
        escalated: true,
        escalatedAt: new Date().toISOString(),
        escalationReason: reason
      });

      const brokerSnap = await adminDb.collection("brokers").doc(t.brokerId).get();
      const brokerName = brokerSnap.data()?.displayName || brokerSnap.data()?.name || t.brokerId;

      const staffUids = await findStaffUidsByRoles(getRoleIdsForTicketCategory(t.category));
      await notifyMany(staffUids, {
        title: "Ticket escalado por SLA vencido",
        message: `${brokerName}: ${t.subject} — ${reason}`,
        link: "admin"
      });

      escalated.push({ ticketId: t.id, brokerId: t.brokerId, reason });
    }

    return NextResponse.json({ checked: tickets.length, escalated: escalated.length, details: escalated });
  } catch (error) {
    console.error("Error en cron de escalación de tickets:", error);
    return NextResponse.json({ error: "Error al procesar escalaciones de tickets" }, { status: 500 });
  }
}
