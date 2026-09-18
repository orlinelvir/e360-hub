import { NextResponse, after } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifyAuthToken, adminDb, adminAuth } from "@/lib/firebase-admin";
import { resolveUserRole, hasPermission } from "@/lib/roles";
import { getGHLContacts, validateGHLCredentials, CRMError } from "@/lib/ghl";
import { sendBrokerOnboardingEmail, sendPasswordResetEmail } from "@/lib/email/send";
import { createNotification } from "@/lib/services/notification-service";
import { encrypt, decrypt } from "@/lib/crypto";
import { APP_BASE_URL } from "@/lib/email/client";
import { OnboardingStage } from "@/app/hub/broker-onboarding/types";

const REFERRAL_COMMISSION = 100;

const VALID_STAGES: OnboardingStage[] = ["ventas", "onboarding_basico", "onboarding_crm", "redes_sociales", "completado"];

// Tag exacto verificado en la subcuenta GHL "Emprende 360" (ver captura del usuario).
const PAYMENT_TAG = "payment completed (spanish)";

interface GHLContactSearchResult {
  contacts?: Array<{ id: string; email?: string; tags?: string[] }>;
}

// Detalle avanzado de un broker: estado real de su cuenta en Firebase Auth
// (para diagnosticar problemas de login) + sus credenciales de GHL guardadas
// (la API key nunca se devuelve en texto plano, solo un preview enmascarado).
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const brokerId = searchParams.get("brokerId");
    if (!brokerId) {
      return NextResponse.json({ error: "brokerId es requerido" }, { status: 400 });
    }

    const brokerSnap = await adminDb.collection("brokers").doc(brokerId).get();
    if (!brokerSnap.exists) {
      return NextResponse.json({ error: "Broker no encontrado" }, { status: 404 });
    }
    const data = brokerSnap.data()!;

    let authStatus: Record<string, unknown> | null = null;
    if (adminAuth) {
      try {
        const authUser = await adminAuth.getUser(brokerId);
        authStatus = {
          disabled: authUser.disabled,
          emailVerified: authUser.emailVerified,
          creationTime: authUser.metadata.creationTime,
          lastSignInTime: authUser.metadata.lastSignInTime || null,
          providerIds: authUser.providerData.map((p) => p.providerId)
        };
      } catch {
        authStatus = { notFound: true };
      }
    }

    let ghlApiKeyPreview = "";
    if (data.ghlApiKey) {
      try {
        const decrypted = decrypt(data.ghlApiKey);
        ghlApiKeyPreview = decrypted.length > 4 ? `••••${decrypted.slice(-4)}` : "••••";
      } catch {
        ghlApiKeyPreview = "(no se pudo leer)";
      }
    }

    return NextResponse.json({
      authStatus,
      ghl: {
        ghlLocationId: data.ghlLocationId || "",
        ghlSubaccountEmail: data.ghlSubaccountEmail || "",
        ghlConnected: Boolean(data.ghlConnected),
        ghlApiKeyPreview
      }
    });
  } catch (error) {
    console.error("Admin brokers onboarding GET error:", error);
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
        const wasAlreadyPaid = Boolean(brokerData.packagePaid);

        await brokerRef.update({ packagePaid });

        // Se acredita el referido SOLO la primera vez que se confirma el pago
        // (evita duplicar los $100 si alguien vuelve a apretar "Verificar Pago").
        if (packagePaid && !wasAlreadyPaid && brokerData.referredByUid) {
          const referrerRef = adminDb.collection("brokers").doc(brokerData.referredByUid);
          await referrerRef.update({ referralEarnings: FieldValue.increment(REFERRAL_COMMISSION) });
          after(() =>
            createNotification(brokerData.referredByUid, {
              title: "¡Ganaste una comisión de referido!",
              message: `${brokerName} confirmó su pago — se te acreditaron $${REFERRAL_COMMISSION}.`,
              link: "perfil"
            })
          );
        }

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

    if (action === "send_password_reset") {
      // Restringido a admin (no onboarding_member): a diferencia del resto de
      // acciones de este endpoint, esta toca la seguridad de la cuenta del broker.
      if (!hasPermission(role, "manage_account_security")) {
        return NextResponse.json({ error: "Acceso restringido. Esta acción requiere permisos de administrador." }, { status: 403 });
      }
      if (!adminAuth) {
        return NextResponse.json({ error: "Firebase Auth no está configurado en el servidor" }, { status: 500 });
      }
      if (!brokerEmail) {
        return NextResponse.json({ error: "El broker no tiene email registrado" }, { status: 400 });
      }

      try {
        const resetLink = await adminAuth.generatePasswordResetLink(brokerEmail, {
          url: `${APP_BASE_URL}/hub/broker-onboarding`
        });
        const authorSnap = await adminDb.collection("brokers").doc(user.uid).get();
        const authorName = authorSnap.data()?.displayName || authorSnap.data()?.name || user.email || "Equipo E360";
        await sendPasswordResetEmail({ brokerEmail, brokerName, authorName, resetLink });
        return NextResponse.json({ success: true });
      } catch (err) {
        console.error("Error enviando reset de contraseña:", err);
        const message = err instanceof Error ? err.message : "Error desconocido";
        return NextResponse.json({ error: `No se pudo enviar el reset de contraseña: ${message}` }, { status: 502 });
      }
    }

    if (action === "set_account_disabled") {
      if (!hasPermission(role, "manage_account_security")) {
        return NextResponse.json({ error: "Acceso restringido. Esta acción requiere permisos de administrador." }, { status: 403 });
      }
      if (!adminAuth) {
        return NextResponse.json({ error: "Firebase Auth no está configurado en el servidor" }, { status: 500 });
      }
      const { disabled } = body;
      if (typeof disabled !== "boolean") {
        return NextResponse.json({ error: "disabled debe ser true o false" }, { status: 400 });
      }

      try {
        await adminAuth.updateUser(brokerId, { disabled });
        return NextResponse.json({ success: true, disabled });
      } catch (err) {
        console.error("Error actualizando estado de cuenta:", err);
        const message = err instanceof Error ? err.message : "Error desconocido";
        return NextResponse.json({ error: `No se pudo actualizar la cuenta: ${message}` }, { status: 502 });
      }
    }

    if (action === "update_ghl_credentials") {
      const { ghlLocationId, ghlApiKey, ghlSubaccountEmail } = body;
      const updates: Record<string, unknown> = {};
      if (typeof ghlLocationId === "string") updates.ghlLocationId = ghlLocationId.trim();
      if (typeof ghlSubaccountEmail === "string") updates.ghlSubaccountEmail = ghlSubaccountEmail.trim();
      // Un campo de API key vacío significa "no cambiar" — nunca se le pide al
      // admin ver el valor guardado para poder reescribirlo tal cual.
      if (typeof ghlApiKey === "string" && ghlApiKey.trim()) {
        updates.ghlApiKey = encrypt(ghlApiKey.trim());
      }

      const finalLocationId = "ghlLocationId" in updates ? (updates.ghlLocationId as string) : (brokerData.ghlLocationId || "");
      const finalHasApiKey = "ghlApiKey" in updates || Boolean(brokerData.ghlApiKey);
      updates.ghlConnected = Boolean(finalLocationId && finalHasApiKey);

      await brokerRef.update(updates);
      return NextResponse.json({ success: true, ghlConnected: updates.ghlConnected });
    }

    if (action === "verify_ghl_credentials") {
      const locationId = (brokerData.ghlLocationId || "").trim();
      const encryptedKey = brokerData.ghlApiKey || "";
      if (!locationId || !encryptedKey) {
        return NextResponse.json({ valid: false, error: "El broker no tiene credenciales de GHL guardadas." });
      }
      try {
        const apiKey = decrypt(encryptedKey);
        const result = await validateGHLCredentials(locationId, apiKey);
        return NextResponse.json(result);
      } catch (err) {
        console.error("Error verificando credenciales GHL del broker:", err);
        return NextResponse.json({ valid: false, error: "No se pudo verificar la conexión." });
      }
    }

    return NextResponse.json({ error: "action no reconocida" }, { status: 400 });
  } catch (error) {
    console.error("Admin brokers onboarding PATCH error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
