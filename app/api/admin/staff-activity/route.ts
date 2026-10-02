import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole } from "@/lib/roles";
import { resolvePipelineCluster } from "@/lib/service-routing";
import { deriveCaseStatus } from "@/lib/services/case-status";

const STALE_DAYS_THRESHOLD = 3;

const DEFAULT_WINDOW_DAYS = 7;

/**
 * Actividad real de staff dentro del Hub — nació de una conversación sobre
 * evaluar el desempeño de un empleado solo con el conteo de llamadas, sin
 * ninguna visibilidad de lo que esa persona sí hace dentro del Hub (notas de
 * caso, cambios de estado, respuestas de tickets). Solo admin puede verla.
 */
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
    if (role !== "admin") {
      return NextResponse.json({ error: "Acceso restringido. Se requiere rol de administrador." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = Number(searchParams.get("days")) || DEFAULT_WINDOW_DAYS;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const isRecent = (iso: unknown) => {
      const t = new Date(String(iso || "")).getTime();
      return !Number.isNaN(t) && t >= cutoff;
    };

    const brokersSnap = await adminDb.collection("brokers").get();

    const staff: Record<string, { uid: string; name: string; email: string; role: string; lastLogin?: unknown; caseNotes: number; statusChanges: number; ticketReplies: number }> = {};
    brokersSnap.docs.forEach((d) => {
      const data = d.data();
      const r = data.role;
      if (r && r !== "broker") {
        staff[d.id] = {
          uid: d.id,
          name: data.displayName || data.name || d.id,
          email: data.email || "",
          role: r,
          lastLogin: data.lastLogin || null,
          caseNotes: 0,
          statusChanges: 0,
          ticketReplies: 0
        };
      }
    });

    // Notas de caso por persona (observation/case/broker, cualquier categoría cuenta como actividad real).
    const notesSnap = await adminDb.collectionGroup("caseNotes").get();
    notesSnap.docs.forEach((d) => {
      const n = d.data();
      if (staff[n.authorId] && isRecent(n.createdAt)) staff[n.authorId].caseNotes++;
    });

    // Cambios de estado de caso (aprobar/declinar/fondear/notas admin) — requiere
    // iterar los clientes de cada broker, ya que no hay índice global por updatedByUid.
    // De paso se arma el backlog actual por cluster (no por persona — los casos no
    // tienen un "dueño" asignado individualmente, solo una vertical).
    const backlogByCluster: Record<string, { pendingDocs: number; inReview: number; staleCases: string[] }> = {};
    const now = Date.now();

    await Promise.all(
      brokersSnap.docs.map(async (bDoc) => {
        const clientsSnap = await bDoc.ref.collection("clients").get();
        clientsSnap.docs.forEach((cDoc) => {
          const c = cDoc.data();

          if (c.updatedByUid && staff[c.updatedByUid] && isRecent(c.updatedAt)) {
            staff[c.updatedByUid].statusChanges++;
          }

          const cluster = resolvePipelineCluster(c.serviceId, c.serviceName);
          const { reviewStatus } = deriveCaseStatus(c);
          if (reviewStatus !== "pending_docs" && reviewStatus !== "in_review") return;

          if (!backlogByCluster[cluster]) backlogByCluster[cluster] = { pendingDocs: 0, inReview: 0, staleCases: [] };
          if (reviewStatus === "pending_docs") backlogByCluster[cluster].pendingDocs++;
          if (reviewStatus === "in_review") {
            backlogByCluster[cluster].inReview++;
            const ageDays = c.createdAt ? (now - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 0;
            if (ageDays > STALE_DAYS_THRESHOLD) {
              backlogByCluster[cluster].staleCases.push(`${c.name || "Cliente"} (${Math.round(ageDays)}d)`);
            }
          }
        });
      })
    );

    // Respuestas de ticket por persona.
    const messagesSnap = await adminDb.collectionGroup("messages").get();
    messagesSnap.docs.forEach((d) => {
      const m = d.data();
      if (m.sender === "agent" && m.senderId && staff[m.senderId] && isRecent(m.createdAt)) {
        staff[m.senderId].ticketReplies++;
      }
    });

    return NextResponse.json({
      windowDays: days,
      staff: Object.values(staff).sort((a, b) => (b.caseNotes + b.statusChanges + b.ticketReplies) - (a.caseNotes + a.statusChanges + a.ticketReplies)),
      backlogByCluster
    });
  } catch (error) {
    console.error("Admin staff-activity GET error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
