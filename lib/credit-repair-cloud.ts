// Cliente HTTP puro para la Web API de Credit Repair Cloud (CRC) — recibe las
// credenciales por parámetro (nunca lee process.env directo), calcado del
// patrón de lib/ghl.ts.
//
// Es una API vieja basada en XML, no REST/JSON: todo va por POST con 3
// parámetros de formulario (apiauthkey, secretkey, xmlData).
//
// OJO: la documentación pública (https://app.creditrepaircloud.com/webapi/)
// está desactualizada — ese host redirige (301) a un dominio y ruta
// distintos. Confirmado en vivo el 2026-10-19 con una llamada real:
//   app.creditrepaircloud.com/api/lead/insertRecord
//     → 301 → api.creditrepaircloud.com/api/webapi/clients/insertRecord
// Es decir, el módulo "lead" documentado ahora se llama "clients" bajo el
// host api.*, no app.*. Las otras 3 operaciones (update/delete/viewRecord) y
// el módulo Affiliate no se han probado — antes de usarlas, repetir esta
// misma verificación (pegar la URL vieja en curl -i y ver el header Location
// del 301) en vez de asumir que siguen el mismo patrón.
//
// La respuesta si es un error real (confirmada en vivo, error 4405 por una
// apiauthkey incorrecta):
//   <response><success>False</success><result><errors>
//     <error_no>4405</error_no><error_message>...</error_message>
//   </errors></result></response>
// No se ha visto todavía un ejemplo real de response exitoso — se asume que
// <success>True</success> es la señal, sin más estructura garantizada.

const CRC_BASE_URL = "https://api.creditrepaircloud.com/api/webapi";

const CRC_ERROR_MESSAGES: Record<string, string> = {
  "4401": "Parámetro inválido",
  "4402": "Falta un campo obligatorio",
  "4403": "Email inválido",
  "4404": "Error de parsing del XML",
  "4405": "apiauthkey incorrecto o con valor incorrecto",
  "4406": "API Key o Secret Key incorrectos",
  "4407": "El API Key está inactivo",
  "4408": "Error interno del servidor de CRC",
  "4409": "Se excedió el número de llamadas a la API",
  "4410": "ID incorrecto en el update",
  "4411": "secretkey incorrecto o con valor incorrecto",
  "4412": "Mensaje de error personalizado",
  "4413": "Client ID incorrecto",
  "4416": "Referido por no encontrado",
  "4417": "Affiliate ID incorrecto"
};

export interface CRCCredentials {
  apiAuthKey: string;
  secretKey: string;
}

export interface CRCLeadFields {
  firstname: string;
  lastname?: string;
  email: string;
  // CRC distingue phone_home/phone_mobile/phone_work — usamos phone_mobile
  // como el campo general, es el más probable de tener dato real.
  phone_mobile?: string;
  memo?: string;
}

export interface CRCResult {
  success: boolean;
  raw: string;
  errorCode?: string;
  errorMessage?: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function tag(name: string, value?: string): string {
  return value ? `<${name}>${escapeXml(value)}</${name}>` : "";
}

function buildLeadInsertXml(fields: CRCLeadFields): string {
  return `<data>${tag("type", "lead")}${tag("firstname", fields.firstname)}${tag("lastname", fields.lastname)}${tag("email", fields.email)}${tag("phone_mobile", fields.phone_mobile)}${tag("memo", fields.memo)}</data>`;
}

function parseCRCResponse(raw: string): { success: boolean; errorCode?: string; errorMessage?: string } {
  const successMatch = raw.match(/<success>\s*(true|false)\s*<\/success>/i);
  const success = successMatch ? successMatch[1].toLowerCase() === "true" : false;

  const errorCode = raw.match(/<error_no>\s*(\d+)\s*<\/error_no>/i)?.[1];
  const errorMessageFromApi = raw.match(/<error_message>([\s\S]*?)<\/error_message>/i)?.[1]?.trim();

  if (success) return { success: true };

  return {
    success: false,
    errorCode,
    errorMessage: errorMessageFromApi || (errorCode ? CRC_ERROR_MESSAGES[errorCode] : undefined) || "Error desconocido de CRC"
  };
}

export async function createCRCLead(fields: CRCLeadFields, credentials: CRCCredentials): Promise<CRCResult> {
  const xmlData = buildLeadInsertXml(fields);
  const body = new URLSearchParams({
    apiauthkey: credentials.apiAuthKey,
    secretkey: credentials.secretKey,
    xmlData
  });

  const res = await fetch(`${CRC_BASE_URL}/clients/insertRecord`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  const raw = await res.text();

  if (!res.ok) {
    return { success: false, raw, errorMessage: `HTTP ${res.status}` };
  }

  const parsed = parseCRCResponse(raw);
  return { ...parsed, raw };
}
