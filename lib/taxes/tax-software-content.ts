/**
 * Contenido del Software de Taxes E360 (marca blanca).
 *
 * Fuente única para la página pública (/taxes) y la pestaña "Software de Taxes"
 * del Hub, para que ambas digan siempre lo mismo.
 *
 * PENDIENTES (ver TAX_SOFTWARE_PENDING):
 *  - Precios de las 3 modalidades de la temporada: `price: null` se muestra
 *    como "Por confirmar".
 *  - Destino de los botones "Comprar" y "Prueba gratis": `null` hace que el
 *    botón lleve a la sección de planes en lugar de a un link roto.
 */

export interface TaxPlan {
  id: string;
  name: string;
  /** Texto corto bajo el nombre. */
  tagline: string;
  /** Precio en USD. `null` = pendiente de confirmar por el equipo. */
  price: number | null;
  /** Ej. "por temporada". Solo se muestra si hay precio. */
  priceNote?: string;
  highlights: string[];
  featured?: boolean;
}

export interface TaxFeature {
  icon:
    | "ScanLine"
    | "Users"
    | "PenLine"
    | "Landmark"
    | "Smartphone"
    | "FileText"
    | "Lock"
    | "Languages";
  title: string;
  description: string;
}

export interface TaxFaq {
  question: string;
  answer: string;
}

/** Destinos de los botones principales. `null` = pendiente de definir. */
export const TAX_SOFTWARE_CTA: { buyUrl: string | null; trialUrl: string | null } = {
  buyUrl: null,
  trialUrl: null,
};

export const TAX_SOFTWARE_PENDING = {
  pricing: true,
  ctas: TAX_SOFTWARE_CTA.buyUrl === null || TAX_SOFTWARE_CTA.trialUrl === null,
};

export const TAX_HERO = {
  eyebrow: "E360 • Temporada de Taxes",
  title: "Tu oficina de taxes,",
  titleAccent: "100% en la nube.",
  subtitle:
    "Software profesional de preparación de impuestos con la marca Emprende 360. Prepara, firma y transmite declaraciones individuales y de negocios desde cualquier lugar, con capacitación y soporte técnico en español.",
};

export const TAX_TRUST_BADGES: string[] = [
  "Transmisión electrónica (e-file) al IRS",
  "Formularios de los 50 estados",
  "E-file incluido",
  "Soporte técnico en español",
];

export const TAX_AI_BLOCK = {
  eyebrow: "Asistente de IA integrado",
  title: "Menos captura manual. Más declaraciones.",
  description:
    "Sube los documentos del cliente y el asistente de IA extrae los datos para que tu equipo solo tenga que revisar y completar la declaración. Reconoce los formularios más comunes y mantiene la información consistente.",
  documents: ["W-2", "1099", "K-1", "1098", "Y más"],
};

export const TAX_FEATURES: TaxFeature[] = [
  {
    icon: "Users",
    title: "Multiusuario con permisos",
    description:
      "Agrega a los preparadores de tu equipo y controla qué puede ver y hacer cada uno dentro del sistema.",
  },
  {
    icon: "PenLine",
    title: "Firmas electrónicas",
    description:
      "Recoge firmas digitales de tus clientes sin imprimir, escanear ni perseguir papeles.",
  },
  {
    icon: "FileText",
    title: "Portal del contribuyente",
    description:
      "Tus clientes suben sus documentos y consultan el estatus de su declaración en línea.",
  },
  {
    icon: "Landmark",
    title: "Productos bancarios",
    description:
      "Cobra tus honorarios de preparación directamente del reembolso del cliente, de forma segura.",
  },
  {
    icon: "ScanLine",
    title: "Modo entrevista o por formulario",
    description:
      "El modo entrevista guía paso a paso a los preparadores nuevos; el modo por formulario da control total a los experimentados.",
  },
  {
    icon: "Smartphone",
    title: "Desde cualquier dispositivo",
    description:
      "Computadora, laptop, tablet o teléfono. Sin instalaciones: solo necesitas conexión a internet.",
  },
  {
    icon: "Lock",
    title: "Seguridad y respaldo",
    description:
      "Información cifrada, respaldos automáticos y actualizaciones con los últimos cambios de la ley tributaria.",
  },
  {
    icon: "Languages",
    title: "Hecho para preparadores hispanos",
    description:
      "Plataforma pensada para oficinas que atienden a la comunidad hispana, con acompañamiento en español.",
  },
];

