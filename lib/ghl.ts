// Helper para interacción con GoHighLevel (GHL) API v2

const GHL_API_BASE = "https://services.leadconnectorhq.com";

export class CRMError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "CRMError";
  }
}

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
 * Obtiene el encabezado de autorización usando la API Key individual del broker o del servidor
 */
function getHeaders(customApiKey?: string) {
  const apiKey = (customApiKey || process.env.GHL_PRIVATE_KEY || process.env.GHL_AGENCY_API_KEY || "").trim();
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
    "Version": "2021-07-28"
  };
}

function parseErrorMessage(status: number, text: string): string {
  if (!text || text.includes("<html") || text.includes("<!DOCTYPE")) {
    return `Error en servidor CRM (${status}): Respuesta inválida del servidor.`;
  }
  try {
    const json = JSON.parse(text);
    return json.message || json.error || `Error en servidor CRM (${status})`;
  } catch {
    return `Error en servidor CRM (${status}): ${text.substring(0, 150)}`;
  }
}

/**
 * Busca o lista los contactos/leads de una locación específica del CRM usando las credenciales del broker
 */
export async function getGHLContacts(locationId?: string, query?: string, customApiKey?: string) {
  const locId = (locationId || process.env.GHL_DEFAULT_LOCATION_ID || "").trim();
  if (!locId) {
    throw new CRMError("Location ID del CRM no configurado.", 400);
  }

  const url = new URL(`${GHL_API_BASE}/contacts`);
  url.searchParams.append("locationId", locId);
  if (query) url.searchParams.append("query", query);
  url.searchParams.append("limit", "50");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: getHeaders(customApiKey),
    next: { revalidate: 60 }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new CRMError(parseErrorMessage(response.status, errorText), response.status);
  }

  return response.json();
}

/**
 * Registra un nuevo cliente/lead directamente en la subcuenta del broker en GHL
 */
export async function createGHLContact(contactData: GHLContactPayload, locationId?: string, customApiKey?: string) {
  const locId = (locationId || process.env.GHL_DEFAULT_LOCATION_ID || "").trim();
  if (!locId) {
    throw new CRMError("Location ID del CRM no configurado.", 400);
  }

  const payload = {
    ...contactData,
    locationId: locId,
    tags: [...(contactData.tags || []), "Broker Hub Referral", "E360 Hub Lead"],
    source: contactData.source || "E360 Broker Onboarding Hub"
  };

  const response = await fetch(`${GHL_API_BASE}/contacts`, {
    method: "POST",
    headers: getHeaders(customApiKey),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new CRMError(parseErrorMessage(response.status, errorText), response.status);
  }

  return response.json();
}

/**
 * Obtiene las Oportunidades / Pipelines activas de GHL para el broker
 */
export async function getGHLOpportunities(locationId?: string, pipelineId?: string, customApiKey?: string) {
  const locId = (locationId || process.env.GHL_DEFAULT_LOCATION_ID || "").trim();
  const pipeId = pipelineId || process.env.GHL_MAIN_PIPELINE_ID;

  if (!locId) {
    throw new CRMError("Location ID del CRM no configurado.", 400);
  }

  const url = new URL(`${GHL_API_BASE}/opportunities/search`);
  url.searchParams.append("location_id", locId);
  if (pipeId) url.searchParams.append("pipeline_id", pipeId);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: getHeaders(customApiKey)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new CRMError(parseErrorMessage(response.status, errorText), response.status);
  }

  return response.json();
}
