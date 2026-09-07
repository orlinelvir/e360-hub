// Catálogo de roles de empleado/admin de E360 Hub — fuente única de verdad.
// Antes esto estaba duplicado en app/api/admin/roles/route.ts (definición) y
// en BrokerOnboardingClient.tsx (MASTER_ADMIN_EMAILS copiado a mano) — cualquier
// endpoint que revisara un rol "a mano" con una lista de strings podía quedar
// desalineado con lo que la UI mostraba. Todo debe pasar por aquí ahora.

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  allowedClusters: string[];
  permissions: string[];
  color: string;
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    id: "admin",
    name: "SuperAdmin / Director",
    description: "Acceso total: todas las verticales, comisiones, métricas, finanzas y asignación de roles.",
    allowedClusters: ["fondeo_rapido", "real_estate", "credit_repair", "seguros", "corporativo"],
    permissions: ["all"],
    color: "purple"
  },
  {
    id: "underwriter_mca",
    name: "Underwriter / Fondeo MCA",
    description: "Gestión exclusiva de solicitudes de Préstamos de Negocio (MCA), Préstamos Convencionales y Tarjetas.",
    allowedClusters: ["fondeo_rapido"],
    permissions: ["view_cases", "edit_cases", "add_notes"],
    color: "blue"
  },
  {
    id: "specialist_real_estate",
    name: "Especialista Real Estate & Hipotecas",
    description: "Gestión exclusiva de préstamos hipotecarios, FHA, DSCR e inversión inmobiliaria.",
    allowedClusters: ["real_estate"],
    permissions: ["view_cases", "edit_cases", "add_notes"],
    color: "emerald"
  },
  {
    id: "specialist_insurance",
    name: "Especialista de Seguros",
    description: "Gestión exclusiva de pólizas de auto personal, commercial trucking, casa, GL y workers comp.",
    allowedClusters: ["seguros"],
    permissions: ["view_cases", "edit_cases", "add_notes"],
    color: "cyan"
  },
  {
    id: "specialist_corporate",
    name: "Especialista Corporativo & Taxes",
    description: "Gestión de registros de LLC, preparación de taxes, inmigración (USCIS), nómina y POS.",
    allowedClusters: ["corporativo"],
    permissions: ["view_cases", "edit_cases", "add_notes"],
    color: "amber"
  },
  {
    id: "support_agent",
    name: "Agente de Soporte & Operaciones",
    description: "Atención a tickets de brokers, reintento de sincronizaciones GHL y asistencia general.",
    allowedClusters: ["fondeo_rapido", "real_estate", "credit_repair", "seguros", "corporativo"],
    permissions: ["view_tickets", "reply_tickets", "retry_sync"],
    color: "indigo"
  },
  {
    id: "onboarding_member",
    name: "Representante de Onboarding",
    description: "Revisión de nuevos brokers, aprovisionamiento de subcuentas GHL y entrega de accesos.",
    allowedClusters: ["corporativo"],
    permissions: ["view_subaccounts", "manage_brokers", "onboarding_setup"],
    color: "emerald"
  },
  {
    id: "sales_agent",
    name: "Representante de Ventas / Closer",
    description: "Gestión de prospectos comerciales, intake de clientes y seguimiento de conversiones.",
    allowedClusters: ["fondeo_rapido", "real_estate", "credit_repair", "seguros", "corporativo"],
    permissions: ["view_cases", "create_leads", "view_commissions"],
    color: "amber"
  },
  {
    id: "broker",
    name: "Broker Estándar",
    description: "Acceso estándar de afiliado: solo ve sus propios clientes, comisiones y herramientas.",
    allowedClusters: [],
    permissions: ["view_own_clients"],
    color: "gray"
  }
];

// Correos con acceso admin garantizado aunque su doc de Firestore todavía no
// tenga role:"admin" — resuelve el problema de "quién otorga el primer admin".
export const MASTER_ADMIN_EMAILS = [
  "fernando.elvire360@gmail.com",
  "admin@emprende360.biz",
  "soporte@emprende360.info",
  "jp@startpoint.biz"
];

export function isMasterAdminEmail(email: string | null | undefined): boolean {
  return MASTER_ADMIN_EMAILS.includes((email || "").toLowerCase().trim());
}

export function getRoleDefinition(role: string): RoleDefinition | undefined {
  return ROLE_DEFINITIONS.find((r) => r.id === role);
}

/**
 * true si el rol tiene el permiso dado (o el permiso comodín "all", que solo admin tiene).
 * Usar esto en vez de listas de role-IDs hardcodeadas en cada endpoint — así un
 * rol nuevo con el permiso correcto queda habilitado automáticamente en todos
 * lados sin tener que tocar cada ruta una por una.
 */
export function hasPermission(role: string, permission: string): boolean {
  const def = getRoleDefinition(role);
  if (!def) return false;
  return def.permissions.includes("all") || def.permissions.includes(permission);
}

/**
 * Resuelve el rol efectivo de un usuario: MASTER_ADMIN_EMAILS siempre gana
 * (bootstrap), si no se usa el campo `role` guardado en brokers/{uid}, con
 * "broker" como default si no existe.
 */
export async function resolveUserRole(
  adminDb: FirebaseFirestore.Firestore,
  uid: string,
  email: string | null | undefined
): Promise<string> {
  if (isMasterAdminEmail(email)) return "admin";
  const snap = await adminDb.collection("brokers").doc(uid).get();
  return snap.exists ? (snap.data()?.role || "broker") : "broker";
}

/**
 * IDs de rol de staff (excluye "broker") con acceso al cluster dado — usado para
 * saber a quién notificar cuando entra una solicitud nueva de esa vertical.
 */
export function getRoleIdsForCluster(cluster: string): string[] {
  return ROLE_DEFINITIONS
    .filter((r) => r.id !== "broker" && r.allowedClusters.includes(cluster))
    .map((r) => r.id);
}

// A qué roles se les notifica un ticket nuevo, según su categoría. "support_agent" y
// "admin" siempre están cubiertos (su descripción de rol ya incluye "asistencia
// general"); se agrega el especialista de la vertical solo cuando existe uno real
// en ROLE_DEFINITIONS, para no inventar roles que no existen.
const TICKET_CATEGORY_ROLES: Record<string, string[]> = {
  general: ["support_agent", "admin"],
  ghl_crm: ["support_agent", "admin"],
  commission: ["admin"],
  underwriting: ["underwriter_mca", "specialist_real_estate", "specialist_insurance", "support_agent", "admin"],
  credit_repair: ["support_agent", "admin"],
  onboarding: ["onboarding_member", "support_agent", "admin"],
  marketing: ["support_agent", "admin"],
  corporate_tax: ["specialist_corporate", "support_agent", "admin"]
};

export function getRoleIdsForTicketCategory(category: string): string[] {
  return TICKET_CATEGORY_ROLES[category] || ["support_agent", "admin"];
}
