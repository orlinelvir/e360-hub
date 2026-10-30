// Cliente HTTP puro para la Web API de Credit Repair Cloud (CRC) — recibe las
// credenciales por parámetro (nunca lee process.env directo), calcado del
// patrón de lib/ghl.ts.
//
// Es una API vieja basada en XML, no REST/JSON. Confirmado en vivo el
// 2026-10-20 contra la página real de "Developer References → Insert Record
// (Lead/Client)" (la doc pública en app.creditrepaircloud.com/webapi está
// desactualizada y usa nombres de parámetro distintos — NO seguirla):
//
//   POST https://api.creditrepaircloud.com/api/webapi/clients/insertRecord
//   Parámetros de formulario: api_auth_key, secret_key, xml_data
//   (ojo: con guión bajo — "apiauthkey"/"secretkey"/"xmlData" de la doc
//   pública vieja NO existen como parámetros y el server los ignora
//   silenciosamente, devolviendo 4405 como si la key no existiera)
//
//   xml_data va envuelto en <crcloud><lead>...</lead></crcloud>, no <data>.
//   "type" es obligatorio: Lead | Lead/Inactive | Inactive | Suspended.
//
// Respuesta real confirmada en vivo:
//   Éxito:  <response><success>True</success><result>
//             <message>Record(s) added successfully</message>
//             <id>...</id><created_time>...</created_time>
//           </result></response>
//   Error:  <response><success>False</success><result><errors>
//             <error_no>4405</error_no><error_message>...</error_message>
//           </errors></result></response>

const CRC_BASE_URL = "https://api.creditrepaircloud.com/api/webapi";

// Link de pago de la cuota mensual de $10 — compartido entre el intake, el
// cron de rondas y el modal de admisión. Antes vivía copiado a mano en los 3
// lugares (y quedó desactualizado en los 3 a la vez); con un solo export
// actualizarlo es un cambio de una línea.
export const CREDIT_REPAIR_PAYMENT_LINK = "https://link.fastpaydirect.com/payment-link/6acf189f075ea22a20cde58f";

const CRC_ERROR_MESSAGES: Record<string, string> = {
  "4401": "Parámetro inválido",
  "4402": "Falta un campo obligatorio",
  "4403": "Email inválido",
  "4404": "Error de parsing del XML",
  "4405": "api_auth_key incorrecto o con valor incorrecto",
  "4406": "API Key o Secret Key incorrectos",
  "4407": "El API Key está inactivo",
  "4408": "Error interno del servidor de CRC",
  "4409": "Se excedió el número de llamadas a la API",
  "4410": "ID incorrecto en el update",
  "4411": "secret_key incorrecto o con valor incorrecto",
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
  // Solo en éxito — id opaco que CRC asigna al registro (guardar tal cual,
  // sin decodificar, por si updateRecord/viewRecord lo esperan de vuelta igual).
  crcId?: string;
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
  const inner = `${tag("type", "Lead")}${tag("firstname", fields.firstname)}${tag("lastname", fields.lastname)}${tag("email", fields.email)}${tag("phone_mobile", fields.phone_mobile)}${tag("memo", fields.memo)}`;
  return `<crcloud><lead>${inner}</lead></crcloud>`;
}

function parseCRCResponse(raw: string): { success: boolean; errorCode?: string; errorMessage?: string; crcId?: string } {
  const successMatch = raw.match(/<success>\s*(true|false)\s*<\/success>/i);
  const success = successMatch ? successMatch[1].toLowerCase() === "true" : false;

  if (success) {
    const crcId = raw.match(/<id>([\s\S]*?)<\/id>/i)?.[1]?.trim();
    return { success: true, crcId };
  }

  const errorCode = raw.match(/<error_no>\s*(\d+)\s*<\/error_no>/i)?.[1];
  const errorMessageFromApi = raw.match(/<error_message>([\s\S]*?)<\/error_message>/i)?.[1]?.trim();

  return {
    success: false,
    errorCode,
    errorMessage: errorMessageFromApi || (errorCode ? CRC_ERROR_MESSAGES[errorCode] : undefined) || "Error desconocido de CRC"
  };
}

// Tipos de lead que CRC soporta además de "Lead" (usado al crear) — nunca
// usados hasta ahora en el codebase. El Hub los usa para reflejar
// Pausado/Cancelado del lado del Hub también del lado de CRC.
export type CRCLeadType = "Lead" | "Lead/Inactive" | "Inactive" | "Suspended";

// updateRecord — confirmado en vivo el 2026-10-26 contra un lead de prueba
// desechable (insertRecord → id "ODQy", intentos directos contra
// updateRecord): el parámetro SÍ se llama <id> (child element, no atributo;
// <client_id>/<lead_id> dan 4401 "Invalid parameter") y debe ir solo, sin
// <email> (combinarlos dispara 4412 "ya existe con este email"). PERO el id
// que devuelve insertRecord es RECHAZADO acá con 4410 "Wrong ID in update" —
// el formato de ID que de verdad espera este endpoint sigue sin confirmar,
// pendiente de la doc oficial "Update Record" de CRC (Fernando tiene que
// pasarla, igual que pasó con "Insert Record" al principio del proyecto).
// Por eso esta función es best-effort: si CRC rechaza el ID, se loguea y
// NO tumba el cambio de estado en el Hub (el estado real vive en Firestore,
// CRC es solo un espejo opcional).
function buildLeadUpdateXml(crcId: string, type: CRCLeadType): string {
  const inner = `${tag("id", crcId)}${tag("type", type)}`;
  return `<crcloud><lead>${inner}</lead></crcloud>`;
}

export async function updateCRCLead(crcId: string, type: CRCLeadType, credentials: CRCCredentials): Promise<CRCResult> {
  const xmlData = buildLeadUpdateXml(crcId, type);
  const body = new URLSearchParams({
    api_auth_key: credentials.apiAuthKey,
    secret_key: credentials.secretKey,
    xml_data: xmlData
  });

  const res = await fetch(`${CRC_BASE_URL}/clients/updateRecord`, {
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

export async function createCRCLead(fields: CRCLeadFields, credentials: CRCCredentials): Promise<CRCResult> {
  const xmlData = buildLeadInsertXml(fields);
  const body = new URLSearchParams({
    api_auth_key: credentials.apiAuthKey,
    secret_key: credentials.secretKey,
    xml_data: xmlData
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
