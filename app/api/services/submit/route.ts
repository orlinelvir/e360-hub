import { NextResponse, after } from "next/server";
import { verifyAuthToken, adminDb, adminStorage } from "@/lib/firebase-admin";
import { resolveBrokerCredentials } from "@/lib/resolve-broker-credentials";
import { createGHLContact, createOpportunityInPipeline } from "@/lib/ghl";
import { resolvePipelineCluster, resolveCentralDepartment } from "@/lib/service-routing";
import { sendWelcomeApplicationEmail, sendHardMoneyWorkScopeEmail } from "@/lib/email/send";
import { addCaseDocument } from "@/lib/services/case-service";
import { notifyStaffOfNewCase } from "@/lib/services/notification-service";
import { checkRateLimit } from "@/lib/services/rate-limit-service";
import { servicesData } from "@/app/hub/broker-onboarding/data/services";

const MAX_APPLICATION_FILE_SIZE = 8 * 1024 * 1024;
const WORK_SCOPE_SIGNED_URL_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const ALLOWED_WORK_SCOPE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  const rateLimit = await checkRateLimit(user.uid, "services-submit", RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
  if (!rateLimit.allowed) {
    const retrySeconds = Math.ceil((rateLimit.retryAfterMs || 0) / 1000);
    return NextResponse.json(
      { error: `Demasiadas solicitudes seguidas. Intenta de nuevo en ${retrySeconds} segundos.` },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const firstName = (formData.get("firstName") as string) || "";
    const lastName = (formData.get("lastName") as string) || "";
    const email = (formData.get("email") as string) || "";
    const phone = (formData.get("phone") as string) || "";
    const service = (formData.get("service") as string) || "";
    const serviceId = (formData.get("serviceId") as string) || "";
    const amount = (formData.get("amount") as string) || "";
    const notes = (formData.get("notes") as string) || "";

    const applicationFileEntry = formData.get("applicationFile");
    const applicationFile = applicationFileEntry instanceof File && applicationFileEntry.size > 0 ? applicationFileEntry : null;
    const officialFormConfirmed = formData.get("officialFormConfirmed") === "true";

    // Pedido de JP: en Préstamo Hipotecario, si es Hard Money el broker puede
    // adjuntar el work scope (cotización del negocio) directo al admitir al
    // cliente, para que no dependa de acordarse de reenviarlo él mismo.
    const isHardMoney = formData.get("isHardMoney") === "true";
    const workScopeFileEntry = formData.get("workScopeFile");
    const workScopeFile = workScopeFileEntry instanceof File && workScopeFileEntry.size > 0 ? workScopeFileEntry : null;

    if (!firstName || !email) {
      return NextResponse.json(
        { error: "Nombre y email son requeridos" },
        { status: 400 }
      );
    }

    if (applicationFile) {
      if (applicationFile.type !== "application/pdf") {
        return NextResponse.json({ error: "El PDF de la solicitud debe ser un archivo PDF" }, { status: 400 });
      }
      if (applicationFile.size > MAX_APPLICATION_FILE_SIZE) {
        return NextResponse.json({ error: "El PDF de la solicitud no debe superar 8MB" }, { status: 400 });
      }
    }

    if (workScopeFile) {
      if (!ALLOWED_WORK_SCOPE_TYPES.includes(workScopeFile.type)) {
        return NextResponse.json({ error: "El work scope debe ser una imagen (JPG/PNG/WEBP) o PDF" }, { status: 400 });
      }
      if (workScopeFile.size > MAX_APPLICATION_FILE_SIZE) {
        return NextResponse.json({ error: "El work scope no debe superar 8MB" }, { status: 400 });
      }
    }

    const pipelineCluster = resolvePipelineCluster(serviceId, service);
    const centralDepartment = resolveCentralDepartment(serviceId, service);

    // Requisito de verificación: para servicios de Financiamiento, sin la confirmación
    // del formulario oficial de E360 o el PDF de la subcuenta propia del broker, no hay
    // ninguna prueba de que el cliente realmente presentó la solicitud.
    const isFinancingService = pipelineCluster === "fondeo_rapido" || pipelineCluster === "real_estate";
    if (isFinancingService && !officialFormConfirmed && !applicationFile) {
      return NextResponse.json(
        { error: "Para completar la solicitud de financiamiento, confirma que el cliente llenó el formulario oficial de E360 o adjunta el PDF de la solicitud de tu subcuenta." },
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

    // Comisión real por servicio (ver ServiceDetail.commissionRate) — antes
    // esto era un 5% fijo para TODOS los servicios sin importar lo que decía
    // el catálogo, así que "AdiosDeudas" (2%) o cualquier servicio con una
    // tasa real distinta nunca se habría reflejado en el monto guardado. Si
    // el servicio no define una tasa, se mantiene el 5%/$250 histórico.
    const matchedService = serviceId ? servicesData.find((s) => s.id === serviceId) : undefined;
    const hasCustomRate = matchedService?.commissionRate !== undefined;
    const commissionRate = matchedService?.commissionRate ?? 0.05;
    const estimatedCommission = amountNum > 0
      ? Math.round(amountNum * commissionRate)
      : (hasCustomRate ? 0 : 250);

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
      estimatedCommission,
      stage: "lead",
      notes: notes || "",
      createdAt: new Date().toISOString(),
      lastActivity: "Admitido desde E360 Hub",
      ghlContactId: "",
      ghlOpportunityId: "",
      // Este endpoint es el formulario real de "Admitir Cliente" — para
      // servicios de financiamiento ya se validó arriba que hay confirmación
      // del formulario oficial o un PDF adjunto, así que el caso nace
      // directamente "en revisión", no como un lead sin verificar.
      status: "in_review",
      syncStatus: "pending",
      brokerId: user.uid,
      brokerName,
      brokerEmail
    });

    if (applicationFile && adminStorage) {
      try {
        const buffer = Buffer.from(await applicationFile.arrayBuffer());
        const storagePath = `case-documents/${user.uid}/${leadRef.id}/${Date.now()}-${applicationFile.name}`;
        await adminStorage.bucket().file(storagePath).save(buffer, { contentType: applicationFile.type });
        await addCaseDocument(user.uid, leadRef.id, {
          fileName: applicationFile.name,
          storagePath,
          contentType: applicationFile.type,
          size: applicationFile.size,
          uploadedByName: brokerName,
          uploadedById: user.uid
        });
      } catch (error) {
        console.error("Error subiendo el PDF de la solicitud del broker:", error);
      }
    }

    if (isHardMoney && workScopeFile && adminStorage) {
      try {
        const buffer = Buffer.from(await workScopeFile.arrayBuffer());
        const storagePath = `case-documents/${user.uid}/${leadRef.id}/${Date.now()}-${workScopeFile.name}`;
        await adminStorage.bucket().file(storagePath).save(buffer, { contentType: workScopeFile.type });
        await addCaseDocument(user.uid, leadRef.id, {
          fileName: workScopeFile.name,
          storagePath,
          contentType: workScopeFile.type,
          size: workScopeFile.size,
          uploadedByName: brokerName,
          uploadedById: user.uid
        });

        const [fileUrl] = await adminStorage.bucket().file(storagePath).getSignedUrl({
          action: "read",
          expires: Date.now() + WORK_SCOPE_SIGNED_URL_EXPIRY_MS
        });

        after(() =>
          sendHardMoneyWorkScopeEmail({
            brokerName,
            clientName: fullName,
            fileUrl,
            fileName: workScopeFile.name
          })
        );
      } catch (error) {
        console.error("Error subiendo o enviando el work scope de Hard Money:", error);
      }
    }

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
    const finalSyncStatus = (brokerSynced || centralSynced) ? "synced" : "failed";

    await leadRef.update({
      syncStatus: finalSyncStatus,
      ghlContactId: brokerContactId || "",
      ghlOpportunityId: brokerOpportunityId || "",
      brokerContactId,
      brokerOpportunityId,
      centralContactId,
      centralOpportunityId,
      syncedAt: new Date().toISOString()
    });

    after(() =>
      sendWelcomeApplicationEmail({
        brokerEmail,
        brokerName,
        clientName: fullName,
        serviceName: service || "tu solicitud",
      })
    );

    after(() =>
      notifyStaffOfNewCase({
        cluster: pipelineCluster,
        clientName: fullName,
        serviceName: service || "Servicio",
        brokerName
      })
    );

    return NextResponse.json({
      success: true,
      leadId: leadRef.id,
      syncStatus: finalSyncStatus,
      brokerSync: brokerSynced,
      centralSync: centralSynced,
      warning: finalSyncStatus === "failed"
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
