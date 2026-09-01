import { adminDb } from "@/lib/firebase-admin";
import { servicesData } from "@/app/hub/broker-onboarding/data/services";

export interface FaqEntry {
  question: string;
  answer: string;
}

const FALLBACK_FAQS: FaqEntry[] = [
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
    question: "¿Cómo contacto a Soporte VIP General o Reparación de Crédito?",
    answer: "El Soporte General y seguimiento de Reparación de Crédito es atendido directamente por Fernando (Gerente General) exclusivamente por SMS al +1 (681) 236-1239 en dos horarios: Canal 1 de 2:00 PM a 10:00 PM EST y Canal 2 de 9:00 AM a 3:00 PM EST."
  },
  {
    question: "¿Con quién consulto el estatus de aplicaciones financieras o financiamientos?",
    answer: "El estatus de aplicaciones financieras generales, underwriting y comisiones se consulta directamente con Anthony Elvir al teléfono/WhatsApp: +1 (747) 966-4788."
  },
  {
    question: "¿Cómo se gestionan los servicios de Taxes e Inmigración?",
    answer: "Los servicios de Taxes (declaración personal/corporativa, ITIN) e Inmigración (USCIS, permisos de trabajo) se atienden mediante cita personalizada con nuestro aliado especializado RL MultiServices (teléfono/WhatsApp: +1 (908) 733-2891 o agendando en https://calendly.com/servicios-rlhispanoservices/45min)."
  },
  {
    question: "¿Cómo registro una LLC o Corporación para un cliente?",
    answer: "Puedes someter el registro de compañía directamente desde el Hub utilizando el formulario oficial de Registro de LLC (https://api.leadconnectorhq.com/widget/form/blLUIvstRr21a2qsPZy7). Los documentos y EIN se entregan en 24 a 72 horas hábiles."
  }
];

const GUIDES_REFERENCE = `
REFERENCIAS DE GUÍAS Y PDF DISPONIBLES EN EL HUB:
- Guia MCA: Detalles y requisitos para préstamos basados en ingresos (Merchant Cash Advance).
- Guia SBA: Proceso y requisitos para préstamos respaldados por la Small Business Administration.
- Guia Fondeo: Información general sobre opciones de fondeo empresarial.
- Guia Bienes Raices: Requisitos para préstamos hipotecarios y de inversión inmobiliaria.
- Guia Registro de Empresas: Paso a paso para la incorporación de LLCs y corporaciones.
- Cheatsheet Credito Empresarial: Resumen rápido para construir y obtener crédito para negocios.
- Guia Done For You: Servicios gestionados directamente por el equipo interno.
- Proceso Broker Credito: Flujo de trabajo para brokers de crédito empresarial.
- Reparacion Credito Clientes: Detalles del servicio de reparación de crédito para clientes.
- Guia Precios Broker Reparacion: Tabla de precios y comisiones para reparación de crédito.
- Guia Configuracion GHL Pipelines: Instrucciones para configurar los embudos en StartPoint CRM (GoHighLevel).
- Guia Primeros Compradores 50 Estados: Programas de asistencia para primeros compradores de vivienda a nivel nacional.
- Cheatsheet Lead Flow: Diagrama de flujo de cómo manejar y procesar leads entrantes.
- Cheatsheet Consolidacion Synchrony: Detalles sobre opciones de consolidación de deudas con Synchrony.
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
  
  const servicesText = servicesData.map(s => `
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
`;
}
