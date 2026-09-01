import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { servicesData, PipelineCluster } from "@/app/hub/broker-onboarding/data/services";

function resolvePipelineCluster(serviceId: string | undefined, serviceName: string | undefined): PipelineCluster {
  const catalogService = serviceId ? servicesData.find((s) => s.id === serviceId) : undefined;
  if (catalogService) return catalogService.pipelineCluster;

  const name = (serviceName || "").toLowerCase();
  if (name.includes("real estate") || name.includes("hipotec") || name.includes("mortgage") || name.includes("dscr")) return "real_estate";
  if (name.includes("reparaci") || name.includes("repair")) return "credit_repair";
  if (name.includes("seguro") || name.includes("insurance")) return "seguros";
  if (name.includes("incorporat") || name.includes("llc") || name.includes("tax") || name.includes("impuesto") || name.includes("inmigra") || name.includes("payroll") || name.includes("pos")) return "corporativo";
  return "fondeo_rapido";
}

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const adminSnap = await adminDb.collection("brokers").doc(user.uid).get();
    const userRole = adminSnap.exists ? (adminSnap.data()?.role || "broker") : "broker";

    const allowedRoles = ["admin", "underwriter_mca", "specialist_real_estate", "specialist_insurance", "specialist_corporate", "support_agent"];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: "Acceso restringido. Se requiere rol de empleado o administrador." },
        { status: 403 }
      );
    }

    // Determinar qué clusters puede ver el usuario
    let allowedClusters: string[] | null = null; // null significa todos
    if (userRole === "underwriter_mca") allowedClusters = ["fondeo_rapido"];
    else if (userRole === "specialist_real_estate") allowedClusters = ["real_estate"];
    else if (userRole === "specialist_insurance") allowedClusters = ["seguros"];
    else if (userRole === "specialist_corporate") allowedClusters = ["corporativo"];

    const brokersSnap = await adminDb.collection("brokers").get();
    const allCases: Array<{
      id: string;
      brokerId: string;
      brokerName: string;
      brokerEmail: string;
      brokerTier: string;
      name: string;
      email: string;
      phone: string;
      serviceName: string;
      serviceId?: string;
      pipelineCluster: string;
      amount: number;
      estimatedCommission: number;
      status: string;
      createdAt: string;
      lastActivity?: string;
      notes?: string;
      adminNotes?: string;
      ghlContactId?: string;
      ghlOpportunityId?: string;
    }> = [];

    await Promise.all(
      brokersSnap.docs.map(async (bDoc) => {
        const bData = bDoc.data();
        const brokerName = bData.displayName || bData.name || bDoc.id;
        const brokerEmail = bData.email || "";
        const brokerTier = bData.tier || "Junior Broker";

        const clientsSnap = await bDoc.ref.collection("clients").get();

        clientsSnap.docs.forEach((cDoc) => {
          const c = cDoc.data();
          const amt = Number(c.amount) || 0;
          const comm = Number(c.estimatedCommission) || (amt > 0 ? Math.round(amt * 0.05) : 250);
          const cluster = resolvePipelineCluster(c.serviceId, c.serviceName);

          // Filtrar por permisos de vertical si corresponde
          if (allowedClusters && !allowedClusters.includes(cluster)) {
            return;
          }

          allCases.push({
            id: cDoc.id,
            brokerId: bDoc.id,
            brokerName,
            brokerEmail,
            brokerTier,
            name: c.name || "Sin nombre",
            email: c.email || "",
            phone: c.phone || "",
            serviceName: c.serviceName || c.serviceId || "Servicio",
            serviceId: c.serviceId,
            pipelineCluster: cluster,
            amount: amt,
            estimatedCommission: comm,
            status: c.status || "synced",
            createdAt: c.createdAt || "",
            lastActivity: c.lastActivity,
            notes: c.notes,
            adminNotes: c.adminNotes,
            ghlContactId: c.ghlContactId,
            ghlOpportunityId: c.ghlOpportunityId,
          });
        });
      })
    );

    // Ordenar de más reciente a más antiguo
    allCases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ cases: allCases, total: allCases.length });
  } catch (error) {
    console.error("Admin cases GET error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const adminSnap = await adminDb.collection("brokers").doc(user.uid).get();
    const role = adminSnap.exists ? adminSnap.data()?.role : undefined;

    if (role !== "admin") {
      return NextResponse.json(
        { error: "Acceso restringido. Se requiere rol de administrador." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { brokerId, clientId, status, adminNotes, estimatedCommission } = body;

    if (!brokerId || !clientId) {
      return NextResponse.json({ error: "brokerId y clientId son requeridos" }, { status: 400 });
    }

    const clientRef = adminDb.collection("brokers").doc(brokerId).collection("clients").doc(clientId);
    const clientSnap = await clientRef.get();

    if (!clientSnap.exists) {
      return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
    }

    const updatePayload: Record<string, unknown> = {
      lastActivity: `Actualizado por Admin: ${new Date().toLocaleDateString()}`
    };

    if (status !== undefined) updatePayload.status = status;
    if (adminNotes !== undefined) updatePayload.adminNotes = adminNotes;
    if (estimatedCommission !== undefined) updatePayload.estimatedCommission = Number(estimatedCommission);

    await clientRef.update(updatePayload);

    return NextResponse.json({ success: true, updated: updatePayload });
  } catch (error) {
    console.error("Admin cases PATCH error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
