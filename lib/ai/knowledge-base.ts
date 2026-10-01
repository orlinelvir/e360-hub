import { adminDb } from "@/lib/firebase-admin";
import { GUIDES } from "./guides";
import { VIDEOS } from "./videos";
import { getEffectiveServicesCatalog } from "@/lib/services/service-catalog-service";

export interface FaqEntry {
  question: string;
  answer: string;
}

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

export const FALLBACK_FAQS: FaqEntry[] = [
  {
    question: "¿Cómo accedo a mi subcuenta StartPoint CRM?",
    answer: "Cada broker autorizado de Emprende 360 recibe un correo de invitación a su subcuenta de CRM con su Location ID exclusivo. Si no has recibido la invitación, abre un ticket de soporte o solicita el reenvío desde la sección 'Mi Perfil'."
  },
  {
    question: "¿Cuándo y cómo recibo el pago de mis comisiones?",
    answer: "Las comisiones se procesan los días viernes de cada semana mediante la vía seleccionada en tu perfil (Depósito Directo / ACH o Zelle). Para préstamos fondeados o servicios cerrados hasta el miércoles anterior."
  },
  {
    question: "¿Qué documentación necesita un cliente para Préstamo de Negocio (MCA)?",
    answer: "El cliente debe presentar: 1) Últimos 4 estados de cuenta bancarios de la empresa, 2) Identificación oficial vigente del dueño, 3) Número EIN y Voided Check de la cuenta corporativa."
  },
  {
    question: "¿Puedo referir clientes si no tengo licencias de seguros?",
    answer: "¡Sí! Como broker registrado en E360 Hub puedes referir clientes de seguros de auto, casa o comercial. Si no cuentas con licencia personal, nuestro departamento de suscripción procesa el caso y tú recibes un honorario por referido."
  },
  {
    question: "¿Qué hago si mi cliente figura con fondos insuficientes (NSF) excesivos?",
    answer: "Si el cliente tiene más de 3-4 marcajes de NSF en un mismo mes, sugerimos esperar a cerrar el ciclo bancario actual manteniendo saldo positivo antes de someter la aplicación a los bancos."
  },
  {
    question: "¿Cuáles son los horarios de clases en vivo por Zoom?",
    answer: "Las clases y entrenamientos en vivo de E360 se imparten por Zoom en los siguientes horarios: Lunes 7:00 PM EST, Martes 7:00 PM EST, Miércoles 12:00 PM EST y Domingos 10:00 AM EST."
  },
  {
    question: "¿Cómo accedo a los cursos y academia de E360?",
    answer: "Puedes acceder a todos los módulos y entrenamientos en la Biblioteca E360 en https://E360library.com usando tu correo electrónico registrado como broker."
  },
  {
    question: "¿Puedo tener formularios con mi propia marca (White-Label)?",
    answer: "Cada subcuenta de broker incluye formularios de Creación de LLC y Reparación de Crédito personalizados con su logo. Para servicios de financiamiento comercial y préstamos, se pueden conectar formularios de fondeo marca blanca. Sin embargo, los formularios de Seguros NO se comparten (los casos de seguros se someten y procesan centralmente con el departamento de suscripción de E360)."
  },
  {
    question: "¿Cómo contacto a Soporte General (dudas de plataforma o técnicas)?",
    answer: "El Soporte General de primer filtro lo atiende Mario por SMS o llamada al +1 (917) 284-5636. Horario: Lunes 9am–6pm, Martes a Viernes 9am–10pm, Sábado 10am–4pm."
  },
  {
    question: "¿Con quién consulto dudas del CRM o del proceso de Reparación de Crédito?",
    answer: "El CRM (StartPoint) y el seguimiento de Reparación de Crédito los atiende Fernando por SMS o llamada al +1 (201) 365-2055."
  },
  {
    question: "¿Con quién consulto el estatus de aplicaciones financieras o financiamientos?",
    answer: "El estatus de aplicaciones financieras generales, underwriting y comisiones se consulta directamente con Anthony (Departamento de Aplicaciones) por SMS o llamada al +1 (747) 966-4788."
  },
  {
    question: "¿Cómo se gestionan los servicios de Taxes e Inmigración?",
    answer: "Los servicios de Taxes (declaración personal/corporativa, ITIN) e Inmigración (USCIS, permisos de trabajo) se atienden con Valentina (llamadas, textos o WhatsApp al +1 (908) 733-2891), o por Zoom abierto Lunes a Viernes de 10am a 6pm: https://meet.google.com/gbk-bzki-kcd?pli=1"
  },
  {
    question: "¿Con quién hablo sobre el proceso de inducción/onboarding de un nuevo broker?",
    answer: "El Departamento de Inducción lo atiende Laura por SMS o llamada al +1 (775) 369-4853."
  },
  {
    question: "¿Con quién hablo sobre material de mercadeo o campañas?",
    answer: "El Departamento de Mercadeo lo atiende Samantha por SMS o llamada al +1 (786) 481-0166."
  },
  {
    question: "¿Con quién consulto información general sobre productos de préstamos?",
    answer: "JP atiende consultas generales de préstamos, exclusivamente por WhatsApp al +1 (862) 424-4738."
  },
  {
    question: "¿Con quién hablo sobre préstamos hipotecarios o bienes raíces?",
    answer: "Pete atiende préstamos hipotecarios. Envía un texto antes de llamar al +1 (732) 362-1347, o agenda una llamada directamente: https://api.leadconnectorhq.com/widget/booking/DbvDERXMrAKQIURAyumH"
  },
  {
    question: "¿Cómo registro una LLC o Corporación para un cliente?",
    answer: "Puedes someter el registro de compañía directamente desde el Hub, en la sección 'Inicio / Servicios' → Registro de Compañía. Los documentos y EIN se entregan en 24 a 72 horas hábiles."
  },
  {
    question: "¿En cuánto tiempo hay respuesta de la aplicación de préstamo o seguro?",
    answer: "Préstamos: precalificación en 24-48 horas, aprobación y fondeo en 3-7 días hábiles según el tipo. Seguros: el agente contacta al cliente en 24-48 horas hábiles (24-72 para seguros de vida y salud). Revisa el SLA en el catálogo de cada servicio."
  },
  {
    question: "¿Dónde encuentro el enlace del formulario de reparación de crédito, préstamo o seguro?",
    answer: "Todos los formularios oficiales están en el Hub → Inicio / Servicios. Selecciona el servicio que necesitas y usa 'Abrir Formulario' una vez que completes las 3 casillas de confirmación. Para Reparación de Crédito: https://api.leadconnectorhq.com/widget/form/hXr9MAZMR8AHID3LC5cg"
  },
  {
    question: "¿Cuáles son los requisitos de cada préstamo?",
    answer: "Cada servicio tiene sus requisitos documentados en el Hub → Inicio / Servicios → selecciona el servicio → sección 'Requisitos que el Cliente debe entregar'. Ahí verás documentos, score mínimo y condiciones específicas."
  },
  {
    question: "¿Puedo ofrecer préstamos a clientes fuera del país?",
    answer: "Los préstamos E360 están disponibles para negocios registrados en Estados Unidos (LLC, Corp, etc.). Si el cliente está fuera del país, primero necesita una entidad registrada en USA antes de aplicar a fondeo."
  },
  {
    question: "¿Cuánto puedo cobrar por reparación de crédito o registro de compañía?",
    answer: "Reparación de Crédito: tú cobras el 100% del pago de inicio y $50 mensuales. Registro de Compañía: comisión fija de $150 sobre honorarios base. Las comisiones exactas por servicio están en el catálogo del Hub."
  },
  {
    question: "No me aparece en mi CRM la aplicación que sometí",
    answer: "Las aplicaciones enviadas mediante formularios externos no aparecen automáticamente en 'Mis Clientes'. Si la sometiste desde el Hub, abre un ticket en Soporte VIP → Crédito & Fondeo para rastrearla."
  },
  {
    question: "Tengo un cliente para préstamo, ¿con quién puedo hablar?",
    answer: "El Departamento de Aplicaciones lo atiende Anthony por SMS o llamada al +1 (747) 966-4788. Para préstamos hipotecarios, contacta a Pete al +1 (732) 362-1347."
  },
  {
    question: "¿Dónde están los enlaces de los bancos con los que trabajamos?",
    answer: "Los enlaces de formularios por servicio están en el catálogo del Hub. Los bancos y prestamistas específicos se gestionan directamente por el departamento de underwriting."
  },
  {
    question: "¿Dónde puedo obtener el reporte de crédito del cliente?",
    answer: "Puedes obtenerlo de IdentityIQ, SmartCredit, MyFreeScoreNow, MyScoreIQ o PrivacyGuard. Si el cliente tiene ITIN en lugar de SSN, usa el TOKEN en lugar de contraseña."
  },
  {
    question: "¿Cómo cancelo la membresía de Identity IQ?",
    answer: "Contacta directamente al soporte de IdentityIQ desde su portal o llama al número de servicio al cliente. Verifica si tu cuenta está en member.identityiq.com o www.identityiq.com."
  },
  {
    question: "¿Cuánto tiempo se demora en procesar una solicitud de préstamo?",
    answer: "MCA (fondeo rápido): aprobación en 24-48 horas y fondeo en 1-3 días hábiles. Préstamo convencional: 3-7 días hábiles. Hipotecario: 30-45 días. DSCR/Dinero Duro: 5-30 días."
  },
  {
    question: "Me da error al subir el reporte de crédito, ¿quién me ayuda?",
    answer: "Abre un ticket en Soporte VIP → Crédito & Fondeo describiendo el error. También puedes contactar a Fernando (CRM y Reparación de Crédito) al +1 (201) 365-2055."
  },
  {
    question: "¿Hay una guía de precios que puedo cobrar a mis clientes por cada servicio?",
    answer: "La comisión que tú cobras está detallada en el catálogo del Hub por servicio. El precio final al cliente lo defines tú como broker considerando tu costo base. Si necesitas material de ventas, revisa la sección Recursos del Hub."
  },
  {
    question: "¿Dónde están todos los formularios disponibles?",
    answer: "Todos los formularios oficiales por servicio están en el catálogo del Hub → Inicio / Servicios. Si notas que falta alguno, abre un ticket en Soporte VIP → CRM & Plataforma."
  }
];

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
