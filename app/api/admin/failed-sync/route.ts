import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole, hasPermission } from "@/lib/roles";

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

    // Ver la cola de sync: admin ("all") o cualquier rol con permiso "retry_sync"
    // (support_agent) — antes exigía admin estricto aunque la UI ya le mostraba
    // esta pestaña a support_agent, causando 403 reales.
    if (!hasPermission(role, "retry_sync")) {
      return NextResponse.json(
        { error: "Acceso restringido. Se requiere rol de administrador o soporte." },
        { status: 403 }
      );
    }

    const brokersSnap = await adminDb.collection("brokers").get();
    const failedLeads: Array<{
      id: string;
      brokerId: string;
      brokerName: string;
      name: string;
      email: string;
      phone: string;
      serviceName: string;
      serviceId?: string;
      amount: number;
      status: string;
      createdAt: string;
      notes: string;
      ghlContactId?: string;
      ghlOpportunityId?: string;
    }> = [];

    await Promise.all(
      brokersSnap.docs.map(async (bDoc) => {
        const brokerData = bDoc.data();
        const brokerName = brokerData.displayName || brokerData.name || bDoc.id;
        const clientsSnap = await bDoc.ref.collection("clients").get();

        clientsSnap.docs.forEach((cDoc) => {
          const c = cDoc.data();
          if (c.status === "failed_sync" || c.status === "pending_sync") {
            failedLeads.push({
              id: cDoc.id,
              brokerId: bDoc.id,
              brokerName,
              name: c.name || "Sin nombre",
              email: c.email || "",
              phone: c.phone || "",
              serviceName: c.serviceName || c.serviceId || "Servicio",
              serviceId: c.serviceId,
              amount: Number(c.amount) || 0,
              status: c.status,
              createdAt: c.createdAt || "",
              notes: c.notes || "",
              ghlContactId: c.ghlContactId,
              ghlOpportunityId: c.ghlOpportunityId,
            });
          }
        });
      })
    );

    // Ordenar por fecha descendente
    failedLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ leads: failedLeads, total: failedLeads.length });
  } catch (error) {
    console.error("Admin failed-sync error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
