import { ServiceDetail } from "@/app/hub/broker-onboarding/data/services";

// Módulo sin dependencias de servidor (nada de firebase-admin) — seguro de
// importar tanto en componentes de cliente como en rutas de servidor, para
// que la lógica de merge nunca se duplique entre ambos lados.

// Solo los campos de CONTENIDO de negocio son editables sin deploy (precio,
// requisitos, proceso, teléfono, enlace de formulario, estado). Los campos
// estructurales (id, icon, category, centralDepartment, pipelineCluster) NO
// son parte de esto a propósito — cambiarlos afectaría el enrutamiento a GHL
// y las comisiones, que deben seguir siendo estables y solo cambiar vía código
// revisado. "icon" tampoco puede guardarse en Firestore (es un componente de
// React), así que ni siquiera es candidato.
export interface ServiceOverride {
  title?: string;
  description?: string;
  requirements?: string[];
  process?: string[];
  timeframe?: string;
  comission?: string;
  formLink?: string;
  supportPhone?: string;
  supportPhoneFormatted?: string;
  status?: ServiceDetail["status"];
  statusLabel?: string;
  updatedAt?: string;
  updatedByName?: string;
}

export const OVERRIDABLE_KEYS: (keyof ServiceOverride)[] = [
  "title", "description", "requirements", "process", "timeframe",
  "comission", "formLink", "supportPhone", "supportPhoneFormatted",
  "status", "statusLabel"
];

export function mergeServiceOverride(service: ServiceDetail, override?: ServiceOverride): ServiceDetail {
  if (!override) return service;
  const merged = { ...service } as unknown as Record<string, unknown>;
  for (const key of OVERRIDABLE_KEYS) {
    const value = override[key];
    if (value !== undefined) {
      merged[key] = value;
    }
  }
  return merged as unknown as ServiceDetail;
}
