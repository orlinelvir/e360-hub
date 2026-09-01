import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveBrokerCredentials } from "@/lib/resolve-broker-credentials";
import { createGHLContact, createOpportunityInPipeline } from "@/lib/ghl";
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

function resolveCentralDepartment(serviceId: string | undefined, serviceName: string | undefined): "financial" | "insurance" | "corporate" {
  const catalogService = serviceId ? servicesData.find((s) => s.id === serviceId) : undefined;
  if (catalogService) return catalogService.centralDepartment;

  const name = (serviceName || "").toLowerCase();
  if (name.includes("loan") || name.includes("credit") || name.includes("funding") || name.includes("financial") || name.includes("préstamo") || name.includes("crédito") || name.includes("fondeo")) return "financial";
  if (name.includes("insurance") || name.includes("seguro")) return "insurance";
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
    const adminSnap = await adminDb.collection("brokers").doc(user.uid).get();
    const role = adminSnap.exists ? adminSnap.data()?.role : undefined;

    if (role !== "admin") {
      return NextResponse.json(
        { error: "Acceso restringido. Se requiere rol de administrador." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { brokerId, clientId } = body;

    if (!brokerId || !clientId) {
      return NextResponse.json({ error: "brokerId y clientId son requeridos" }, { status: 400 });
    }

    const clientRef = adminDb.collection("brokers").doc(brokerId).collection("clients").doc(clientId);
    const clientSnap = await clientRef.get();

    if (!clientSnap.exists) {
      return NextResponse.json({ error: "Lead/Cliente no encontrado" }, { status: 404 });
    }

    const client = clientSnap.data()!;
    const fullName = client.name || "Cliente";
    const nameParts = fullName.split(" ");
    const firstName = nameParts[0] || fullName;
    const lastName = nameParts.slice(1).join(" ") || "";
    const email = client.email || "";
    const phone = client.phone || "";
    const serviceName = client.serviceName || "";
    const serviceId = client.serviceId || "";
    const amountNum = Number(client.amount) || 0;

    const pipelineCluster = resolvePipelineCluster(serviceId, serviceName);
    const centralDepartment = resolveCentralDepartment(serviceId, serviceName);

    const brokerDocSnap = await adminDb.collection("brokers").doc(brokerId).get();
    const brokerData = brokerDocSnap.data() || {};
    const brokerName = brokerData.displayName || brokerData.name || "Broker";
    const brokerEmail = brokerData.email || "";

    const { locationId: brokerLocationId, apiKey: brokerApiKey } = await resolveBrokerCredentials(brokerId);

    let brokerContactId: string | null = client.ghlContactId || null;
    let brokerOpportunityId: string | null = client.ghlOpportunityId || null;

    // Sincronizar al CRM del broker si no estaba creado
    if (brokerLocationId && brokerApiKey && !brokerContactId) {
      try {
        const contactData = {
          firstName,
          lastName,
          email,
          phone,
          source: "E360 Hub - Broker (Retry)",
          tags: ["E360 Hub Lead", "Broker Referral"]
        };
        const res = await createGHLContact(contactData, brokerLocationId, brokerApiKey);
        brokerContactId = res.contact?.id || null;

        if (brokerContactId) {
          brokerOpportunityId = await createOpportunityInPipeline({
            locationId: brokerLocationId,
            apiKey: brokerApiKey,
            contactId: brokerContactId,
            name: fullName,
            monetaryValue: amountNum,
            cluster: pipelineCluster
          });
        }
      } catch (err) {
        console.error("Retry sync broker CRM error:", err);
      }
    }

    // Sincronizar a Central E360 CRM
    const CENTRAL_CREDENTIALS = {
      financial: { locationId: process.env.GHL_E360_FINANCIAL_LOCATION_ID, apiKey: process.env.GHL_E360_FINANCIAL_API_KEY },
      insurance: {
        locationId: process.env.GHL_E360_INSURANCE_LOCATION_ID || process.env.GHL_E360_FINANCIAL_LOCATION_ID,
        apiKey: process.env.GHL_E360_INSURANCE_API_KEY || process.env.GHL_E360_FINANCIAL_API_KEY
      },
      corporate: { locationId: process.env.GHL_E360_CORPORATE_LOCATION_ID, apiKey: process.env.GHL_E360_CORPORATE_API_KEY }
    };

    const centralLocationId = CENTRAL_CREDENTIALS[centralDepartment].locationId;
    const centralApiKey = CENTRAL_CREDENTIALS[centralDepartment].apiKey;

    let centralContactId: string | null = null;
    let centralOpportunityId: string | null = null;

    if (centralLocationId && centralApiKey) {
      try {
        const contactData = {
          firstName,
          lastName,
          email,
          phone,
          source: "E360 Hub - Central (Retry)",
          tags: ["E360 Hub Lead", "Broker Attribution"],
          customFields: [
            { id: "Ro68oxRsiDgWQWJ0c0uO", key: "E360_Broker_ID", value: brokerId },
            { id: "MgfZiiWQpH60JLH7le9i", key: "E360_Broker_Name", value: brokerName },
            { id: "RdiSyHKjSCYOsGSfG1vh", key: "E360_Broker_Email", value: brokerEmail }
          ]
        };
        const res = await createGHLContact(contactData, centralLocationId, centralApiKey);
        centralContactId = res.contact?.id || null;

        if (centralContactId) {
          centralOpportunityId = await createOpportunityInPipeline({
            locationId: centralLocationId,
            apiKey: centralApiKey,
            contactId: centralContactId,
            name: fullName,
            monetaryValue: amountNum,
            cluster: pipelineCluster
          });
        }
      } catch (err) {
        console.error("Retry sync central CRM error:", err);
      }
    }

    const isSynced = Boolean(brokerContactId || centralContactId);

    await clientRef.update({
      status: isSynced ? "synced" : "failed_sync",
      ghlContactId: brokerContactId || "",
      ghlOpportunityId: brokerOpportunityId || "",
      lastActivity: `Reintento de sincronización: ${new Date().toLocaleDateString()}`
    });

    return NextResponse.json({
      success: isSynced,
      status: isSynced ? "synced" : "failed_sync",
      brokerContactId,
      centralContactId
    });
  } catch (error) {
    console.error("Admin retry-sync error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
