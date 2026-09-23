import { NextResponse, after } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole, hasPermission, getRoleDefinition } from "@/lib/roles";
import { resolvePipelineCluster } from "@/lib/service-routing";
import { getCaseNotes, addCaseNote } from "@/lib/services/case-service";
import { CaseNoteCategory } from "@/app/hub/broker-onboarding/types";
import { sendBrokerNoteEmail, sendClientCaseUpdateEmail } from "@/lib/email/send";
import { createNotification } from "@/lib/services/notification-service";

const VALID_CATEGORIES: CaseNoteCategory[] = ["observation", "case", "broker"];

async function checkCaseAccess(role: string, brokerId: string, clientId: string) {
  if (!adminDb) throw new Error("Servidor no configurado");
  const clientSnap = await adminDb.collection("brokers").doc(brokerId).collection("clients").doc(clientId).get();
  if (!clientSnap.exists) return { ok: false as const, status: 404, error: "Caso no encontrado" };

  const client = clientSnap.data()!;
  if (role !== "admin") {
    const cluster = resolvePipelineCluster(client.serviceId, client.serviceName);
    const allowedClusters = getRoleDefinition(role)?.allowedClusters ?? [];
    if (!allowedClusters.includes(cluster)) {
      return { ok: false as const, status: 403, error: "Acceso restringido. Este caso no pertenece a tu vertical asignada." };
    }
  }
  return { ok: true as const, client };
}

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const brokerId = searchParams.get("brokerId");
  const clientId = searchParams.get("clientId");
  if (!brokerId || !clientId) {
    return NextResponse.json({ error: "brokerId y clientId son requeridos" }, { status: 400 });
  }

  try {
    const role = await resolveUserRole(adminDb, user.uid, user.email);
    if (!hasPermission(role, "view_cases")) {
      return NextResponse.json({ error: "Acceso restringido. Se requiere rol de empleado o administrador." }, { status: 403 });
    }

    const access = await checkCaseAccess(role, brokerId, clientId);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const notes = await getCaseNotes(brokerId, clientId);
    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Admin case notes GET error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const role = await resolveUserRole(adminDb, user.uid, user.email);
    if (!hasPermission(role, "edit_cases")) {
      return NextResponse.json({ error: "Acceso restringido. Se requiere permiso para editar casos." }, { status: 403 });
    }

    const body = await request.json();
    const { brokerId, clientId, category, content, notifyClient } = body;

    if (!brokerId || !clientId || !content) {
      return NextResponse.json({ error: "brokerId, clientId y content son requeridos" }, { status: 400 });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "category debe ser observation, case o broker" }, { status: 400 });
    }

    const access = await checkCaseAccess(role, brokerId, clientId);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const authorSnap = await adminDb.collection("brokers").doc(user.uid).get();
    const authorName = authorSnap.data()?.displayName || authorSnap.data()?.name || user.email || "Equipo E360";

    const trimmedContent = String(content).trim();
    const noteId = await addCaseNote(brokerId, clientId, {
      category,
      content: trimmedContent,
      authorName,
      authorId: user.uid
    });

    let emailResult: { sent: boolean; error?: string } | undefined;

    if (category === "broker") {
      const brokerSnap = await adminDb.collection("brokers").doc(brokerId).get();
      const brokerData = brokerSnap.data();
      const brokerEmail = brokerData?.email || "";
      const brokerName = brokerData?.displayName || brokerData?.name || "Broker";

      // Se espera el resultado real (no fire-and-forget) para poder avisarle
      // al staff en pantalla si el correo de verdad salió o no.
      emailResult = await sendBrokerNoteEmail({
        brokerEmail,
        brokerName,
        clientName: access.client.name || "Cliente",
        serviceName: access.client.serviceName || access.client.serviceId || "Servicio",
        authorName,
        noteContent: trimmedContent,
      });

      after(() =>
        createNotification(brokerId, {
          title: "Nueva nota sobre tu solicitud",
          message: `${access.client.name || "Cliente"}: ${trimmedContent}`,
          link: "clientes"
        })
      );
    }

    let clientEmailResult: { sent: boolean; error?: string } | undefined;

    // Que el broker se entere no siempre es suficiente para que el caso
    // avance — a veces quien tiene que actuar (llenar algo, responder una
    // pregunta) es el cliente directamente. Es opcional y solo aplica junto
    // a una nota "broker", nunca en las categorías internas.
    if (category === "broker" && notifyClient === true) {
      clientEmailResult = await sendClientCaseUpdateEmail({
        clientEmail: access.client.email || "",
        clientName: access.client.name || "Cliente",
        serviceName: access.client.serviceName || access.client.serviceId || "Servicio",
        noteContent: trimmedContent,
      });
    }

    return NextResponse.json({ success: true, noteId, emailResult, clientEmailResult });
  } catch (error) {
    console.error("Admin case notes POST error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
