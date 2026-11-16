import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";

/**
 * Lista los clientes/casos del broker autenticado (brokers/{uid}/clients).
 * Equivale a getBrokerClients() de lib/services/broker-service.ts, pero vía
 * Admin SDK para que la app móvil no tenga que leer Firestore directo con el
 * SDK de cliente.
 *
 * Solo devuelve los campos que el broker puede ver — a propósito NO incluye
 * adminNotes (notas internas de staff), igual que /api/broker/clients/notes
 * solo expone la categoría "broker".
 */

const CLIENT_FIELDS = [
  "name",
  "email",
  "phone",
  "serviceId",
  "serviceName",
  "amount",
  "estimatedCommission",
  "stage",
  "createdAt",
  "lastActivity",
  "status",
  "syncStatus",
  "notes",
  "source"
] as const;

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const snap = await adminDb.collection("brokers").doc(user.uid).collection("clients").get();

    const clients = snap.docs
      .filter((d) => {
        const c = d.data();
        // Contactos crudos sincronizados desde la subcuenta GHL del broker
        // (pestaña "Mis Clientes (CRM)") — no son solicitudes reales. Mismo
        // criterio que /api/admin/cases: "source" es la marca nueva; el
        // texto fijo cubre los docs viejos anteriores a ese campo.
        return c.source !== "ghl_sync" && c.serviceName !== "Cliente StartPoint CRM";
      })
      .map((d) => {
        const data = d.data();
        const client: Record<string, unknown> = { id: d.id };
        for (const field of CLIENT_FIELDS) {
          if (data[field] !== undefined) client[field] = data[field];
        }
        return client;
      });

    // Se ordena en memoria (más reciente primero) en vez de orderBy en la
    // consulta: Firestore descarta del resultado los docs sin el campo
    // createdAt, y un caso sin fecha no debe desaparecer de la lista.
    clients.sort(
      (a, b) =>
        (new Date(String(b.createdAt ?? "")).getTime() || 0) - (new Date(String(a.createdAt ?? "")).getTime() || 0)
    );

    return NextResponse.json({ clients });
  } catch (error) {
    console.error("Broker clients GET error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
