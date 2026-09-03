import { NextResponse, after } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole, hasPermission } from "@/lib/roles";
import { getGHLContacts, CRMError } from "@/lib/ghl";
import { sendBrokerOnboardingEmail } from "@/lib/email/send";
import { createNotification } from "@/lib/services/notification-service";
import { OnboardingStage } from "@/app/hub/broker-onboarding/types";

const VALID_STAGES: OnboardingStage[] = ["ventas", "onboarding_basico", "onboarding_crm", "redes_sociales", "completado"];

// Tag exacto verificado en la subcuenta GHL "Emprende 360" (ver captura del usuario).
const PAYMENT_TAG = "payment completed (spanish)";

interface GHLContactSearchResult {
  contacts?: Array<{ id: string; email?: string; tags?: string[] }>;
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
    if (!hasPermission(role, "manage_brokers")) {
      return NextResponse.json({ error: "Acceso restringido. Se requiere permiso para gestionar brokers." }, { status: 403 });
    }

    const body = await request.json();
    const { brokerId, action } = body;

    if (!brokerId || !action) {
      return NextResponse.json({ error: "brokerId y action son requeridos" }, { status: 400 });
    }

    const brokerRef = adminDb.collection("brokers").doc(brokerId);
    const brokerSnap = await brokerRef.get();
    if (!brokerSnap.exists) {
      return NextResponse.json({ error: "Broker no encontrado" }, { status: 404 });
    }
    const brokerData = brokerSnap.data()!;
    const brokerEmail = brokerData.email || "";
    const brokerName = brokerData.displayName || brokerData.name || "Broker";

    if (action === "advance_stage") {
      const { stage } = body;
      if (!VALID_STAGES.includes(stage)) {
        return NextResponse.json({ error: "Etapa inválida" }, { status: 400 });
      }
      await brokerRef.update({ onboardingStage: stage });
      return NextResponse.json({ success: true, onboardingStage: stage });
    }

    if (action === "check_payment") {
      if (!brokerEmail) {
        return NextResponse.json({ error: "El broker no tiene email registrado" }, { status: 400 });
      }

      const locationId = process.env.GHL_ONBOARDING_FORM_LOCATION_ID;
      const apiKey = process.env.GHL_AGENCY_API_KEY;
      if (!locationId || !apiKey) {
        return NextResponse.json({ error: "Falta configurar GHL_ONBOARDING_FORM_LOCATION_ID o GHL_AGENCY_API_KEY" }, { status: 500 });
      }

      try {
        const result = (await getGHLContacts(locationId, brokerEmail, apiKey)) as GHLContactSearchResult;
        const contact = result.contacts?.find((c) => (c.email || "").toLowerCase() === brokerEmail.toLowerCase());
        const tags = (contact?.tags || []).map((t) => t.toLowerCase());
        const packagePaid = tags.includes(PAYMENT_TAG);

        await brokerRef.update({ packagePaid });
        return NextResponse.json({ success: true, packagePaid, contactFound: Boolean(contact) });
      } catch (err) {
        const message = err instanceof CRMError ? err.message : "Error consultando GHL";
        return NextResponse.json({ error: message }, { status: 502 });
      }
    }

    if (action === "send_message") {
      const { message } = body;
      const trimmedMessage = String(message || "").trim();
      if (!trimmedMessage) {
        return NextResponse.json({ error: "El mensaje no puede estar vacío" }, { status: 400 });
      }

      const authorSnap = await adminDb.collection("brokers").doc(user.uid).get();
      const authorName = authorSnap.data()?.displayName || authorSnap.data()?.name || user.email || "Equipo E360";

      after(() =>
        sendBrokerOnboardingEmail({
          brokerEmail,
          brokerName,
          authorName,
          message: trimmedMessage
        })
      );

      after(() =>
        createNotification(brokerId, {
          title: "Actualización de onboarding",
          message: trimmedMessage,
          link: "perfil"
        })
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "action debe ser advance_stage, check_payment o send_message" }, { status: 400 });
  } catch (error) {
    console.error("Admin brokers onboarding PATCH error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
