import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { deriveCaseStatus } from "@/lib/services/case-status";
import { createNotification } from "@/lib/services/notification-service";

// Los 3 nombres que Fernando pidió explícitamente que reciban estas alertas
// (reunión del 21 de septiembre 2026) — no es un rol genérico, son estas
// personas puntuales, así que se apunta por uid en vez de por permiso.
const ALERT_RECIPIENT_UIDS: { uid: string; name: string }[] = [
  { uid: "ckCwUSr3O6bXsfSgtejo92AcPMq2", name: "Anthony Elvir" },
  { uid: "8xcFRaAleNUWe7B3d9Wt577pAtZ2", name: "Elian Mena Santana" },
  { uid: "VMh1anllGxNlyMLh9Y19QODGB1h2", name: "Mario Chavez" }
];

const THRESHOLDS_HOURS = [24, 48, 72] as const;

// Cuenta solo horas de lunes a viernes entre `fromISO` y `to` — un caso
// creado el viernes en la tarde no debe "cumplir 24 horas" el sábado en la
// mañana, tal como se pidió explícitamente excluir fines de semana.
function businessHoursElapsed(fromISO: string, to: Date): number {
  const from = new Date(fromISO);
  if (Number.isNaN(from.getTime())) return 0;
  let hours = 0;
  const cursor = new Date(from);
  while (cursor < to) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) hours += 1;
    cursor.setTime(cursor.getTime() + 60 * 60 * 1000);
  }
  return hours;
}

function highestThresholdReached(hours: number): number {
  let reached = 0;
  for (const t of THRESHOLDS_HOURS) {
    if (hours >= t) reached = t;
  }
  return reached;
}

/**
 * Cron diario (ver vercel.json) que alerta a Anthony, Elian y Mario cuando un
 * caso lleva 24/48/72 horas hábiles sin salir de "Pendiente de Documentos" o
 * "En Revisión" — cada umbral se notifica una sola vez por caso (se guarda en
 * `lastPendingAlertHours`), para no repetir el aviso cada día que pasa.
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
    const now = new Date();
    const brokersSnap = await adminDb.collection("brokers").get();
    const alerted: { brokerId: string; clientId: string; name: string; hours: number }[] = [];
    let checked = 0;

    await Promise.all(
      brokersSnap.docs.map(async (bDoc) => {
        const clientsSnap = await bDoc.ref.collection("clients").get();

        for (const cDoc of clientsSnap.docs) {
          const c = cDoc.data();
          if (!c.createdAt) continue;
          checked++;

          const { reviewStatus } = deriveCaseStatus(c);
          if (reviewStatus !== "pending_docs" && reviewStatus !== "in_review") continue;

          const elapsed = businessHoursElapsed(c.createdAt, now);
          const reached = highestThresholdReached(elapsed);
          const alreadyAlertedAt = Number(c.lastPendingAlertHours) || 0;

          if (reached > 0 && reached > alreadyAlertedAt) {
            await Promise.all(
              ALERT_RECIPIENT_UIDS.map((r) =>
                createNotification(r.uid, {
                  title: `Caso sin avanzar — ${reached}h hábiles`,
                  message: `${c.name || "Cliente"} (${c.serviceName || c.serviceId || "Servicio"}) sigue "${reviewStatus === "pending_docs" ? "Pendiente de Documentos" : "En Revisión"}" tras ${reached} horas hábiles.`,
                  link: "admin"
                })
              )
            );
            await cDoc.ref.update({ lastPendingAlertHours: reached });
            alerted.push({ brokerId: bDoc.id, clientId: cDoc.id, name: c.name || "Cliente", hours: reached });
          }
        }
      })
    );

    return NextResponse.json({ checked, alerted: alerted.length, details: alerted });
  } catch (error) {
    console.error("Error en cron de alertas de casos pendientes:", error);
    return NextResponse.json({ error: "Error al procesar alertas" }, { status: 500 });
  }
}
