export interface GuideEntry {
  slug: string;
  title: string;
  description: string;
  /** Ruta en Firebase Storage. El PDF real vive en el repo bajo "Docs y Audios/" y
   * se sube una sola vez vía scripts/upload-guides.ts. */
  storagePath: string;
}

export const GUIDES: GuideEntry[] = [
  { slug: "mca", title: "Guía MCA para Brokers", description: "Detalles y requisitos para préstamos basados en ingresos (Merchant Cash Advance).", storagePath: "guides/mca.pdf" },
  { slug: "sba", title: "Guía Préstamos SBA", description: "Proceso y requisitos para préstamos respaldados por la Small Business Administration.", storagePath: "guides/sba.pdf" },
  { slug: "fondeo", title: "Guía de Fondeo", description: "Información general sobre opciones de fondeo empresarial.", storagePath: "guides/fondeo.pdf" },
  { slug: "bienes-raices", title: "Guía Financiamiento de Bienes Raíces", description: "Requisitos para préstamos hipotecarios y de inversión inmobiliaria.", storagePath: "guides/bienes-raices.pdf" },
  { slug: "registro-empresas", title: "Guía Registro de Empresas", description: "Paso a paso para la incorporación de LLCs y corporaciones.", storagePath: "guides/registro-empresas.pdf" },
  { slug: "credito-empresarial", title: "Cheatsheet Crédito Empresarial", description: "Resumen rápido para construir y obtener crédito para negocios.", storagePath: "guides/credito-empresarial.pdf" },
  { slug: "credito-empresarial-script", title: "Cheatsheet Crédito Empresarial y Script de Ventas", description: "Resumen rápido de crédito empresarial más guión de venta sugerido.", storagePath: "guides/credito-empresarial-script.pdf" },
  { slug: "done-for-you", title: "Guía Done For You", description: "Servicios gestionados directamente por el equipo interno.", storagePath: "guides/done-for-you.pdf" },
  { slug: "proceso-broker-credito", title: "Proceso del Broker de Crédito", description: "Flujo de trabajo para brokers de crédito empresarial.", storagePath: "guides/proceso-broker-credito.pdf" },
  { slug: "reparacion-credito-clientes", title: "Reparación de Crédito para Clientes", description: "Detalles del servicio de reparación de crédito para clientes.", storagePath: "guides/reparacion-credito-clientes.pdf" },
  { slug: "precios-reparacion-credito", title: "Guía de Precios — Reparación de Crédito", description: "Tabla de precios y comisiones para reparación de crédito.", storagePath: "guides/precios-reparacion-credito.pdf" },
  { slug: "config-ghl-pipelines", title: "Guía Configuración GHL Pipelines", description: "Instrucciones para configurar los embudos en StartPoint CRM (GoHighLevel).", storagePath: "guides/config-ghl-pipelines.pdf" },
  { slug: "primeros-compradores", title: "Programas Primeros Compradores (50 Estados)", description: "Programas de asistencia para primeros compradores de vivienda a nivel nacional.", storagePath: "guides/primeros-compradores.pdf" },
  { slug: "lead-flow", title: "Cheatsheet Lead Flow", description: "Diagrama de flujo de cómo manejar y procesar leads entrantes.", storagePath: "guides/lead-flow.pdf" },
  { slug: "consolidacion-synchrony", title: "Cheatsheet Consolidación Synchrony", description: "Detalles sobre opciones de consolidación de deudas con Synchrony.", storagePath: "guides/consolidacion-synchrony.pdf" },
  { slug: "prestamos-empresariales", title: "Cheatsheet Préstamos Empresariales", description: "Resumen rápido de opciones de préstamos empresariales.", storagePath: "guides/prestamos-empresariales.pdf" },
  { slug: "onboarding-broker", title: "Descripción de Onboarding para Broker", description: "Descripción general del proceso de onboarding para nuevos brokers.", storagePath: "guides/onboarding-broker.pdf" }
];

export function getGuideBySlug(slug: string): GuideEntry | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
