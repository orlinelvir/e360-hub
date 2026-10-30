import { NextResponse, after } from "next/server";
import { timingSafeEqual } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { createGHLLocationFromSnapshot } from "@/lib/ghl";
import { findStaffUidsByRoles, notifyMany, createNotification } from "@/lib/services/notification-service";
import { mapReviewStatusToPipelineStage, mapGHLStageToHubStatus } from "@/lib/services/case-status";
import { sendCaseStatusEmail, sendBrokerWelcomeEmail } from "@/lib/email/send";
import { CaseEmailStatus } from "@/lib/email/templates/CaseStatusEmail";
import { completeBrokerRegistration } from "@/lib/services/broker-registration";
import { syncBrokerToCentralGHL } from "@/lib/services/broker-ghl-sync";
import { REFERRAL_COMMISSION } from "@/lib/constants/broker";

// Mismos estados que notifica el cambio manual desde el panel admin
// (app/api/admin/cases/route.ts) — el broker debe enterarse igual cuando el
// estado lo mueve GHL automáticamente vía webhook.
const NOTIFIABLE_STATUSES: CaseEmailStatus[] = ["approved", "rejected", "funded"];
const STATUS_LABELS: Record<CaseEmailStatus, string> = {
  approved: "aprobada",
  rejected: "declinada",
  funded: "fondeada"
};

// A quién se le avisa cuando se aprovisiona una subcuenta de broker nueva —
// "onboarding_member" es el rol cuya descripción es exactamente esto
// ("aprovisionamiento de subcuentas GHL y entrega de accesos"). Si Samantha
// necesita verlo, su cuenta del Hub debe tener este rol asignado.
const ONBOARDING_NOTIFICATION_ROLES = ["onboarding_member", "admin"];

// Comparación en tiempo constante — una comparación normal (!==) revela por
// cuántos caracteres coincide el secreto vía el tiempo de respuesta.
function secretsMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Receptor universal de webhooks salientes de GHL (Workflows → acción "Webhook").
 * Autenticación exclusivamente por cabecera x-webhook-secret — nunca por query
 * string, que queda expuesta en logs de acceso e historial del navegador.
 *
 * Eventos soportados:
 * - "opportunity_stage_updated" / "opportunity_status_updated" / "pipeline_update": Sincronización bidireccional en tiempo real del pipeline de GHL hacia E360 Hub.
 * - "payment_received": Marca como pagada la ronda del fee de Reparación de Crédito.
 * - "broker_onboarding_form_submitted": Auto-aprovisiona la subcuenta GHL del broker clonando el Snapshot.
 * - "payment_completed": Marca packagePaid, asigna brokerId y envía el correo de bienvenida real del Hub.
 * - "contract_signed": Marca contractSignedAt al enviarse el formulario del Contrato de Servicios.
 */
