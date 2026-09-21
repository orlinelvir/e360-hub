import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole, hasPermission, getRoleDefinition } from "@/lib/roles";
import { resolvePipelineCluster } from "@/lib/service-routing";
import { notifyClientOfMissingApplication } from "@/lib/services/pending-notification-service";

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
    const { brokerId, clientId } = body;
    if (!brokerId || !clientId) {
      return NextResponse.json({ error: "brokerId y clientId son requeridos" }, { status: 400 });
    }

    if (role !== "admin") {
      const clientSnap = await adminDb.collection("brokers").doc(brokerId).collection("clients").doc(clientId).get();
      if (!clientSnap.exists) {
        return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
      }
      const client = clientSnap.data()!;
      const cluster = resolvePipelineCluster(client.serviceId, client.serviceName);
      const allowedClusters = getRoleDefinition(role)?.allowedClusters ?? [];
      if (!allowedClusters.includes(cluster)) {
        return NextResponse.json({ error: "Acceso restringido. Este caso no pertenece a tu vertical asignada." }, { status: 403 });
      }
    }

    const result = await notifyClientOfMissingApplication(brokerId, clientId);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "No se pudo enviar la notificación" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin notify-pending POST error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
