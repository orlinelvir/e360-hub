import { TicketCategory } from "@/app/hub/broker-onboarding/types";

export interface TicketCategoryExtraField {
  key: string;
  label: string;
  placeholder: string;
  type: "text" | "number";
}

export interface TicketCategoryDef {
  id: TicketCategory;
  label: string;
  extraField?: TicketCategoryExtraField;
}

// Alineado 1:1 con los 8 departamentos reales de Contacto Directo (Mario, Fernando,
// Anthony, Laura, Samantha, Valentina) para que cada ticket tenga un dueño claro.
export const TICKET_CATEGORIES: TicketCategoryDef[] = [
  { id: "general", label: "Soporte General / Plataforma" },
  {
    id: "ghl_crm",
    label: "CRM StartPoint — Configuración/Errores",
    extraField: { key: "errorMessage", label: "Mensaje de error exacto (si aplica)", placeholder: "Copia el mensaje de error tal cual aparece", type: "text" }
  },
  {
    id: "commission",
    label: "Comisiones y Pagos",
    extraField: { key: "disputedAmount", label: "Monto en disputa (USD)", placeholder: "500", type: "number" }
  },
  { id: "underwriting", label: "Estatus de Aplicación / Underwriting" },
  { id: "credit_repair", label: "Reparación de Crédito" },
  { id: "onboarding", label: "Onboarding / Nuevo Broker" },
  { id: "marketing", label: "Marketing y Contenido" },
  { id: "corporate_tax", label: "Taxes / Inmigración / Corporativo" }
];

export function getTicketCategoryLabel(id: string): string {
  return TICKET_CATEGORIES.find((c) => c.id === id)?.label || id;
}

export function getTicketCategoryDef(id: string): TicketCategoryDef | undefined {
  return TICKET_CATEGORIES.find((c) => c.id === id);
}
