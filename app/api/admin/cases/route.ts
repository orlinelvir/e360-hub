import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole, hasPermission, getRoleDefinition } from "@/lib/roles";
import { resolvePipelineCluster } from "@/lib/service-routing";

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const userRole = await resolveUserRole(adminDb, user.uid, user.email);

    // Ver casos: cualquier rol con el permiso "view_cases" (o "all", que solo admin tiene) —
    // antes esto era una lista de role-IDs a mano que se desalineaba de ROLE_DEFINITIONS
    // (ej. sales_agent tiene view_cases pero no estaba en la lista).
    if (!hasPermission(userRole, "view_cases")) {
      return NextResponse.json(
        { error: "Acceso restringido. Se requiere rol de empleado o administrador." },
        { status: 403 }
      );
    }

    // Determinar qué clusters puede ver el usuario según su rol (admin ve todos, sin filtrar).
    const allowedClusters: string[] | null = userRole === "admin" ? null : (getRoleDefinition(userRole)?.allowedClusters ?? []);

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
    const role = await resolveUserRole(adminDb, user.uid, user.email);

    // Editar casos: cualquier rol con permiso "edit_cases" (o "all") — antes exigía
    // admin estricto aunque los especialistas (underwriter_mca, specialist_*) tienen
    // este permiso definido en su rol y no podían usarlo.
    if (!hasPermission(role, "edit_cases")) {
      return NextResponse.json(
        { error: "Acceso restringido. Se requiere permiso para editar casos." },
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

    // Un especialista solo puede editar casos de su propio cluster (admin no tiene restricción).
    if (role !== "admin") {
      const client = clientSnap.data()!;
      const cluster = resolvePipelineCluster(client.serviceId, client.serviceName);
      const allowedClusters = getRoleDefinition(role)?.allowedClusters ?? [];
      if (!allowedClusters.includes(cluster)) {
        return NextResponse.json(
          { error: "Acceso restringido. Este caso no pertenece a tu vertical asignada." },
          { status: 403 }
        );
      }
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
