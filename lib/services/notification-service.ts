import { adminDb } from "@/lib/firebase-admin";
import { getRoleIdsForCluster } from "@/lib/roles";

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
