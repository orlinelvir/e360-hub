import { createGHLContact } from "@/lib/ghl";

/**
 * Empuja al broker recién registrado como contacto a la subcuenta central
 * "Emprende 360" de GHL (la misma que ya se usa, solo de lectura, para
 * check_payment en app/api/admin/brokers/onboarding/route.ts). No hay custom
 * field conocido en esa location para el Broker ID, así que va como tag
 * literal — suficiente para filtrar/buscar en la UI de GHL por ahora.
 *
 * Best-effort a propósito, igual que createCRCLead/updateCRCLead: nunca debe
 * tumbar ni retrasar el registro del broker si GHL falla o las credenciales
 * no están configuradas.
 */
export async function syncBrokerToCentralGHL(params: {
  brokerName: string;
  brokerEmail: string;
  brokerPhone?: string;
  brokerId: string;
}): Promise<void> {
  const locationId = process.env.GHL_ONBOARDING_FORM_LOCATION_ID;
  const apiKey = process.env.GHL_AGENCY_API_KEY;

  if (!locationId || !apiKey) {
    console.warn("syncBrokerToCentralGHL: faltan GHL_ONBOARDING_FORM_LOCATION_ID o GHL_AGENCY_API_KEY, se omite el sync.");
    return;
  }

  const [firstName, ...rest] = params.brokerName.trim().split(/\s+/).filter(Boolean);

  try {
    await createGHLContact(
      {
        firstName: firstName || params.brokerName || "Broker",
        lastName: rest.length ? rest.join(" ") : undefined,
        email: params.brokerEmail,
        phone: params.brokerPhone,
        source: "E360 Hub - Registro de Broker",
        tags: ["Broker E360", `Broker ID: ${params.brokerId}`]
      },
      locationId,
      apiKey
    );
  } catch (err) {
    console.error("Error sincronizando broker con GHL central:", err);
  }
}