export async function POST(request: Request) {
  // Solo por header — un secreto en la URL (?token=) queda expuesto en logs
  // de acceso, historial del navegador y el header Referer.
  const providedSecret = request.headers.get("x-webhook-secret") || "";
  const expectedSecret = process.env.GHL_WEBHOOK_SECRET || "";

  // Falla CERRADO: antes, si GHL_WEBHOOK_SECRET no estaba configurado, la
  // condición completa se saltaba y CUALQUIER POST sin autenticar era
  // aceptado — al revés que los crons (CRON_SECRET), que sí fallan cerrado.
  if (!expectedSecret || !secretsMatch(providedSecret, expectedSecret)) {
    // Antes esto se rechazaba sin dejar ningún rastro (por eso ghlWebhookLogs
    // quedó vacío durante semanas mientras el secreto real del problema era un
    // simple desajuste de secretos entre GHL y Vercel) — ahora sí queda logueado,
    // aunque sea un 401, para que la próxima vez esto se detecte en minutos.
    if (adminDb) {
      await adminDb.collection("ghlWebhookLogs").add({
        eventType: "(rechazado antes de leer el body)",
        receivedAt: new Date().toISOString(),
        success: false,
        reason: "invalid_secret",
        providedSecretPrefix: (providedSecret || "").substring(0, 6),
        // Nunca el secreto completo — solo largos, para diagnosticar typos o
        // valores truncados al copiar/pegar sin exponer nada sensible.
        providedSecretLength: providedSecret.length,
        expectedSecretLength: expectedSecret.length
      });
    }
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const data = body.customData && typeof body.customData === "object" ? body.customData : body;
    const eventType = String(data.eventType || body.type || body.event || "");

    // Log universal de diagnóstico: se escribe SIEMPRE, sin importar si el
    // eventType matchea algo o no, para poder ver qué está mandando GHL
    // realmente en vez de adivinar (ej. si el campo se llama distinto al
    // esperado). Se actualiza con el resultado final antes de cada return.
    const webhookLogRef = await adminDb.collection("ghlWebhookLogs").add({
      eventType: eventType || "(vacío)",
      receivedAt: new Date().toISOString(),
      bodyKeys: Object.keys(body),
      dataKeys: Object.keys(data),
      success: null
    });

    // 1. EVENTO: ACTUALIZACIÓN DE PIPELINE / ETAPA DE OPORTUNIDAD EN GHL
    if (
      eventType === "opportunity_stage_updated" ||
      eventType === "opportunity_status_updated" ||
      eventType === "pipeline_update" ||
      eventType === "OpportunityStageUpdate" ||
      eventType === "OpportunityStatusUpdate" ||
      Boolean(data.pipelineStage || data.stageName || data.pipeline_stage_id || body.stage)
    ) {
      const stageName = String(data.stageName || data.pipelineStage || body.stageName || body.stage || "");
      const ghlStatus = String(data.status || body.status || "open");
      const contactId = String(data.contactId || data.contact_id || body.contactId || body.contact_id || "");
      const opportunityId = String(data.opportunityId || data.opportunity_id || body.id || body.opportunityId || "");
      const contactEmail = String(data.email || data.contactEmail || body.email || "").trim().toLowerCase();
      const monetaryValue = Number(data.monetaryValue || data.monetary_value || body.monetaryValue || 0);

      const brokerId = String(data.E360_Broker_ID || data.brokerId || body.E360_Broker_ID || "");

      const mappedStatus = mapGHLStageToHubStatus(stageName, ghlStatus);

      let matchedClientDoc: FirebaseFirestore.DocumentReference | null = null;
      let matchedBrokerId = brokerId;

      // Estrategia A: Si tenemos brokerId directo
      if (brokerId) {
        const brokerRef = adminDb.collection("brokers").doc(brokerId);
        const clientsSnap = await brokerRef.collection("clients").get();
        for (const doc of clientsSnap.docs) {
          const c = doc.data();
          if (
            (opportunityId && c.ghlOpportunityId === opportunityId) ||
            (contactId && c.ghlContactId === contactId) ||
            (contactEmail && (c.email || "").toLowerCase() === contactEmail)
          ) {
            matchedClientDoc = doc.ref;
            break;
          }
        }
      }

      // Estrategia B: Búsqueda global por collectionGroup si no se encontró con brokerId
      if (!matchedClientDoc) {
        if (opportunityId) {
          const snap = await adminDb.collectionGroup("clients").where("ghlOpportunityId", "==", opportunityId).limit(1).get();
          if (!snap.empty) {
            matchedClientDoc = snap.docs[0].ref;
            matchedBrokerId = snap.docs[0].ref.parent.parent?.id || "";
          }
        }
        if (!matchedClientDoc && contactId) {
          const snap = await adminDb.collectionGroup("clients").where("ghlContactId", "==", contactId).limit(1).get();
          if (!snap.empty) {
            matchedClientDoc = snap.docs[0].ref;
            matchedBrokerId = snap.docs[0].ref.parent.parent?.id || "";
          }
        }
        if (!matchedClientDoc && contactEmail) {
          const snap = await adminDb.collectionGroup("clients").where("email", "==", contactEmail).limit(1).get();
          if (!snap.empty) {
            matchedClientDoc = snap.docs[0].ref;
            matchedBrokerId = snap.docs[0].ref.parent.parent?.id || "";
          }
        }
      }

      if (matchedClientDoc) {
        const clientDocRef = matchedClientDoc;

        // Se lee el estado previo DENTRO de una transacción para distinguir un
        // cambio real de estado de un webhook repetido — GHL puede disparar el
        // mismo evento 2 veces, y sin transacción ambas lecturas podían ver el
        // mismo previousStatus y notificar al broker por duplicado. La
        // transacción hace que la segunda entrega, al reintentar, ya vea el
        // status que acaba de escribir la primera.
        let previousStatus = "";
        let prevData: FirebaseFirestore.DocumentData = {};

        await adminDb.runTransaction(async (tx) => {
          const prevSnap = await tx.get(clientDocRef);
          prevData = prevSnap.data() || {};
          previousStatus = String(prevData.status || "");

          const updateData: Record<string, unknown> = {
            status: mappedStatus,
            stage: mapReviewStatusToPipelineStage(mappedStatus),
            ghlStageName: stageName || undefined,
            lastActivity: `GHL Pipeline: ${stageName || ghlStatus} (${new Date().toLocaleDateString()})`,
            updatedAt: new Date().toISOString()
          };

          if (monetaryValue > 0) {
            updateData.amount = monetaryValue;
          }

          tx.update(clientDocRef, updateData);
        });

        // Notificación al broker: aprobado / declinado / fondeado que llega
        // desde GHL debe avisar al broker igual que si lo marcó el admin.
        if (
          matchedBrokerId &&
          previousStatus !== mappedStatus &&
          NOTIFIABLE_STATUSES.includes(mappedStatus as CaseEmailStatus)
        ) {
          const status = mappedStatus as CaseEmailStatus;
          const brokerSnap = await adminDb.collection("brokers").doc(matchedBrokerId).get();
          const brokerData = brokerSnap.data();
          const clientName = prevData.name || "Cliente";
          const serviceName = prevData.serviceName || prevData.serviceId || "Servicio";
          const amount = monetaryValue > 0 ? monetaryValue : Number(prevData.amount) || undefined;

          after(() =>
            sendCaseStatusEmail({
              brokerEmail: brokerData?.email || "",
              brokerName: brokerData?.displayName || brokerData?.name || "Broker",
              clientName,
              serviceName,
              status,
              amount
            })
          );

          after(() =>
            createNotification(matchedBrokerId, {
              title: `Solicitud ${STATUS_LABELS[status]}`,
              message: `${clientName} — ${serviceName}`,
              link: "clientes"
            })
          );
        }

        await webhookLogRef.update({
          success: true,
          stageName,
          ghlStatus,
          mappedStatus,
          brokerId: matchedBrokerId,
          clientId: matchedClientDoc.id
        });

        return NextResponse.json({
          received: true,
          matched: true,
          brokerId: matchedBrokerId,
          clientId: matchedClientDoc.id,
          status: mappedStatus,
          stageName
        });
      }

      console.warn("Webhook GHL Pipeline: No se encontró cliente coincidente", { contactId, opportunityId, contactEmail, stageName });
      await webhookLogRef.update({ success: false, reason: "client_not_found", contactId, opportunityId, contactEmail });
      return NextResponse.json({ received: true, matched: false, reason: "client_not_found" });
    }

    if (eventType === "payment_received") {
      const email = String(data.contactEmail || "").trim().toLowerCase();
      if (!email) {
        await webhookLogRef.update({ success: false, reason: "missing_contactEmail" });
        return NextResponse.json({ error: "contactEmail requerido" }, { status: 400 });
      }

      const snap = await adminDb
        .collectionGroup("feeRounds")
        .where("clientEmail", "==", email)
        .where("status", "==", "pending_review")
        .get();

      if (snap.empty) {
        console.warn("Webhook de pago: no se encontró ronda pendiente para", email);
        await webhookLogRef.update({ success: false, reason: "no_pending_round", email });
        return NextResponse.json({ received: true, matched: false });
      }

      const roundDoc = snap.docs.sort((a, b) => String(a.data().createdAt || "").localeCompare(String(b.data().createdAt || "")))[0];

      await roundDoc.ref.update({
        status: "paid",
        paidAt: new Date().toISOString(),
        paymentReference: data.reference || null
      });

      const clientRef = roundDoc.ref.parent.parent;
      if (clientRef) {
        await clientRef.update({
          feeRoundStatus: "paid",
          feeRoundNumber: roundDoc.data().roundNumber || null
        });
      }

      await webhookLogRef.update({ success: true, roundId: roundDoc.id, email });
      return NextResponse.json({ received: true, matched: true, roundId: roundDoc.id });
    }

    if (eventType === "broker_onboarding_form_submitted") {
      const fullName = String(data.fullName || "").trim();
      const [firstName, ...restName] = fullName.split(/\s+/).filter(Boolean);
      const lastName = restName.join(" ");

      const email = String(data.businessEmail || "").trim().toLowerCase();
      const phone = String(data.businessPhone || "").trim();
      const businessName = String(data.businessName || "").trim();
      const businessAddress = String(data.businessAddress || "").trim();
      const businessHours = String(data.businessHours || "").trim();
      const businessWebsite = String(data.businessWebsite || "").trim();
      const logoColors = String(data.logoColors || "").trim();

      if (!email || (!fullName && !businessName)) {
        await webhookLogRef.update({ success: false, reason: "missing_required_fields", dataReceived: data });
        return NextResponse.json({ error: "Faltan datos mínimos (correo y nombre o negocio)" }, { status: 400 });
      }

      const agencyId = process.env.GHL_AGENCY_ID;
      const agencyApiKey = process.env.GHL_AGENCY_API_KEY;
      const snapshotId = process.env.GHL_BROKER_SNAPSHOT_ID;

      if (!agencyId || !agencyApiKey || !snapshotId) {
        console.error("Auto-provisioning: faltan GHL_AGENCY_ID / GHL_AGENCY_API_KEY / GHL_BROKER_SNAPSHOT_ID en el servidor.");
        await webhookLogRef.update({ success: false, reason: "missing_server_config" });
        return NextResponse.json({ error: "Servidor no configurado para auto-aprovisionar subcuentas" }, { status: 500 });
      }

      const existing = await adminDb.collection("provisionedSubaccounts").where("email", "==", email).limit(1).get();
      if (!existing.empty) {
        const doc = existing.docs[0];
        await webhookLogRef.update({ success: true, reason: "already_provisioned", email, locationId: doc.data().locationId });
        return NextResponse.json({ received: true, alreadyProvisioned: true, locationId: doc.data().locationId });
      }

      const locationName = businessName || fullName || email;

      try {
        const result = await createGHLLocationFromSnapshot(
          {
            name: locationName,
            companyId: agencyId,
            snapshotId,
            phone: phone || undefined,
            address: businessAddress || undefined,
            country: "US",
            website: businessWebsite || undefined,
            prospectInfo: { firstName, lastName, email }
          },
          agencyApiKey
        );

        const newLocationId = result.id || result.location?.id || null;

        await adminDb.collection("provisionedSubaccounts").add({
          email,
          fullName,
          businessName,
          businessAddress,
          businessHours,
          businessWebsite,
          logoColors,
          phone,
          locationId: newLocationId,
          snapshotId,
          createdAt: new Date().toISOString()
        });

        await webhookLogRef.update({ success: true, email, businessName, locationId: newLocationId });

        // Avisa al equipo de onboarding (ej. Samantha, si su cuenta tiene ese
        // rol) para que sepan quién necesita la entrega de CRM en 24-48h —
        // antes no había ninguna señal de esto fuera de revisar GHL a mano.
        const staffUids = await findStaffUidsByRoles(ONBOARDING_NOTIFICATION_ROLES);
        await notifyMany(staffUids, {
          title: "Nueva subcuenta CRM aprovisionada",
          message: `${businessName || fullName} (${email}) — entregar acceso al CRM en 24-48h.`,
          link: "admin"
        });

        return NextResponse.json({ received: true, matched: true, locationId: newLocationId });
      } catch (error) {
        console.error("Error auto-provisionando subcuenta de broker:", error);
        const message = error instanceof Error ? error.message : "Error desconocido";
        await webhookLogRef.update({ success: false, reason: "create_location_failed", email, errorMessage: message });
        return NextResponse.json({ error: "No se pudo crear la subcuenta automáticamente" }, { status: 502 });
      }
    }

    if (eventType === "payment_completed") {
      // Reemplaza el paso de correo plano ("Onboarding CRM Email") del
      // Workflow "payment completed (spanish)" en GHL — el pago no tiene un
      // orden fijo respecto al registro en el Hub, así que esto cubre los
      // 2 casos. Confirmado en vivo con Fernando el 2026-10-29 contra el
      // Workflow real.
      const email = String(data.contactEmail || "").trim().toLowerCase();
      const firstName = String(data.contactFirstName || "").trim();
      const lastName = String(data.contactLastName || "").trim();
      const phone = String(data.contactPhone || "").trim();
      const fallbackName = `${firstName} ${lastName}`.trim();

      if (!email) {
        await webhookLogRef.update({ success: false, reason: "missing_contactEmail" });
        return NextResponse.json({ error: "contactEmail requerido" }, { status: 400 });
      }

      const snap = await adminDb.collection("brokers").where("email", "==", email).limit(1).get();

      if (snap.empty) {
        // Pagó pero todavía no se registró en el Hub — no hay uid al cual
        // asignarle un brokerId todavía. Se le manda la bienvenida igual
        // (con el ID marcado como pendiente), y cuando sí se registre,
        // completeBrokerRegistration corre de nuevo y completa lo que falta
        // (es idempotente, ver lib/services/broker-registration.ts).
        after(() =>
          sendBrokerWelcomeEmail({
            brokerEmail: email,
            brokerName: fallbackName || email
          })
        );
        await webhookLogRef.update({ success: true, reason: "broker_not_registered_yet", email });
        return NextResponse.json({ received: true, matched: false, reason: "broker_not_registered_yet" });
      }

      const brokerDoc = snap.docs[0];
      const brokerData = brokerDoc.data();
      const wasAlreadyPaid = Boolean(brokerData.packagePaid);

      await brokerDoc.ref.update({ packagePaid: true });

      if (!wasAlreadyPaid && brokerData.referredByUid) {
        const referrerRef = adminDb.collection("brokers").doc(brokerData.referredByUid);
        await referrerRef.update({ referralEarnings: FieldValue.increment(REFERRAL_COMMISSION) });
        after(() =>
          createNotification(brokerData.referredByUid, {
            title: "¡Ganaste una comisión de referido!",
            message: `${brokerData.displayName || brokerData.name || "Un broker referido"} confirmó su pago — se te acreditaron $${REFERRAL_COMMISSION}.`,
            link: "perfil"
          })
        );
      }

      const result = await completeBrokerRegistration(brokerDoc.id);
      if (result?.isNewAssignment) {
        after(() =>
          sendBrokerWelcomeEmail({
            brokerEmail: result.email || email,
            brokerName: result.displayName || fallbackName || email,
            brokerId: result.brokerId
          })
        );
        after(() =>
          syncBrokerToCentralGHL({
            brokerName: result.displayName || fallbackName || email,
            brokerEmail: result.email || email,
            brokerPhone: phone || undefined,
            brokerId: result.brokerId
          })
        );
      }

      await webhookLogRef.update({ success: true, email, brokerId: brokerDoc.id, assignedBrokerId: result?.brokerId });
      return NextResponse.json({ received: true, matched: true, brokerId: brokerDoc.id });
    }

    if (eventType === "contract_signed") {
      // Disparado por un Workflow de GHL en el envío del formulario de
      // Contrato de Servicios (ver "Mi Contrato" en MiPerfilSection.tsx) —
      // el Workflow debe mandar {{contact.email}} como "contactEmail" en el
      // customData del Webhook, igual que ya hace payment_received arriba.
      const email = String(data.contactEmail || "").trim().toLowerCase();
      if (!email) {
        await webhookLogRef.update({ success: false, reason: "missing_contactEmail" });
        return NextResponse.json({ error: "contactEmail requerido" }, { status: 400 });
      }

      const snap = await adminDb.collection("brokers").where("email", "==", email).limit(1).get();
      if (snap.empty) {
        console.warn("Webhook de contrato: no se encontró broker para", email);
        await webhookLogRef.update({ success: false, reason: "broker_not_found", email });
        return NextResponse.json({ received: true, matched: false });
      }

      const brokerDoc = snap.docs[0];
      await brokerDoc.ref.update({
        contractSignedAt: new Date().toISOString(),
        contractSignedMethod: "webhook"
      });

      await webhookLogRef.update({ success: true, email, brokerId: brokerDoc.id });
      return NextResponse.json({ received: true, matched: true, brokerId: brokerDoc.id });
    }

    console.warn("Webhook GHL: eventType no reconocido:", eventType);
    await webhookLogRef.update({ success: false, reason: "unknown_event_type" });
    return NextResponse.json({ received: true, matched: false, reason: "unknown_event_type" });
  } catch (error) {
    console.error("Error procesando webhook de GHL:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "online",
    service: "E360 Hub - GoHighLevel Inbound Webhook Handler",
    supportedEvents: [
      "opportunity_stage_updated",
      "opportunity_status_updated",
      "pipeline_update",
      "payment_received",
      "broker_onboarding_form_submitted",
      "payment_completed",
      "contract_signed"
    ]
  });
}
