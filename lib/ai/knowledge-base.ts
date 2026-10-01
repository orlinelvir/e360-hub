import { adminDb } from "@/lib/firebase-admin";
import { GUIDES } from "./guides";
import { VIDEOS } from "./videos";
import { getEffectiveServicesCatalog } from "@/lib/services/service-catalog-service";

// FaqEntry y FALLBACK_FAQS viven en un archivo sin dependencias de Firebase
// para que el script de seed pueda importarlos sin arrancar firebase-admin.
export type { FaqEntry } from "./fallback-faqs";
export { FALLBACK_FAQS } from "./fallback-faqs";
import { type FaqEntry, FALLBACK_FAQS } from "./fallback-faqs";

/**
 * Devuelve las FAQs como arreglo estructurado (usado por la UI de Preguntas
 * Frecuentes del Hub). Intenta leer de Firestore; si falla o está vacío, cae
 * al fallback hardcodeado para que la UI nunca quede en blanco.
 */
export async function getFaqs(): Promise<FaqEntry[]> {
  let faqs = [...FALLBACK_FAQS];

  try {
    if (adminDb) {
      const snap = await adminDb.collection("supportKnowledge").get();
      if (!snap.empty) {
        const firestoreFaqs: FaqEntry[] = snap.docs.map(doc => {
          const data = doc.data();
          return {
            question: data.question || "",
            answer: data.answer || ""
          };
        }).filter(f => f.question && f.answer);
        if (firestoreFaqs.length > 0) {
          faqs = firestoreFaqs;
        }
      }
    }
  } catch (error) {
    console.error("Error cargando FAQs desde Firestore:", error);
  }

  return faqs;
}

const GUIDES_REFERENCE = `
DOCUMENTOS/GUÍAS PDF DISPONIBLES (usa el SLUG exacto entre corchetes en "relevantGuideSlugs" cuando
uno de estos documentos responda directamente la pregunta del broker; no lo inventes ni lo modifiques):
${GUIDES.map((g) => `- [${g.slug}] ${g.title}: ${g.description}`).join("\n")}
`;

const VIDEOS_REFERENCE = `
VIDEOS DE CLASES/CAPACITACIONES DISPONIBLES (usa el SLUG exacto entre corchetes en "relevantVideoSlugs"
SOLO cuando uno de estos videos responda directamente lo que pregunta el broker; no lo inventes ni lo
modifiques). Estos son grabaciones puntuales de clases de la Biblioteca E360 (e360library.com), agrupadas
por tema porque hay muchas clases repetidas semanalmente sobre el mismo tema — este es el video más
representativo de cada tema:
${VIDEOS.map((v) => `- [${v.slug}] (${v.category}) ${v.title}: ${v.description}`).join("\n")}

Para preguntas sobre temas de la Biblioteca E360 que NO estén en esta lista (ej. lecciones fijas de
inmigración/impuestos como Asilo, Ciudadanía, Permiso de Trabajo, o cursos base de "Curso Express"),
NO inventes un slug: simplemente indica al broker que puede encontrar esa lección accediendo a
https://e360library.com con su correo registrado.
`;

/**
 * Obtiene el conocimiento completo para inyectar en el prompt del IA.
 */
export async function getKnowledgeBaseContext(): Promise<string> {
  let faqs = [...FALLBACK_FAQS];

  try {
    if (adminDb) {
      const snap = await adminDb.collection("supportKnowledge").get();
      if (!snap.empty) {
        const firestoreFaqs: FaqEntry[] = snap.docs.map(doc => {
          const data = doc.data();
          return {
            question: data.question || "",
            answer: data.answer || ""
          };
        });
        if (firestoreFaqs.length > 0) {
          faqs = firestoreFaqs;
        }
      }
    }
  } catch (error) {
    console.error("Error cargando FAQs desde Firestore:", error);
  }

  const faqText = faqs.map(f => `P: ${f.question}\\nR: ${f.answer}`).join("\\n\\n");

  // Catálogo con los overrides de precio/requisitos/proceso del admin ya
  // aplicados — si el admin edita algo desde "Catálogo de Servicios", el
  // Chat IA lo refleja de inmediato, sin deploy.
  const effectiveCatalog = await getEffectiveServicesCatalog();
  const servicesText = effectiveCatalog.map(s => `
SERVICIO: ${s.title}
Categoría: ${s.category}
Descripción: ${s.description}
Requisitos: ${s.requirements.join("; ")}
Proceso: ${s.process.join("; ")}
Comisión: ${s.comission}
Tiempo estimado: ${s.timeframe}
Departamento de escalación: ${s.centralDepartment}
`).join("\\n");

  return `
--- BASE DE CONOCIMIENTO (FAQs) ---
${faqText}

--- CATÁLOGO DE SERVICIOS Y COMISIONES ---
${servicesText}

--- GUÍAS Y RECURSOS ---
${GUIDES_REFERENCE}

--- VIDEOS DE CAPACITACIÓN ---
${VIDEOS_REFERENCE}
`;
}
