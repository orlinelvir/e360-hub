import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveBrokerCredentials } from "@/lib/resolve-broker-credentials";
import { createGHLContact, createGHLOpportunity, getGHLPipelines, CRMError } from "@/lib/ghl";
import { decrypt, isEncrypted } from "@/lib/crypto";

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

    const leadRef = await adminDb.collection("brokers").doc(user.uid).collection("clients").add({
      firstName,
      lastName: lastName || "",
      email,
      phone: phone || "",
      service: service || "General",
      amount: amount || 0,
      notes: notes || "",
      status: "pending_sync",
      createdAt: new Date().toISOString(),
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
        console.log("Broker Contact Created:", { contactId: brokerContactId, response: JSON.stringify(brokerContact).substring(0, 200) });

        if (brokerContactId) {
          const pipelines = await getGHLPipelines(brokerLocationId, brokerApiKey);
          console.log("Broker Pipelines Response:", JSON.stringify(pipelines).substring(0, 500));
          
          const pipeline = pipelines.pipelines?.[0] || pipelines.data?.[0] || pipelines[0];

          if (pipeline) {
            const oppData = {
              pipelineId: pipeline.id,
              locationId: brokerLocationId,
              name: `${firstName} ${lastName || ""}`.trim(),
              contactId: brokerContactId,
              monetaryValue: amount || 0,
              status: "open"
            };

            const brokerOpp = await createGHLOpportunity(oppData, brokerApiKey);
            brokerOpportunityId = brokerOpp.opportunity?.id || null;
            console.log("Broker Opportunity Created:", { opportunityId: brokerOpportunityId, response: JSON.stringify(brokerOpp).substring(0, 200) });
          } else {
            console.warn("No pipeline found for broker:", { pipelines: JSON.stringify(pipelines).substring(0, 300) });
          }
        }
      } catch (error) {
        console.error("Error syncing to broker CRM:", error);
      }
    }

    const isFinancial = service?.toLowerCase().includes("loan") ||
                       service?.toLowerCase().includes("credit") ||
                       service?.toLowerCase().includes("funding") ||
                       service?.toLowerCase().includes("financial");

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
        console.log("Central Contact Created:", { contactId: centralContactId, response: JSON.stringify(centralContact).substring(0, 200) });

        if (centralContactId) {
          const pipelines = await getGHLPipelines(centralLocationId, centralApiKey);
          console.log("Central Pipelines Response:", JSON.stringify(pipelines).substring(0, 500));
          
          const pipeline = pipelines.pipelines?.[0] || pipelines.data?.[0] || pipelines[0];

          if (pipeline) {
            const oppData = {
              pipelineId: pipeline.id,
              locationId: centralLocationId,
              name: `${firstName} ${lastName || ""}`.trim(),
              contactId: centralContactId,
              monetaryValue: amount || 0,
              status: "open"
            };

            const centralOpp = await createGHLOpportunity(oppData, centralApiKey);
            centralOpportunityId = centralOpp.opportunity?.id || null;
            console.log("Central Opportunity Created:", { opportunityId: centralOpportunityId, response: JSON.stringify(centralOpp).substring(0, 200) });
          } else {
            console.warn("No pipeline found for central:", { pipelines: JSON.stringify(pipelines).substring(0, 300) });
          }
        }
      } catch (error) {
        console.error("Error syncing to central CRM:", error);
      }
    }

    const finalStatus = (brokerContactId || centralContactId) ? "synced" : "failed_sync";

    await leadRef.update({
      status: finalStatus,
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
      brokerSync: Boolean(brokerContactId),
      centralSync: Boolean(centralContactId)
    });

  } catch (error) {
    console.error("Service submit error:", error);
    return NextResponse.json(
      { error: "Error al procesar el formulario" },
      { status: 500 }
    );
  }
}