export const TAX_FORMS = {
  individual: ["1040", "1040-NR"],
  business: [
    "1120",
    "1120-S",
    "1065",
    "1041",
    "990",
    "2290",
    "720",
    "706",
    "709",
    "5500",
    "8849",
  ],
  note: "Formularios federales y estatales de los 50 estados, actualizados para la temporada fiscal vigente.",
};

/** Lo que incluyen TODAS las modalidades (no depende del precio). */
export const TAX_PLAN_COMMON: string[] = [
  "Declaraciones individuales y de negocios",
  "Formularios de los 50 estados",
  "E-file incluido",
  "Actualizaciones automáticas",
  "Curso del software con la marca E360",
  "Soporte técnico en español",
];

/**
 * Las 3 modalidades de la temporada. Nombres, descripciones y precios se
 * reemplazan cuando llegue el documento oficial de precios.
 */
export const TAX_PLANS: TaxPlan[] = [
  {
    id: "modalidad-1",
    name: "Modalidad 1",
    tagline: "Detalles por confirmar",
    price: null,
    highlights: ["Incluye todo lo básico del software"],
  },
  {
    id: "modalidad-2",
    name: "Modalidad 2",
    tagline: "Detalles por confirmar",
    price: null,
    highlights: ["Incluye todo lo básico del software"],
    featured: true,
  },
  {
    id: "modalidad-3",
    name: "Modalidad 3",
    tagline: "Detalles por confirmar",
    price: null,
    highlights: ["Incluye todo lo básico del software"],
  },
];

export const TAX_OFFICE_TEASER = {
  eyebrow: "Próximamente",
  title: "Oficina Virtual E360",
  description:
    "Muy pronto, dentro del mismo Hub: un panel para ver lo cobrado, los reembolsos, tus casos abiertos, leads y clientes, y gestionar comisiones y pagos, todo con la marca Emprende 360.",
  items: ["Panel de cobros y reembolsos", "Casos, leads y clientes", "Comisiones y pagos", "Soporte integrado"],
};

export const TAX_TRAINING = {
  title: "No estás solo en la temporada",
  description:
    "Te acompañamos desde la configuración hasta tu primera declaración transmitida.",
  items: [
    {
      title: "Curso del software",
      description: "Entrenamiento paso a paso de la plataforma con la nueva imagen de Emprende 360.",
    },
    {
      title: "Configuración del ERO",
      description: "Te guiamos en la configuración técnica necesaria para poder transmitir declaraciones.",
    },
    {
      title: "Soporte técnico",
      description: "Un equipo dedicado a resolver tus dudas de uso de la plataforma durante la temporada.",
    },
  ],
};

export const TAX_FAQS: TaxFaq[] = [
  {
    question: "¿Qué es el Software de Taxes E360?",
    answer:
      "Es un software profesional de preparación de impuestos en la nube, con la marca Emprende 360, para preparadores y oficinas que trabajan declaraciones individuales y de negocios.",
  },
  {
    question: "¿Necesito instalar algo en mi computadora?",
    answer:
      "No. Funciona 100% en la nube desde el navegador. Solo necesitas una conexión a internet estable.",
  },
  {
    question: "¿Qué tipos de declaraciones puedo preparar?",
    answer:
      "Declaraciones individuales (1040 y 1040-NR) y de negocios (1120, 1120-S, 1065, 1041 y más), con formularios estatales de los 50 estados.",
  },
  {
    question: "¿Necesito un EFIN para transmitir declaraciones?",
    answer:
      "Sí. Para transmitir electrónicamente al IRS necesitas tu PTIN y un EFIN vigente como ERO. Si aún no lo tienes, nuestro equipo te orienta en el proceso de configuración.",
  },
  {
    question: "¿Puedo agregar a otros preparadores de mi oficina?",
    answer:
      "Sí. La plataforma es multiusuario y te permite controlar qué puede ver y hacer cada miembro de tu equipo.",
  },
  {
    question: "¿Incluye capacitación?",
    answer:
      "Sí. Incluye un curso del uso del software con la marca E360 y acompañamiento para la configuración del ERO, además de soporte técnico durante la temporada.",
  },
  {
    question: "¿Cuánto cuesta?",
    answer:
      "Estamos por publicar los precios de las modalidades de esta temporada. Mientras tanto, contacta a nuestro equipo para recibir la información en cuanto esté disponible.",
  },
];
