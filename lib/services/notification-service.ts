import { adminDb } from "@/lib/firebase-admin";
import { getRoleIdsForCluster } from "@/lib/roles";
import { sendNewCreditRepairApplicationEmail, sendNewCaseEmailToSupport } from "@/lib/email/send";
import { resolvePipelineCluster } from "@/lib/service-routing";

// "link" es el id de tab del Hub (ej. "clientes", "admin"), no una URL — el Hub
// es de una sola página con navegación por tabs, así que basta con saber a qué
// sección llevar al usuario al hacer clic en la notificación.
export interface HubNotification {
  id: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

function notificationsRef(uid: string) {
  if (!adminDb) throw new Error("Servidor no configurado");
  return adminDb.collection("brokers").doc(uid).collection("notifications");
}

export async function createNotification(
  uid: string,
  notification: { title: string; message: string; link?: string }
): Promise<void> {
  await notificationsRef(uid).add({
    ...notification,
    read: false,
    createdAt: new Date().toISOString()
  });
}

export async function notifyMany(
  uids: string[],
  notification: { title: string; message: string; link?: string }
): Promise<void> {
  await Promise.all(
    uids.map((uid) =>
      createNotification(uid, notification).catch((err) =>
        console.error(`No se pudo crear notificación para ${uid}:`, err)
      )
    )
  );
}

export async function getNotifications(uid: string, limit = 30): Promise<HubNotification[]> {
  const snap = await notificationsRef(uid).orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as HubNotification));
}

export async function getUnreadCount(uid: string): Promise<number> {
  const snap = await notificationsRef(uid).where("read", "==", false).get();
  return snap.size;
}

export async function markNotificationsRead(uid: string, ids: string[]): Promise<void> {
  if (!adminDb) throw new Error("Servidor no configurado");
  const batch = adminDb.batch();
  ids.forEach((id) => batch.update(notificationsRef(uid).doc(id), { read: true }));
  await batch.commit();
}

export async function markAllNotificationsRead(uid: string): Promise<void> {
  if (!adminDb) throw new Error("Servidor no configurado");
  const snap = await notificationsRef(uid).where("read", "==", false).get();
  if (snap.empty) return;
  const batch = adminDb.batch();
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
}

/**
 * UIDs de todos los brokers/staff cuyo campo `role` está en la lista dada.
 */
export async function findStaffUidsByRoles(roleIds: string[]): Promise<string[]> {
  if (!adminDb || roleIds.length === 0) return [];
  const snap = await adminDb.collection("brokers").where("role", "in", roleIds).get();
  return snap.docs.map((d) => d.id);
}

/**
 * UIDs de staff (todos los roles con acceso al cluster, excepto "broker") — usado
 * para notificar al equipo correcto cuando entra una solicitud nueva de esa vertical.
 */
export async function findStaffUidsForCluster(cluster: string): Promise<string[]> {
  return findStaffUidsByRoles(getRoleIdsForCluster(cluster));
}

/**
 * Checkbox "Notificar casos nuevos por correo" en Equipo & Roles
 * (settings/notifications.newCaseEmailEnabled) — apagado por defecto hasta
 * que un admin lo prenda desde el Hub.
 */
async function isNewCaseEmailEnabled(): Promise<boolean> {
  if (!adminDb) return false;
  try {
    const snap = await adminDb.collection("settings").doc("notifications").get();
    return snap.exists && snap.data()?.newCaseEmailEnabled === true;
  } catch (err) {
    console.error("No se pudo leer settings/notifications:", err);
    return false;
  }
}

/**
 * Punto único de "entró un caso nuevo, avisa a quien corresponda" — antes
 * cada ruta de creación de caso (services/submit, credit-repair-intake)
 * tenía su propio bloque inline de notifyMany, y "Referir Cliente" no tenía
 * ninguno; cualquiera podía quedar desalineado del resto sin que nadie lo
 * notara. Centralizarlo aquí es lo que hace que agregar un canal nuevo (ej.
 * el correo de Reparación de Crédito) solo requiera tocar un lugar.
 */
export async function notifyStaffOfNewCase(opts: {
  cluster: string;
  clientName: string;
  serviceName: string;
  brokerName: string;
}): Promise<void> {
  const staffUids = await findStaffUidsForCluster(opts.cluster);
  await notifyMany(staffUids, {
    title: "Nueva solicitud recibida",
    message: `${opts.clientName} — ${opts.serviceName} (${opts.brokerName})`,
    link: "admin"
  });

  // Reparación de Crédito: Fernando pidió explícitamente enterarse también
  // por su correo personal (no hay todavía un rol dedicado de "operador de
  // Reparación de Crédito" en el Hub — el restructuring con su hermano/JP
  // sigue en planeación, así que por ahora el punto de contacto real es él).
  if (opts.cluster === "credit_repair") {
    await sendNewCreditRepairApplicationEmail({
      brokerName: opts.brokerName,
      clientName: opts.clientName
    });
  }

  // Checkbox de Equipo & Roles: además de lo anterior, cualquier caso nuevo
  // (de cualquier vertical) también manda aviso a la bandeja compartida de
  // soporte cuando el toggle está activo.
  if (await isNewCaseEmailEnabled()) {
    await sendNewCaseEmailToSupport({
      brokerName: opts.brokerName,
      clientName: opts.clientName,
      serviceName: opts.serviceName
    });
  }
}

/**
 * "Referir Cliente" (MisClientesSection) escribe el caso directo por el SDK
 * de cliente y no pasa por ninguna ruta de servidor, así que —a diferencia
 * de services/submit y credit-repair-intake— nunca disparaba una
 * notificación de staff. Esta función es el hook que la ruta
 * /api/broker/clients/notify-new-case llama justo después de guardar el
 * caso, leyendo el documento ya escrito para no duplicar datos en el payload.
 */
export async function notifyStaffOfNewReferredCase(
  brokerId: string,
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) return { success: false, error: "Servidor no configurado" };

  const clientRef = adminDb.collection("brokers").doc(brokerId).collection("clients").doc(clientId);
  const clientSnap = await clientRef.get();
  if (!clientSnap.exists) return { success: false, error: "Caso no encontrado" };

  const client = clientSnap.data()!;
  const cluster = resolvePipelineCluster(client.serviceId, client.serviceName);

  await notifyStaffOfNewCase({
    cluster,
    clientName: client.name || "Cliente",
    serviceName: client.serviceName || client.serviceId || "Servicio",
    brokerName: client.brokerName || "Broker"
  });

  return { success: true };
}
