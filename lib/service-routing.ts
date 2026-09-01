import { servicesData, PipelineCluster } from "@/app/hub/broker-onboarding/data/services";

export type CentralDepartment = "financial" | "insurance" | "corporate";

/**
 * Determina el cluster de pipeline (para GHL y para el RBAC de verticales) de un servicio.
 * Prioriza el catálogo (servicesData); el keyword-matching es solo un fallback para
 * casos/leads antiguos guardados antes de que el servicio tuviera pipelineCluster asignado.
 */
export function resolvePipelineCluster(serviceId: string | undefined, serviceName: string | undefined): PipelineCluster {
  const catalogService = serviceId ? servicesData.find((s) => s.id === serviceId) : undefined;
  if (catalogService) return catalogService.pipelineCluster;

  const name = (serviceName || "").toLowerCase();
  if (name.includes("real estate") || name.includes("hipotec") || name.includes("mortgage") || name.includes("dscr")) return "real_estate";
  if (name.includes("reparaci") || name.includes("repair")) return "credit_repair";
  if (name.includes("seguro") || name.includes("insurance")) return "seguros";
  if (name.includes("incorporat") || name.includes("llc") || name.includes("tax") || name.includes("impuesto") || name.includes("inmigra") || name.includes("payroll") || name.includes("pos")) return "corporativo";
  return "fondeo_rapido";
}

/**
 * Determina a qué subcuenta central de GHL (financial/insurance/corporate) se debe
 * sincronizar un lead, igual prioridad: catálogo primero, keyword-matching como fallback.
 */
export function resolveCentralDepartment(serviceId: string | undefined, serviceName: string | undefined): CentralDepartment {
  const catalogService = serviceId ? servicesData.find((s) => s.id === serviceId) : undefined;
  if (catalogService) return catalogService.centralDepartment;

  const name = (serviceName || "").toLowerCase();
  if (name.includes("loan") || name.includes("credit") || name.includes("funding") || name.includes("financial") ||
      name.includes("préstamo") || name.includes("crédito") || name.includes("fondeo")) {
    return "financial";
  }
  if (name.includes("insurance") || name.includes("seguro")) {
    return "insurance";
  }
  return "corporate";
}
