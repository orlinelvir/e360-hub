import { adminDb } from "@/lib/firebase-admin";
import { getEffectiveServicesCatalog } from "@/lib/services/service-catalog-service";
import { sendMissingApplicationEmail } from "@/lib/email/send";
import { deriveCaseStatus } from "@/lib/services/case-status";

/**
 * Le avisa al CLIENTE (no al broker) que su caso sigue "Pendiente de
 * Documentos" y le comparte el enlace real del formulario oficial de su
 * servicio, para que sepa exactamente qué paso falta — antes no existía
 * ninguna forma de que el cliente supiera que el "Referir Cliente" de su
 * broker no era suficiente para que su solicitud avanzara.
 */
export async function notifyClientOfMissingApplication(
  brokerId: string,
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) return { success: false, error: "Servidor no configurado" };

  const clientRef = adminDb.collection("brokers").doc(brokerId).collection("clients").doc(clientId);
  const clientSnap = await clientRef.get();
  if (!clientSnap.exists) return { success: false, error: "Caso no encontrado" };

  const client = clientSnap.data()!;
  const { reviewStatus } = deriveCaseStatus(client);
  if (reviewStatus !== "pending_docs") {
    return { success: false, error: "Este caso ya tiene una revisión registrada, no está pendiente de documentos." };
  }
  if (!client.email) {
    return { success: false, error: "El cliente no tiene un correo registrado." };
  }

  const brokerSnap = await adminDb.collection("brokers").doc(brokerId).get();
  const brokerName = brokerSnap.data()?.displayName || brokerSnap.data()?.name || "Tu broker";

  const catalog = await getEffectiveServicesCatalog();
  const service = catalog.find((s) => s.id === client.serviceId);
  const formLink = service?.formLink && service.formLink.startsWith("http") ? service.formLink : undefined;

  await sendMissingApplicationEmail({
    clientEmail: client.email,
    clientName: client.name || "Cliente",
    brokerName,
    serviceName: client.serviceName || client.serviceId || "tu solicitud",
    formLink
  });

  await clientRef.update({ pendingReminderSentAt: new Date().toISOString() });

  return { success: true };
}
