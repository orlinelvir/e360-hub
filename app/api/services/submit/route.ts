import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveBrokerCredentials } from "@/lib/resolve-broker-credentials";
import { createGHLContact, createOpportunityInPipeline } from "@/lib/ghl";
import { servicesData, PipelineCluster } from "@/app/hub/broker-onboarding/data/services";

/**
 * Resuelve el cluster de pipeline GHL para un servicio (fondeo_rapido, real_estate, credit_repair, seguros, corporativo).
 */
function resolvePipelineCluster(serviceId: string | undefined, serviceName: string | undefined): PipelineCluster {
  const catalogService = serviceId ? servicesData.find((s) => s.id === serviceId) : undefined;
  if (catalogService) return catalogService.pipelineCluster;

  const name = (serviceName || "").toLowerCase();
  if (name.includes("real estate") || name.includes("hipotec") || name.includes("mortgage") || name.includes("dscr")) {
    return "real_estate";
  }
  if (name.includes("reparaci") || name.includes("repair")) {
    return "credit_repair";
  }
  if (name.includes("seguro") || name.includes("insurance")) {
    return "seguros";
  }
  if (name.includes("incorporat") || name.includes("llc") || name.includes("tax") || name.includes("impuesto") || name.includes("inmigra") || name.includes("payroll") || name.includes("pos")) {
    return "corporativo";
  }
  return "fondeo_rapido";
}

/**
 * Resuelve el departamento GHL central (financial/insurance/corporate) para un servicio.
 * Prioriza el catálogo oficial por serviceId; si no llega un serviceId reconocido
 * (llamadas antiguas o el genérico "hub-admision"), cae a un heurístico por palabras
 * clave sobre el nombre del servicio como último recurso.
 */
function resolveCentralDepartment(serviceId: string | undefined, serviceName: string | undefined): "financial" | "insurance" | "corporate" {
  const catalogService = serviceId ? servicesData.find((s) => s.id === serviceId) : undefined;
  if (catalogService) return catalogService.centralDepartment;

  const name = (serviceName || "").toLowerCase();
  if (name.includes("loan") || name.includes("credit") || name.includes("funding") || name.includes("financial") ||
      name.includes("préstamo") || name.includes("crédito") || name.includes("fondeo")) {
    return "financial";
  }
  if (name.includes("insurance") || name.includes("seguro")) {
    return "insurance";
  }
  return "corporate";
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
      serviceId,
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
      serviceId: serviceId || "hub-admision",
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

    const pipelineCluster = resolvePipelineCluster(serviceId, service);
    const centralDepartment = resolveCentralDepartment(serviceId, service);

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
            monetaryValue: amountNum,
            cluster: pipelineCluster
          });
          console.log("Broker Opportunity Created:", { opportunityId: brokerOpportunityId, cluster: pipelineCluster });
        }
      } catch (error) {
        console.error("Error syncing to broker CRM:", error);
      }
    }

    const CENTRAL_CREDENTIALS: Record<typeof centralDepartment, { locationId?: string; apiKey?: string }> = {
      financial: { locationId: process.env.GHL_E360_FINANCIAL_LOCATION_ID, apiKey: process.env.GHL_E360_FINANCIAL_API_KEY },
      // Seguros y financiamiento comparten la misma subcuenta central "E360 Broker (Funding Form Submissions)".
      // Si no hay credenciales específicas de seguros, cae al financiero.
      insurance: {
        locationId: process.env.GHL_E360_INSURANCE_LOCATION_ID || process.env.GHL_E360_FINANCIAL_LOCATION_ID,
        apiKey: process.env.GHL_E360_INSURANCE_API_KEY || process.env.GHL_E360_FINANCIAL_API_KEY
      },
      corporate: { locationId: process.env.GHL_E360_CORPORATE_LOCATION_ID, apiKey: process.env.GHL_E360_CORPORATE_API_KEY }
    };

    const centralLocationId = CENTRAL_CREDENTIALS[centralDepartment].locationId;
    const centralApiKey = CENTRAL_CREDENTIALS[centralDepartment].apiKey;

    console.log("Central department resolved:", { serviceId: serviceId || null, service, centralDepartment, pipelineCluster, hasCredentials: Boolean(centralLocationId && centralApiKey) });

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
            monetaryValue: amountNum,
            cluster: pipelineCluster
          });
          console.log("Central Opportunity Created:", { opportunityId: centralOpportunityId, cluster: pipelineCluster });
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
