import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveBrokerCredentials } from "@/lib/resolve-broker-credentials";
import { createGHLContact, createGHLOpportunity, getGHLPipelines, getGHLPipelineStages } from "@/lib/ghl";

async function createOpportunityInPipeline(opts: {
  locationId: string;
  apiKey: string;
  contactId: string;
  name: string;
  monetaryValue: number;
}): Promise<string | null> {
  const { locationId, apiKey, contactId, name, monetaryValue } = opts;

  const pipelines = await getGHLPipelines(locationId, apiKey);
  const pipeline = pipelines.pipelines?.[0] || pipelines.data?.[0] || (Array.isArray(pipelines) ? pipelines[0] : undefined);

  if (!pipeline?.id) {
    console.warn("No pipeline found:", { pipelines: JSON.stringify(pipelines).substring(0, 300) });
    return null;
  }

  const stagesRes = await getGHLPipelineStages(locationId, pipeline.id, apiKey);
  const stage = stagesRes.pipelineStages?.[0] || stagesRes.stages?.[0] || (Array.isArray(stagesRes) ? stagesRes[0] : undefined);

  if (!stage?.id) {
    console.warn("No pipeline stage found:", { stages: JSON.stringify(stagesRes).substring(0, 300) });
    return null;
  }

  const oppData = {
    pipelineId: pipeline.id,
    pipelineStageId: stage.id,
    locationId,
    name,
    contactId,
    monetaryValue,
    status: "open"
  };

  const opp = await createGHLOpportunity(oppData, apiKey);
  return opp.opportunity?.id || null;
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
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      service,
      amount,
      notes
    } = body;

    if (!firstName || !email) {
      return NextResponse.json(
        { error: "Nombre y email son requeridos" },
        { status: 400 }
      );
    }

    const brokerSnap = await adminDb.collection("brokers").doc(user.uid).get();
    if (!brokerSnap.exists) {
      return NextResponse.json({ error: "Perfil de broker no encontrado" }, { status: 404 });
    }

    const brokerData = brokerSnap.data();
    const brokerName = brokerData?.displayName || brokerData?.email || "Broker";
    const brokerEmail = brokerData?.email || "";

    const amountNum = Number(amount) || 0;
    const fullName = `${firstName} ${lastName || ""}`.trim();

    const leadRef = await adminDb.collection("brokers").doc(user.uid).collection("clients").add({
      name: fullName,
      firstName,
      lastName: lastName || "",
      email,
      phone: phone || "",
      serviceId: "hub-admision",
      serviceName: service || "General",
      service: service || "General",
      amount: amountNum,
      estimatedCommission: amountNum > 0 ? Math.round(amountNum * 0.05) : 250,
      stage: "lead",
      notes: notes || "",
      createdAt: new Date().toISOString(),
      lastActivity: "Admitido desde E360 Hub",
      ghlContactId: "",
      ghlOpportunityId: "",
      status: "pending_sync",
      brokerId: user.uid,
      brokerName,
      brokerEmail
    });

    const { locationId: brokerLocationId, apiKey: brokerApiKey } = await resolveBrokerCredentials(user.uid, request);

    let brokerContactId: string | null = null;
    let brokerOpportunityId: string | null = null;

    if (brokerLocationId && brokerApiKey) {
      try {
        const contactData = {
          firstName,
          lastName,
          email,
          phone,
          source: "E360 Hub - Broker",
          tags: ["E360 Hub Lead", "Broker Referral"]
        };

        const brokerContact = await createGHLContact(contactData, brokerLocationId, brokerApiKey);
        brokerContactId = brokerContact.contact?.id || null;
        console.log("Broker Contact Created:", { contactId: brokerContactId });

        if (brokerContactId) {
          brokerOpportunityId = await createOpportunityInPipeline({
            locationId: brokerLocationId,
            apiKey: brokerApiKey,
            contactId: brokerContactId,
            name: fullName,
            monetaryValue: amountNum
          });
          console.log("Broker Opportunity Created:", { opportunityId: brokerOpportunityId });
        }
      } catch (error) {
        console.error("Error syncing to broker CRM:", error);
      }
    }

    const isFinancial = service?.toLowerCase().includes("loan") ||
                       service?.toLowerCase().includes("credit") ||
                       service?.toLowerCase().includes("funding") ||
                       service?.toLowerCase().includes("financial") ||
                       service?.toLowerCase().includes("préstamo") ||
                       service?.toLowerCase().includes("crédito") ||
                       service?.toLowerCase().includes("fondeo");

    const centralLocationId = isFinancial
      ? process.env.GHL_E360_FINANCIAL_LOCATION_ID
      : process.env.GHL_E360_INSURANCE_LOCATION_ID;

    const centralApiKey = isFinancial
      ? process.env.GHL_E360_FINANCIAL_API_KEY
      : process.env.GHL_E360_INSURANCE_API_KEY;

    let centralContactId: string | null = null;
    let centralOpportunityId: string | null = null;

    if (centralLocationId && centralApiKey) {
      try {
        const contactData = {
          firstName,
          lastName,
          email,
          phone,
          source: "E360 Hub - Central",
          tags: ["E360 Hub Lead", "Broker Attribution"],
          customFields: [
            { id: "Ro68oxRsiDgWQWJ0c0uO", key: "E360_Broker_ID", value: user.uid },
            { id: "MgfZiiWQpH60JLH7le9i", key: "E360_Broker_Name", value: brokerName },
            { id: "RdiSyHKjSCYOsGSfG1vh", key: "E360_Broker_Email", value: brokerEmail }
          ]
        };

        const centralContact = await createGHLContact(contactData, centralLocationId, centralApiKey);
        centralContactId = centralContact.contact?.id || null;
        console.log("Central Contact Created:", { contactId: centralContactId });

        if (centralContactId) {
          centralOpportunityId = await createOpportunityInPipeline({
            locationId: centralLocationId,
            apiKey: centralApiKey,
            contactId: centralContactId,
            name: fullName,
            monetaryValue: amountNum
          });
          console.log("Central Opportunity Created:", { opportunityId: centralOpportunityId });
        }
      } catch (error) {
        console.error("Error syncing to central CRM:", error);
      }
    }

    const brokerSynced = Boolean(brokerContactId);
    const centralSynced = Boolean(centralContactId);
    const finalStatus = (brokerSynced || centralSynced) ? "synced" : "failed_sync";

    await leadRef.update({
      status: finalStatus,
      ghlContactId: brokerContactId || "",
      ghlOpportunityId: brokerOpportunityId || "",
      brokerContactId,
      brokerOpportunityId,
      centralContactId,
      centralOpportunityId,
      syncedAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      leadId: leadRef.id,
      status: finalStatus,
      brokerSync: brokerSynced,
      centralSync: centralSynced,
      warning: finalStatus === "failed_sync"
        ? "El cliente se guardó en E360 Hub, pero no se pudo sincronizar con el CRM. Verifica tus credenciales en 'Mi Perfil' o contacta a soporte."
        : undefined
    });

  } catch (error) {
    console.error("Service submit error:", error);
    return NextResponse.json(
      { error: "Error al procesar el formulario" },
      { status: 500 }
    );
  }
}
