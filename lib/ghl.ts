// Helper para interacción con GoHighLevel (GHL) API v2

const GHL_API_BASE = "https://services.leadconnectorhq.com";

export interface GHLContactPayload {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  customFields?: { id: string; key: string; value: any }[];
  tags?: string[];
  source?: string;
}

/**
 * Obtiene el encabezado de autorización con la llave API de Agencia o Token de Location
 */
function getHeaders(locationId?: string) {
  const apiKey = process.env.GHL_AGENCY_API_KEY || "";
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
    "Version": "2021-07-28"
  };
}

/**
 * Busca o lista los contactos/leads de una locación específica de GHL
 */
export async function getGHLContacts(locationId?: string, query?: string) {
  const locId = locationId || process.env.GHL_DEFAULT_LOCATION_ID;
  if (!locId) {
    throw new Error("GHL Location ID no configurado.");
  }

  const url = new URL(`${GHL_API_BASE}/contacts/`);
  url.searchParams.append("locationId", locId);
  if (query) url.searchParams.append("query", query);
  url.searchParams.append("limit", "50");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: getHeaders(locId),
    next: { revalidate: 60 } // Cache en servidor por 60s
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Error en GHL API (${response.status}): ${errorData}`);
  }

  return response.json();
}

/**
 * Registra un nuevo cliente/lead directamente en la subcuenta de GHL
 */
export async function createGHLContact(contactData: GHLContactPayload, locationId?: string) {
  const locId = locationId || process.env.GHL_DEFAULT_LOCATION_ID;
  if (!locId) {
    throw new Error("GHL Location ID no configurado.");
  }

  const payload = {
    ...contactData,
    locationId: locId,
    tags: [...(contactData.tags || []), "Broker Hub Referral", "E360 Hub Lead"],
    source: contactData.source || "E360 Broker Onboarding Hub"
  };

  const response = await fetch(`${GHL_API_BASE}/contacts/`, {
    method: "POST",
    headers: getHeaders(locId),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Error creando contacto en GHL (${response.status}): ${errorData}`);
  }

  return response.json();
}

/**
 * Obtiene las Oportunidades / Pipelines activas de GHL
 */
export async function getGHLOpportunities(locationId?: string, pipelineId?: string) {
  const locId = locationId || process.env.GHL_DEFAULT_LOCATION_ID;
  const pipeId = pipelineId || process.env.GHL_MAIN_PIPELINE_ID;

  if (!locId) {
    throw new Error("GHL Location ID no configurado.");
  }

  const url = new URL(`${GHL_API_BASE}/opportunities/search`);
  url.searchParams.append("location_id", locId);
  if (pipeId) url.searchParams.append("pipeline_id", pipeId);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: getHeaders(locId)
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Error buscando oportunidades en GHL (${response.status}): ${errorData}`);
  }

  return response.json();
}
