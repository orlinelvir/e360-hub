// Catálogo de documentos de USO INTERNO DEL STAFF — nunca expuestos al broker
// ni al asistente de IA que le habla al broker (ver lib/ai/guides.ts para el
// catálogo público). La descarga pasa por app/api/staff-guides/[slug]/route.ts,
// que exige sesión autenticada y bloquea explícitamente el rol "broker".

export interface StaffGuideEntry {
  slug: string;
  title: string;
  description: string;
  storagePath: string;
}

export const STAFF_GUIDES: StaffGuideEntry[] = [
  {
    slug: "induccion-staff",
    title: "Guía de Inducción E360 (Staff)",
    description: "Checklist paso a paso con guion sugerido para conducir la primera llamada de onboarding con el cliente.",
    storagePath: "staff-guides/induccion-staff.pdf"
  }
];

export function getStaffGuideBySlug(slug: string): StaffGuideEntry | undefined {
  return STAFF_GUIDES.find((g) => g.slug === slug);
}
