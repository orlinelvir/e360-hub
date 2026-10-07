import { adminDb } from "@/lib/firebase-admin";
import { getEffectiveServicesCatalog } from "@/lib/services/service-catalog-service";
import { sendMissingApplicationEmail } from "@/lib/email/send";
import { deriveCaseStatus } from "@/lib/services/case-status";

/**
 * Le avisa al BROKER (nunca directo al cliente — así lo pidió JP: el cliente
 * firmó contrato con el broker, no con E360) que el caso de su cliente sigue
 * "Pendiente de Documentos", con el enlace real del formulario oficial para
 * que el propio broker se lo reenvíe. Antes este correo llegaba directo al
 * cliente final, lo que generaba confusión de marca y exposición legal.
 */
export async function notifyBrokerOfMissingApplication(
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

  const brokerSnap = await adminDb.collection("brokers").doc(brokerId).get();
  const brokerName = brokerSnap.data()?.displayName || brokerSnap.data()?.name || "Broker";
  const brokerEmail = brokerSnap.data()?.email || "";
  if (!brokerEmail) {
    return { success: false, error: "El broker no tiene un correo registrado." };
  }

  const catalog = await getEffectiveServicesCatalog();
  const service = catalog.find((s) => s.id === client.serviceId);
  const formLink = service?.formLink && service.formLink.startsWith("http") ? service.formLink : undefined;

  await sendMissingApplicationEmail({
    brokerEmail,
    brokerName,
    clientName: client.name || "Cliente",
    serviceName: client.serviceName || client.serviceId || "tu solicitud",
    formLink
  });

  await clientRef.update({ pendingReminderSentAt: new Date().toISOString() });

  return { success: true };
}
