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
  const apiKey = (customApiKey || "").trim();
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
    const msg = json.message || json.error || json.msg || "";
    
    if (status === 401) {
      return "Token PIT inválido o expirado. Verifica que copiaste correctamente tu Private Integration Token.";
    }
    if (status === 403) {
      return "Permisos insuficientes. Tu Token PIT no tiene los scopes necesarios. Necesitas: contacts.readonly, contacts.write, opportunities.readonly, opportunities.write.";
    }
    if (status === 404) {
      return "Location ID no encontrado. Verifica que copiaste correctamente tu Location ID de StartPoint CRM.";
    }
    
    return msg || `Error en servidor CRM (${status})`;
  } catch {
    return `Error en servidor CRM (${status}): ${text.substring(0, 150)}`;
  }
}

/**
 * Busca o lista los contactos/leads de una locación específica del CRM usando las credenciales del broker
 */
export async function getGHLContacts(locationId?: string, query?: string, customApiKey?: string) {
  const locId = (locationId || "").trim();
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
  const locId = (locationId || "").trim();
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
  const locId = (locationId || "").trim();

  if (!locId) {
    throw new CRMError("Location ID del CRM no configurado.", 400);
  }

  const url = new URL(`${GHL_API_BASE}/opportunities/search`);
  url.searchParams.append("location_id", locId);
  if (pipelineId) url.searchParams.append("pipeline_id", pipelineId);

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

export interface GHLOpportunityPayload {
  pipelineId: string;
  locationId: string;
  name: string;
  pipelineStageId?: string;
  status?: string;
  contactId?: string;
  monetaryValue?: number;
  assignedTo?: string;
}

export async function createGHLOpportunity(oppData: GHLOpportunityPayload, customApiKey?: string) {
  const response = await fetch(`${GHL_API_BASE}/opportunities`, {
    method: "POST",
    headers: getHeaders(customApiKey),
    body: JSON.stringify(oppData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new CRMError(parseErrorMessage(response.status, errorText), response.status);
  }

  return response.json();
}

export async function updateGHLOpportunity(oppId: string, updateData: Partial<GHLOpportunityPayload>, customApiKey?: string) {
  const response = await fetch(`${GHL_API_BASE}/opportunities/${oppId}`, {
    method: "PUT",
    headers: getHeaders(customApiKey),
    body: JSON.stringify(updateData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new CRMError(parseErrorMessage(response.status, errorText), response.status);
  }

  return response.json();
}

export async function getGHLPipelines(locationId: string, customApiKey?: string) {
  const locId = locationId.trim();
  if (!locId) {
    throw new CRMError("Location ID del CRM no configurado.", 400);
  }

  const url = new URL(`${GHL_API_BASE}/pipelines/lookup`);
  url.searchParams.append("locationId", locId);

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

export async function validateGHLCredentials(locationId: string, apiKey: string): Promise<{
  valid: boolean;
  locationName?: string;
  error?: string;
}> {
  const locId = locationId.trim();
  const key = apiKey.trim();

  if (!locId || !key) {
    return { valid: false, error: "Location ID y Token PIT son requeridos." };
  }

  try {
    const url = new URL(`${GHL_API_BASE}/locations/${locId}`);
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: getHeaders(key),
    });

    if (response.ok) {
      const data = await response.json();
      return { 
        valid: true, 
        locationName: data.location?.name || "Subcuenta verificada" 
      };
    }

    const errorText = await response.text();
    return { 
      valid: false, 
      error: parseErrorMessage(response.status, errorText) 
    };
  } catch (err: any) {
    return { 
      valid: false, 
      error: `Error de conexión: ${err.message || "No se pudo conectar con GHL"}` 
    };
  }
}
