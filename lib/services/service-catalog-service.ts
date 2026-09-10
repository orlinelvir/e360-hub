import { adminDb } from "@/lib/firebase-admin";
import { servicesData, ServiceDetail } from "@/app/hub/broker-onboarding/data/services";
import { ServiceOverride, OVERRIDABLE_KEYS, mergeServiceOverride } from "./service-catalog-shared";

export type { ServiceOverride };
export { mergeServiceOverride };

function collectionRef() {
  if (!adminDb) throw new Error("Servidor no configurado");
  return adminDb.collection("serviceOverrides");
}

export async function getServiceOverrides(): Promise<Record<string, ServiceOverride>> {
  if (!adminDb) return {};
  const snap = await collectionRef().get();
  const map: Record<string, ServiceOverride> = {};
  snap.docs.forEach((d) => {
    map[d.id] = d.data() as ServiceOverride;
  });
  return map;
}

export async function setServiceOverride(
  serviceId: string,
  override: Partial<ServiceOverride>,
  updatedByName: string
): Promise<void> {
  const sanitized: Partial<ServiceOverride> = {};
  for (const key of OVERRIDABLE_KEYS) {
    if (override[key] !== undefined) {
      (sanitized as Record<string, unknown>)[key] = override[key];
    }
  }
  await collectionRef().doc(serviceId).set(
    { ...sanitized, updatedAt: new Date().toISOString(), updatedByName },
    { merge: true }
  );
}

export async function clearServiceOverride(serviceId: string): Promise<void> {
  await collectionRef().doc(serviceId).delete();
}

/**
 * Catálogo completo (18 servicios estáticos) con los overrides de Firestore
 * ya aplicados — la fuente única de verdad para cualquier consumidor
 * server-side que necesite el contenido "efectivo" (Chat IA, formLink real, etc).
 */
export async function getEffectiveServicesCatalog(): Promise<ServiceDetail[]> {
  const overrides = await getServiceOverrides();
  return servicesData.map((s) => mergeServiceOverride(s, overrides[s.id]));
}
