import { NextResponse, after } from "next/server";
import { verifyAuthToken, adminDb, adminStorage } from "@/lib/firebase-admin";
import { resolveBrokerCredentials } from "@/lib/resolve-broker-credentials";
import { createGHLContact, createOpportunityInPipeline } from "@/lib/ghl";
import { encrypt } from "@/lib/crypto";
import { sendWelcomeApplicationEmail } from "@/lib/email/send";
import { checkRateLimit } from "@/lib/services/rate-limit-service";
import { notifyStaffOfNewCase } from "@/lib/services/notification-service";
import { createCRCLead } from "@/lib/credit-repair-cloud";

// Vercel limita el tamaño del body de las funciones serverless (4.5MB en la mayoría
// de los planes) — nos quedamos debajo de eso para no depender de configuración extra.
const MAX_PROOF_SIZE = 4 * 1024 * 1024;
const ALLOWED_PROOF_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const CREDIT_REPAIR_FEE_AMOUNT = 10;
const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb || !adminStorage) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  const rateLimit = await checkRateLimit(user.uid, "credit-repair-intake", RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
  if (!rateLimit.allowed) {
    const retrySeconds = Math.ceil((rateLimit.retryAfterMs || 0) / 1000);
    return NextResponse.json(
      { error: `Demasiadas solicitudes seguidas. Intenta de nuevo en ${retrySeconds} segundos.` },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();

    const firstName = String(formData.get("firstName") || "").trim();
    const lastName = String(formData.get("lastName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const notes = String(formData.get("notes") || "").trim();

    const hasExistingSubscription = formData.get("hasExistingSubscription") === "true";
    const existingPlatform = String(formData.get("existingPlatform") || "").trim();
    const idType = String(formData.get("idType") || "ssn") === "itin" ? "itin" : "ssn";
    const credentialEmail = String(formData.get("credentialEmail") || "").trim();
    const credentialPassword = String(formData.get("credentialPassword") || "");
    const credentialToken = String(formData.get("credentialToken") || "");
    const last4Ssn = String(formData.get("last4Ssn") || "").trim();

    const proof = formData.get("proof");

    if (!firstName || !email) {
      return NextResponse.json({ error: "Nombre y email del cliente son requeridos" }, { status: 400 });
    }

    if (!(proof instanceof File) || proof.size === 0) {
      return NextResponse.json({ error: "El comprobante de pago del fee es requerido" }, { status: 400 });
    }

    if (proof.size > MAX_PROOF_SIZE) {
      return NextResponse.json({ error: "El comprobante de pago no puede superar 4MB" }, { status: 400 });
    }

    if (!ALLOWED_PROOF_TYPES.includes(proof.type)) {
      return NextResponse.json({ error: "El comprobante debe ser una imagen (JPG/PNG/WEBP) o PDF" }, { status: 400 });
    }

    if (idType === "ssn" && (!credentialEmail || !credentialPassword || !last4Ssn)) {
      return NextResponse.json({ error: "Faltan datos de acceso (correo, contraseña o últimos 4 del SSN)" }, { status: 400 });
    }

    if (idType === "itin" && (!credentialEmail || !credentialToken)) {
      return NextResponse.json({ error: "Faltan datos de acceso a MyFreeScoreNow (correo o token)" }, { status: 400 });
    }

    const brokerSnap = await adminDb.collection("brokers").doc(user.uid).get();
    if (!brokerSnap.exists) {
      return NextResponse.json({ error: "Perfil de broker no encontrado" }, { status: 404 });
    }

    const brokerData = brokerSnap.data();
    const brokerName = brokerData?.displayName || brokerData?.email || "Broker";
    const brokerEmail = brokerData?.email || "";

    const fullName = `${firstName} ${lastName}`.trim();

    const leadRef = await adminDb.collection("brokers").doc(user.uid).collection("clients").add({
      name: fullName,
      firstName,
      lastName,
      email,
      phone,
      serviceId: "credit-repair",
      serviceName: "Reparación de Crédito",
      service: "Reparación de Crédito",
      amount: 0,
      estimatedCommission: 0,
      stage: "lead",
      notes,
      createdAt: new Date().toISOString(),
      lastActivity: "Admitido desde formulario de Reparación de Crédito",
      ghlContactId: "",
      ghlOpportunityId: "",
      status: "pending_sync",
      brokerId: user.uid,
      brokerName,
      brokerEmail
    });

    // Subir comprobante de pago (todo pasa por el Admin SDK; el cliente no tiene
    // acceso directo a Storage, ver storage.rules).
    const proofBuffer = Buffer.from(await proof.arrayBuffer());
    const proofExt = proof.type === "application/pdf" ? "pdf" : proof.type.split("/")[1] || "bin";
    const proofPath = `credit-repair-proofs/${user.uid}/${leadRef.id}/round-1-${Date.now()}.${proofExt}`;
    const bucket = adminStorage.bucket();
    await bucket.file(proofPath).save(proofBuffer, { contentType: proof.type });

    // Datos sensibles (contraseña, token, últimos 4 del SSN) se cifran igual que
    // los tokens PIT de GHL — nunca se guardan en texto plano.
    await leadRef.collection("creditRepairCase").doc("case").set({
      hasExistingSubscription,
      existingPlatform: hasExistingSubscription ? existingPlatform : "",
      idType,
      credentialEmail,
      credentialPassword: credentialPassword ? encrypt(credentialPassword) : "",
      credentialToken: credentialToken ? encrypt(credentialToken) : "",
      last4Ssn: last4Ssn ? encrypt(last4Ssn) : "",
      createdAt: new Date().toISOString()
    });

    const feeRoundRef = await leadRef.collection("feeRounds").add({
      roundNumber: 1,
      amount: CREDIT_REPAIR_FEE_AMOUNT,
      status: "pending_review",
      proofPath,
      paymentLink: "https://link.fastpaydirect.com/payment-link/6a8688d6f9c8c807930b9166",
      // Denormalizados para poder ubicar esta ronda desde el webhook de pagos de GHL
      // (colecciones anidadas bajo brokers/{uid}/clients/{clientId}, sin llave única global).
      clientEmail: email.toLowerCase(),
      brokerId: user.uid,
      leadId: leadRef.id,
      createdAt: new Date().toISOString()
    });

    // Sync a GHL: subcuenta del broker + subcuenta central Financiero (credit-repair
    // está mapeado a "financial" en el catálogo de servicios).
    const { locationId: brokerLocationId, apiKey: brokerApiKey } = await resolveBrokerCredentials(user.uid, request);

    let brokerContactId: string | null = null;
    let centralContactId: string | null = null;

    if (brokerLocationId && brokerApiKey) {
      try {
        const brokerContact = await createGHLContact(
          { firstName, lastName, email, phone, source: "E360 Hub - Credit Repair", tags: ["E360 Hub Lead", "Credit Repair Intake"] },
          brokerLocationId,
          brokerApiKey
        );
        brokerContactId = brokerContact.contact?.id || null;
        if (brokerContactId) {
          await createOpportunityInPipeline({
            locationId: brokerLocationId,
            apiKey: brokerApiKey,
            contactId: brokerContactId,
            name: fullName,
            monetaryValue: 0,
            cluster: "credit_repair"
          });
        }
      } catch (error) {
        console.error("Error syncing credit repair lead to broker CRM:", error);
      }
    }

    const centralLocationId = process.env.GHL_E360_FINANCIAL_LOCATION_ID;
    const centralApiKey = process.env.GHL_E360_FINANCIAL_API_KEY;

    if (centralLocationId && centralApiKey) {
      try {
        const centralContact = await createGHLContact(
          {
            firstName,
            lastName,
            email,
            phone,
            source: "E360 Hub - Credit Repair - Central",
            tags: ["E360 Hub Lead", "Credit Repair Intake", "Broker Attribution"],
            customFields: [
              { id: "Ro68oxRsiDgWQWJ0c0uO", key: "E360_Broker_ID", value: user.uid },
              { id: "MgfZiiWQpH60JLH7le9i", key: "E360_Broker_Name", value: brokerName },
              { id: "RdiSyHKjSCYOsGSfG1vh", key: "E360_Broker_Email", value: brokerEmail }
            ]
          },
          centralLocationId,
          centralApiKey
        );
        centralContactId = centralContact.contact?.id || null;
        if (centralContactId) {
          await createOpportunityInPipeline({
            locationId: centralLocationId,
            apiKey: centralApiKey,
            contactId: centralContactId,
            name: fullName,
            monetaryValue: 0,
            cluster: "credit_repair"
          });
        }
      } catch (error) {
        console.error("Error syncing credit repair lead to central CRM:", error);
      }
    }

    const synced = Boolean(brokerContactId || centralContactId);

    await leadRef.update({
      // Antes esto mezclaba revisión y sincronización en un solo campo
      // ("synced"/"failed_sync") — deriveCaseStatus() ya los interpretaba
      // igual (reviewStatus siempre "pending_docs" hasta que staff revise),
      // pero separarlos explícitamente evita que el próximo lector asuma que
      // "synced" significa que alguien ya revisó el caso.
      status: "pending_docs",
      syncStatus: synced ? "synced" : "failed",
      ghlContactId: brokerContactId || "",
      syncedAt: new Date().toISOString(),
      // Visible directamente en la tarjeta del cliente en "Mis Clientes" sin lecturas extra.
      feeRoundStatus: "pending_review",
      feeRoundNumber: 1
    });

    after(() =>
      sendWelcomeApplicationEmail({
        brokerEmail,
        brokerName,
        clientName: fullName,
        serviceName: "Reparación de Crédito",
      })
    );

    // Este intake no notificaba a staff como sí hace services/submit — el
    // equipo de Reparación de Crédito nunca se enteraba de una solicitud
    // nueva salvo que alguien revisara el Master Feed por su cuenta.
    after(() =>
      notifyStaffOfNewCase({
        cluster: "credit_repair",
        clientName: fullName,
        serviceName: "Reparación de Crédito",
        brokerName
      })
    );

    // Push automático a Credit Repair Cloud (CRC) — crea el Lead/Client allá
    // mismo al admitir en el Hub, sin que nadie tenga que volver a capturar
    // el contacto a mano. Nunca bloquea ni tumba la admisión si falla o si
    // las credenciales no están configuradas (ver CRC_API_AUTH_KEY/CRC_SECRET_KEY
    // en .env.example). El Hub nunca recolecta el SSN completo (solo últimos
    // 4, cifrados) así que el registro en CRC nace con los datos de contacto
    // básicos — el equipo de CRC completa el resto al hacer el pull de crédito.
    const crcApiAuthKey = process.env.CRC_API_AUTH_KEY;
    const crcSecretKey = process.env.CRC_SECRET_KEY;
    if (crcApiAuthKey && crcSecretKey) {
      after(async () => {
        try {
          const result = await createCRCLead(
            {
              firstname: firstName,
              lastname: lastName,
              email,
              phone_mobile: phone,
              memo: `Admitido vía E360 Hub por ${brokerName} — Caso ${leadRef.id}.${notes ? ` Notas: ${notes}` : ""}`
            },
            { apiAuthKey: crcApiAuthKey, secretKey: crcSecretKey }
          );
          await leadRef.update({
            crcSynced: result.success,
            crcSyncedAt: new Date().toISOString(),
            ...(result.success ? {} : { crcSyncError: result.errorMessage || "Error desconocido" })
          });
          if (!result.success) {
            console.error("Error sincronizando lead con Credit Repair Cloud:", result.errorCode, result.errorMessage, result.raw);
          }
        } catch (error) {
          console.error("Error llamando a la API de Credit Repair Cloud:", error);
        }
      });
    }

    return NextResponse.json({
      success: true,
      leadId: leadRef.id,
      feeRoundId: feeRoundRef.id,
      status: synced ? "synced" : "failed_sync",
      warning: synced
        ? undefined
        : "El cliente se guardó en E360 Hub, pero no se pudo sincronizar con el CRM. Verifica tus credenciales en 'Mi Perfil' o contacta a soporte."
    });
  } catch (error) {
    console.error("Credit repair intake error:", error);
    return NextResponse.json({ error: "Error al procesar el formulario de Reparación de Crédito" }, { status: 500 });
  }
}
