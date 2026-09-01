import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { createGHLLocationFromSnapshot } from "@/lib/ghl";

function mapGHLStageToHubStatus(stageName: string, ghlStatus: string): "synced" | "in_progress" | "approved" | "funded" | "rejected" {
  const name = (stageName || "").toLowerCase();
  const status = (ghlStatus || "").toLowerCase();

  if (status === "won" || name.includes("fund") || name.includes("fondead") || name.includes("pagado") || name.includes("paid") || name.includes("closed won") || name.includes("emitida")) {
    return "funded";
  }
  if (name.includes("approv") || name.includes("aprob") || name.includes("oferta") || name.includes("offer") || name.includes("firmado") || name.includes("contrato")) {
    return "approved";
  }
  if (status === "lost" || status === "abandoned" || name.includes("lost") || name.includes("declin") || name.includes("reject") || name.includes("cancel") || name.includes("no califica")) {
    return "rejected";
  }
  if (name.includes("underwrit") || name.includes("revis") || name.includes("proceso") || name.includes("evaluac") || name.includes("docs") || name.includes("análisis") || name.includes("analisis")) {
    return "in_progress";
  }
  return "synced";
}

/**
 * Receptor universal de webhooks salientes de GHL (Workflows → acción "Webhook").
 * Soporta autenticación por cabecera x-webhook-secret o parámetro ?token=
 *
 * Eventos soportados:
 * - "opportunity_stage_updated" / "opportunity_status_updated" / "pipeline_update": Sincronización bidireccional en tiempo real del pipeline de GHL hacia E360 Hub.
 * - "payment_received": Marca como pagada la ronda del fee de Reparación de Crédito.
 * - "broker_onboarding_form_submitted": Auto-aprovisiona la subcuenta GHL del broker clonando el Snapshot.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const secretHeader = request.headers.get("x-webhook-secret");
  const secretQuery = url.searchParams.get("token") || url.searchParams.get("secret");
  const providedSecret = secretHeader || secretQuery;

  if (process.env.GHL_WEBHOOK_SECRET && providedSecret !== process.env.GHL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const data = body.customData && typeof body.customData === "object" ? body.customData : body;
    const eventType = String(data.eventType || body.type || body.event || "");

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
        const updateData: Record<string, unknown> = {
          status: mappedStatus,
          ghlStageName: stageName || undefined,
          lastActivity: `GHL Pipeline: ${stageName || ghlStatus} (${new Date().toLocaleDateString()})`,
          updatedAt: new Date().toISOString()
        };

        if (monetaryValue > 0) {
          updateData.amount = monetaryValue;
        }

        await matchedClientDoc.update(updateData);

        // Registro en log de auditoría de Webhooks
        await adminDb.collection("ghlWebhookLogs").add({
          eventType: "pipeline_stage_sync",
          stageName,
          ghlStatus,
          mappedStatus,
          brokerId: matchedBrokerId,
          clientId: matchedClientDoc.id,
          receivedAt: new Date().toISOString(),
          success: true
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
      return NextResponse.json({ received: true, matched: false, reason: "client_not_found" });
    }

    if (eventType === "payment_received") {
      const email = String(data.contactEmail || "").trim().toLowerCase();
      if (!email) {
        return NextResponse.json({ error: "contactEmail requerido" }, { status: 400 });
      }

      const snap = await adminDb
        .collectionGroup("feeRounds")
        .where("clientEmail", "==", email)
        .where("status", "==", "pending_review")
        .get();

      if (snap.empty) {
        console.warn("Webhook de pago: no se encontró ronda pendiente para", email);
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
        return NextResponse.json({ error: "Faltan datos mínimos (correo y nombre o negocio)" }, { status: 400 });
      }

      const agencyId = process.env.GHL_AGENCY_ID;
      const agencyApiKey = process.env.GHL_AGENCY_API_KEY;
      const snapshotId = process.env.GHL_BROKER_SNAPSHOT_ID;

      if (!agencyId || !agencyApiKey || !snapshotId) {
        console.error("Auto-provisioning: faltan GHL_AGENCY_ID / GHL_AGENCY_API_KEY / GHL_BROKER_SNAPSHOT_ID en el servidor.");
        return NextResponse.json({ error: "Servidor no configurado para auto-aprovisionar subcuentas" }, { status: 500 });
      }

      const existing = await adminDb.collection("provisionedSubaccounts").where("email", "==", email).limit(1).get();
      if (!existing.empty) {
        const doc = existing.docs[0];
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

        return NextResponse.json({ received: true, matched: true, locationId: newLocationId });
      } catch (error) {
        console.error("Error auto-provisionando subcuenta de broker:", error);
        return NextResponse.json({ error: "No se pudo crear la subcuenta automáticamente" }, { status: 502 });
      }
    }

    console.warn("Webhook GHL: eventType no reconocido:", eventType);
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
      "broker_onboarding_form_submitted"
    ]
  });
}
