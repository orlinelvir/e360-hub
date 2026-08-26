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
  customFields?: { id: string; key: string; value: string | number | boolean }[];
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

/**
 * Crea una oportunidad en el primer pipeline/etapa disponible de la subcuenta.
 * TODO: una vez existan pipelines dedicados por línea de negocio (ver ESTRATEGIA_GHL),
 * elegir el pipeline por nombre/clave estable en vez de "el primero que aparezca".
 */
export async function createOpportunityInPipeline(opts: {
  locationId: string;
  apiKey: string;
  contactId: string;
  name: string;
  monetaryValue: number;
}): Promise<string | null> {
  const { locationId, apiKey, contactId, name, monetaryValue } = opts;

  const pipelines = await getGHLPipelines(locationId, apiKey);
  const pipeline = pipelines.pipelines?.[0] || pipelines.data?.[0] || (Array.isArray(pipelines) ? pipelines[0] : undefined);

  if (!pipeline?.id) {
    console.warn("No pipeline found:", { pipelines: JSON.stringify(pipelines).substring(0, 300) });
    return null;
  }

  const stagesRes = await getGHLPipelineStages(locationId, pipeline.id, apiKey);
  const stage = stagesRes.pipelineStages?.[0] || stagesRes.stages?.[0] || (Array.isArray(stagesRes) ? stagesRes[0] : undefined);

  if (!stage?.id) {
    console.warn("No pipeline stage found:", { stages: JSON.stringify(stagesRes).substring(0, 300) });
    return null;
  }

  const oppData: GHLOpportunityPayload = {
    pipelineId: pipeline.id,
    pipelineStageId: stage.id,
    locationId,
    name,
    contactId,
    monetaryValue,
    status: "open"
  };

  const opp = await createGHLOpportunity(oppData, apiKey);
  return opp.opportunity?.id || null;
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

export async function getGHLPipelineStages(locationId: string, pipelineId: string, customApiKey?: string) {
  const locId = locationId.trim();
  if (!locId) {
    throw new CRMError("Location ID del CRM no configurado.", 400);
  }
  if (!pipelineId) {
    throw new CRMError("Pipeline ID del CRM no configurado.", 400);
  }

  const url = new URL(`${GHL_API_BASE}/pipelines/${pipelineId}/stages`);
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

export interface AgencyLocation {
  id: string;
  name: string;
  companyId?: string;
  state?: string;
  country?: string;
  timezone?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface CreateLocationFromSnapshotPayload {
  name: string;
  companyId: string;
  snapshotId: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  timezone?: string;
  prospectInfo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

/**
 * Crea una subcuenta (location) nueva clonando la configuración de un Snapshot.
 * Requiere un token de AGENCIA (Company-level PIT) con el scope locations.write —
 * verifica que la Private Integration de agencia lo tenga habilitado en GHL.
 */
export async function createGHLLocationFromSnapshot(payload: CreateLocationFromSnapshotPayload, agencyApiKey: string) {
  const response = await fetch(`${GHL_API_BASE}/locations/`, {
    method: "POST",
    headers: getHeaders(agencyApiKey),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new CRMError(parseErrorMessage(response.status, errorText), response.status);
  }

  return response.json();
}

export async function getAgencyLocations(companyId: string, agencyApiKey: string, opts?: { max?: number }): Promise<{ locations: AgencyLocation[]; total: number }> {
  const cid = companyId.trim();
  const key = agencyApiKey.trim();

  if (!cid) {
    throw new CRMError("Agency ID (companyId) no configurado.", 400);
  }
  if (!key) {
    throw new CRMError("Agency API Key no configurada.", 400);
  }

  const limit = 100;
  const max = opts?.max ?? 5000;
  const locations: AgencyLocation[] = [];
  let skip = 0;

  while (locations.length < max) {
    const url = new URL(`${GHL_API_BASE}/locations/search`);
    url.searchParams.append("companyId", cid);
    url.searchParams.append("limit", String(limit));
    url.searchParams.append("skip", String(skip));

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: getHeaders(key)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new CRMError(parseErrorMessage(response.status, errorText), response.status);
    }

    const data = await response.json();
    const batch: AgencyLocation[] = data.locations || [];
    locations.push(...batch);

    if (batch.length < limit) break;
    skip += limit;
  }

  return { locations, total: locations.length };
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
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo conectar con GHL";
    return {
      valid: false,
      error: `Error de conexión: ${message}`
    };
  }
}
