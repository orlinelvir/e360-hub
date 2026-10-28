import { NextResponse, after } from "next/server";
import { verifyAuthToken, adminDb, adminAuth } from "@/lib/firebase-admin";
import { resolveUserRole, hasPermission, getRoleDefinition } from "@/lib/roles";
import { resolvePipelineCluster } from "@/lib/service-routing";
import { sendCaseStatusEmail, sendWelcomeApplicationEmail } from "@/lib/email/send";
import { CaseEmailStatus } from "@/lib/email/templates/CaseStatusEmail";
import { createNotification } from "@/lib/services/notification-service";
import { deriveCaseStatus, justGotVerified, VALID_REVIEW_STATUSES, ReviewStatus } from "@/lib/services/case-status";

const STATUS_LABELS: Record<CaseEmailStatus, string> = {
  approved: "aprobada",
  rejected: "declinada",
  funded: "fondeada"
};

const NOTIFIABLE_STATUSES: CaseEmailStatus[] = ["approved", "rejected", "funded"];

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
      reviewStatus: string;
      syncStatus: string;
      createdAt: string;
      lastActivity?: string;
      notes?: string;
      adminNotes?: string;
      ghlContactId?: string;
      ghlOpportunityId?: string;
      feeRoundNumber?: number;
      feeRoundStatus?: string;
    }> = [];

    await Promise.all(
      brokersSnap.docs.map(async (bDoc) => {
        const bData = bDoc.data();
        let brokerName = bData.displayName || bData.name;
        let brokerEmail = bData.email || "";
        // Si el doc de Firestore quedó incompleto (ej. auto-provisioning viejo
        // que no guardó displayName/email), cae al perfil real de Firebase
        // Auth antes de mostrar el UID crudo como "nombre" del broker.
        if ((!brokerName || !brokerEmail) && adminAuth) {
          try {
            const authUser = await adminAuth.getUser(bDoc.id);
            if (!brokerName) brokerName = authUser.displayName || authUser.email || undefined;
            if (!brokerEmail) brokerEmail = authUser.email || "";
          } catch {
            // El usuario tampoco existe en Auth — no queda más que el UID.
          }
        }
        brokerName = brokerName || bDoc.id;
        const brokerTier = bData.tier || "Junior Broker";

        const clientsSnap = await bDoc.ref.collection("clients").get();

        clientsSnap.docs.forEach((cDoc) => {
          const c = cDoc.data();

          // Contactos crudos sincronizados desde la subcuenta GHL del broker
          // (pestaña "Mis Clientes (CRM)") — nunca fueron una solicitud de
          // servicio real, solo viven en la misma subcolección por
          // conveniencia. "source" es la marca nueva; el texto fijo cubre los
          // que ya existían en Firestore antes de que existiera ese campo.
          if (c.source === "ghl_sync" || c.serviceName === "Cliente StartPoint CRM") {
            return;
          }

          const amt = Number(c.amount) || 0;
          // Antes "0 || fallback" trataba un estimatedCommission real de 0
          // (ej. todo caso de Reparación de Crédito, que no maneja comisión)
          // como si no existiera, e inventaba $250 — Fernando fue explícito:
          // nada de costos/comisión inventados en el Hub. El fallback de
          // adivinar por % solo aplica cuando el campo de verdad no existe.
          const comm = c.estimatedCommission !== undefined && c.estimatedCommission !== null
            ? Number(c.estimatedCommission)
            : (amt > 0 ? Math.round(amt * 0.05) : 0);
          const cluster = resolvePipelineCluster(c.serviceId, c.serviceName);

          // Filtrar por permisos de vertical si corresponde
          if (allowedClusters && !allowedClusters.includes(cluster)) {
            return;
          }

          const { reviewStatus, syncStatus } = deriveCaseStatus(c);

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
            reviewStatus,
            syncStatus,
            createdAt: c.createdAt || "",
            lastActivity: c.lastActivity,
            notes: c.notes,
            adminNotes: c.adminNotes,
            ghlContactId: c.ghlContactId,
            ghlOpportunityId: c.ghlOpportunityId,
            feeRoundNumber: c.feeRoundNumber,
            feeRoundStatus: c.feeRoundStatus,
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
    const { brokerId, clientId, reviewStatus, adminNotes, estimatedCommission, statusReason } = body;

    if (!brokerId || !clientId) {
      return NextResponse.json({ error: "brokerId y clientId son requeridos" }, { status: 400 });
    }

    const actingStaffSnap = await adminDb.collection("brokers").doc(user.uid).get();
    const actingStaffName = actingStaffSnap.data()?.displayName || actingStaffSnap.data()?.name || user.email || "Staff";

    if (reviewStatus !== undefined && !VALID_REVIEW_STATUSES.includes(reviewStatus)) {
      return NextResponse.json({ error: "reviewStatus inválido" }, { status: 400 });
    }

    const clientRef = adminDb.collection("brokers").doc(brokerId).collection("clients").doc(clientId);
    const clientSnap = await clientRef.get();

    if (!clientSnap.exists) {
      return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
    }

    const client = clientSnap.data()!;
    const clientCluster = resolvePipelineCluster(client.serviceId, client.serviceName);

    // Un especialista solo puede editar casos de su propio cluster (admin no tiene restricción).
    if (role !== "admin") {
      const allowedClusters = getRoleDefinition(role)?.allowedClusters ?? [];
      if (!allowedClusters.includes(clientCluster)) {
        return NextResponse.json(
          { error: "Acceso restringido. Este caso no pertenece a tu vertical asignada." },
          { status: 403 }
        );
      }
    }

    const { reviewStatus: previousReviewStatus } = deriveCaseStatus(client);

    const updatePayload: Record<string, unknown> = {
      lastActivity: `Actualizado por Admin: ${new Date().toLocaleDateString()}`,
      // Quién tocó el caso por última vez — antes nada registraba esto, lo
      // que hacía imposible medir actividad real de staff por persona.
      updatedByUid: user.uid,
      updatedByName: actingStaffName,
      // Timestamp ISO real (lastActivity de arriba es solo texto legible, no
      // sirve para filtrar por fecha) — lo necesita el panel de Actividad del Staff.
      updatedAt: new Date().toISOString()
    };

    if (reviewStatus !== undefined) updatePayload.status = reviewStatus;
    if (adminNotes !== undefined) updatePayload.adminNotes = adminNotes;
    // Reparación de Crédito no maneja comisión en el Hub — es algo que el
    // broker decide directamente, no algo que el staff fije desde acá. Se
    // ignora server-side (no solo se oculta en la UI) para que ningún
    // cliente de la API pueda colarla igual.
    if (estimatedCommission !== undefined && clientCluster !== "credit_repair") {
      updatePayload.estimatedCommission = Number(estimatedCommission);
    }

    await clientRef.update(updatePayload);

    const brokerSnap = await adminDb.collection("brokers").doc(brokerId).get();
    const brokerData = brokerSnap.data();
    const brokerEmail = brokerData?.email || "";
    const brokerName = brokerData?.displayName || brokerData?.name || "Broker";

    // El broker se entera de que "recibimos la aplicación" justo cuando el
    // caso sale de "Pendiente de Documentos" por primera vez — ej. un caso
    // creado sin gate (Referir Cliente) que un admin confirma manualmente
    // tras revisar la documentación por fuera del sistema. Nunca le llega
    // directo al cliente — JP fue explícito: el cliente firmó contrato con
    // el broker, no con E360, así que toda comunicación pasa por el broker.
    if (reviewStatus !== undefined && justGotVerified(previousReviewStatus, reviewStatus as ReviewStatus) && brokerEmail) {
      after(() =>
        sendWelcomeApplicationEmail({
          brokerEmail,
          brokerName,
          clientName: client.name || "Cliente",
          serviceName: client.serviceName || client.serviceId || "tu solicitud"
        })
      );
    }

    // Notificar al broker por correo solo si el status realmente cambió a uno de
    // los 3 estados relevantes (evita reenviar en cada guardado de comisión/notas).
    if (reviewStatus !== undefined && reviewStatus !== previousReviewStatus && NOTIFIABLE_STATUSES.includes(reviewStatus)) {
      after(() =>
        sendCaseStatusEmail({
          brokerEmail,
          brokerName,
          clientName: client.name || "Cliente",
          serviceName: client.serviceName || client.serviceId || "Servicio",
          status: reviewStatus,
          amount: Number(client.amount) || undefined,
          reason: statusReason ? String(statusReason).trim() : undefined,
        })
      );

      after(() =>
        createNotification(brokerId, {
          title: `Solicitud ${STATUS_LABELS[reviewStatus as CaseEmailStatus]}`,
          message: `${client.name || "Cliente"} — ${client.serviceName || client.serviceId || "Servicio"}`,
          link: "clientes"
        })
      );
    }

    return NextResponse.json({ success: true, updated: updatePayload });
  } catch (error) {
    console.error("Admin cases PATCH error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
