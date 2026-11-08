import { TaxFormField, TaxFormTemplate } from "../../types";

// Catálogo de plantillas iniciales del constructor de Formularios y Contratos
// — cada una crea una copia independiente en la oficina del broker al darle
// "Add to my office", igual que el "Template gallery" de la plataforma
// externa (Luxora) que esto reemplaza.

let fieldCounter = 0;
function field(partial: Omit<TaxFormField, "id">): TaxFormField {
  fieldCounter += 1;
  return { id: `gallery-field-${fieldCounter}`, ...partial };
}

const FILING_STATUS_OPTIONS = ["Single", "Married Filing Jointly", "Married Filing Separately", "Head of Household", "Qualifying Widow(er)"];

export interface GalleryTemplate {
  id: string;
  title: string;
  serviceType: TaxFormTemplate["serviceType"];
  fieldCount: number;
  fields: TaxFormField[];
}

export const FORM_GALLERY_TEMPLATES: GalleryTemplate[] = [
  {
    id: "tpl-personal-tax-intake",
    title: "Personal Tax Intake",
    serviceType: "1040_personal",
    fields: [
      field({ type: "dropdown", label: "Filing status", required: true, options: FILING_STATUS_OPTIONS }),
      field({ type: "number", label: "Number of dependents", required: false }),
      field({ type: "yes_no", label: "Did you file last year?", required: false }),
    ],
    fieldCount: 3,
  },
  {
    id: "tpl-self-employed-intake",
    title: "Self-Employed / 1099 Intake",
    serviceType: "schedule_c",
    fields: [
      field({ type: "dropdown", label: "Filing status", required: true, options: FILING_STATUS_OPTIONS }),
      field({ type: "number", label: "Number of dependents", required: false }),
      field({ type: "yes_no", label: "Did you file last year?", required: false }),
      field({ type: "currency", label: "Business income", required: true }),
      field({ type: "currency", label: "Business expenses", required: false }),
      field({ type: "number", label: "1099 forms received", required: false }),
      field({ type: "short_text", label: "Business name", required: false }),
    ],
    fieldCount: 7,
  },
  {
    id: "tpl-business-tax-intake",
    title: "Business Tax Intake",
    serviceType: "1120_corp",
    fields: [
      field({ type: "dropdown", label: "Entity type", required: true, options: ["LLC", "S-Corp", "C-Corp", "Partnership"] }),
      field({ type: "short_text", label: "EIN", required: true }),
      field({ type: "date", label: "Fiscal year end", required: false }),
      field({ type: "currency", label: "Estimated annual revenue", required: false }),
    ],
    fieldCount: 4,
  },
  {
    id: "tpl-business-formation-intake",
    title: "Business Formation Intake",
    serviceType: "custom",
    fields: [
      field({ type: "dropdown", label: "Entity you want to form", required: true, options: ["LLC", "S-Corp", "C-Corp", "Partnership", "Sole Proprietorship"] }),
      field({ type: "short_text", label: "State of formation", required: true }),
      field({ type: "long_text", label: "Business purpose / description", required: false }),
      field({ type: "short_text", label: "Proposed business name", required: false }),
    ],
    fieldCount: 4,
  },
  {
    id: "tpl-payroll-setup-intake",
    title: "Payroll Setup Intake",
    serviceType: "custom",
    fields: [
      field({ type: "number", label: "Number of employees on payroll", required: true }),
      field({ type: "dropdown", label: "Pay frequency", required: true, options: ["Weekly", "Biweekly", "Semi-monthly", "Monthly"] }),
      field({ type: "short_text", label: "State", required: false }),
    ],
    fieldCount: 3,
  },
  {
    id: "tpl-bookkeeping-intake",
    title: "Bookkeeping Intake",
    serviceType: "custom",
    fields: [
      field({ type: "short_text", label: "Current accounting software", required: false }),
      field({ type: "number", label: "Monthly transaction volume (approx.)", required: false }),
      field({ type: "number", label: "Bank accounts to connect", required: false }),
    ],
    fieldCount: 3,
  },
  {
    id: "tpl-service-agreement",
    title: "Service Agreement",
    serviceType: "service_agreement",
    fields: [
      field({ type: "currency", label: "Agreed fee", required: true }),
      field({ type: "long_text", label: "Services included", required: true }),
      field({ type: "yes_no", label: "I agree to the terms above", required: true }),
    ],
    fieldCount: 3,
  },
];
