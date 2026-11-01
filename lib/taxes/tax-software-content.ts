/**
 * Contenido exhaustivo del Software de Taxes E360 (marca blanca).
 *
 * Fuente única de verdad para la página pública (/taxes) y la pestaña del Hub.
 * Incorpora todos los elementos clave de la industria (OLTPro y Luxora Tax):
 *  - Integración con los 5 bancos líderes y adelantos de reembolso (Refund Advances).
 *  - Asistente de IA con cláusula estricta de privacidad (no entrena modelos con SSN).
 *  - Suite de productividad: K-1 Import, Client Organizer, Portal del Contribuyente y Reportes.
 *  - Novedades del año tributario vigente (Schedule 1-A, Child Tax Credit, 1099-DA).
 *  - Garantía de 30 días y soporte 100% en español.
 */

export interface TaxPlan {
  id: string;
  name: string;
  tagline: string;
  price: number | null; // null = pendiente de confirmar
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
    | "Languages"
    | "Calculator"
    | "LayoutDashboard";
  title: string;
  description: string;
  badge?: string;
}

export interface TaxFaq {
  question: string;
  answer: string;
}

export interface BankPartner {
  name: string;
  tagline: string;
  website: string;
}

/** Destinos de los botones principales. null = pendiente de definir enlace final. */
export const TAX_SOFTWARE_CTA: { buyUrl: string | null; trialUrl: string | null } = {
  buyUrl: null,
  trialUrl: null,
};

export const TAX_SOFTWARE_PENDING = {
  pricing: true,
  ctas: TAX_SOFTWARE_CTA.buyUrl === null || TAX_SOFTWARE_CTA.trialUrl === null,
};

export const TAX_HERO = {
  eyebrow: "E360 • Temporada de Taxes 2025 - 2026",
  title: "Tu oficina de taxes profesional,",
  titleAccent: "100% en la nube y con IA.",
  subtitle:
    "El software de preparación tributaria más completo para el mercado hispano con la marca Emprende 360. Preparación individual y corporativa, firmas electrónicas ilimitadas, productos bancarios integrados con adelantos de dinero en 24h, y e-file directo al IRS.",
};

export const TAX_TRUST_BADGES: string[] = [
  "Proveedor de e-file autorizado por el IRS",
  "Formularios de los 50 estados (Federal y Estatal)",
  "E-filing incluido sin cargos ocultos",
  "Soporte técnico y capacitación en español",
  "Garantía de satisfacción de 30 días",
];

export const TAX_AI_BLOCK = {
  eyebrow: "Asistente de IA Integrado • Entrada de Datos Inteligente",
  title: "Menos tipeo manual. Más declaraciones cerradas.",
  description:
    "Convierte documentos fiscales en datos listos para transmitir en segundos. Nuestro motor de IA escanea e interpreta los documentos mientras tus preparadores revisan y validan antes de enviar. Automatización inteligente con total control humano.",
  privacyGuarantee:
    "Privacidad Blindada: Los documentos cargados se procesan exclusivamente para extraer datos. La información confidencial del cliente (SSN, ingresos) NUNCA se comparte ni se utiliza para entrenar modelos de IA.",
  humanOversight:
    "Supervisión Humana Total (Review & Approve): Ningún dato se somete a ciegas. Cada campo sugerido por la IA debe ser aprobado por el preparador antes de finalizar.",
  documents: ["Form W-2", "Form 1099 (NEC/MISC/K/DA)", "Form 1098", "Schedule K-1", "Licencias / IDs"],
};

export const TAX_BANK_SECTION = {
  eyebrow: "Alianzas Financieras Oficiales",
  title: "Productos Bancarios Integrados: Reembolsos Rápidos y Cero Cobros de Bolsillo",
  subtitle:
    "Facilita el pago a tus clientes y maximiza tus ingresos. Ofrece préstamos y adelantos de reembolso para que tus contribuyentes reciban su dinero sin esperar semanas al IRS.",
  highlights: [
    {
      title: "Adelantos de Reembolso (Refund Advances)",
      desc: "Ofrece a tus clientes préstamos inmediatos basados en su reembolso esperado, disponibles en 24 horas o el mismo día.",
    },
    {
      title: "Retención Automática de Honorarios",
      desc: "Tus honorarios profesionales de preparación se descuentan directamente del reembolso federal del cliente. Tu cliente paga $0 al momento de la cita.",
    },
    {
      title: "Múltiples Opciones de Desembolso",
      desc: "Depósito directo en cuenta, tarjeta prepagada o emisión de cheque en tu oficina.",
    },
  ],
  partners: [
    { name: "Santa Barbara TPG (SBTPG)", tagline: "Líder nacional en soluciones de reembolso", website: "https://www.sbtpg.com/" },
    { name: "Republic Bank", tagline: "Especialistas en adelantos y transferencias fiscales", website: "https://www.republicrefund.com/" },
    { name: "Refundo", tagline: "La plataforma bancaria preferida de la comunidad hispana", website: "https://refundo.com/" },
    { name: "Refund Advantage", tagline: "Procesamiento ágil con soporte de primer nivel", website: "https://www.refund-advantage.com/" },
    { name: "EPS Financial", tagline: "Soluciones bancarias de reembolso flexibles y seguras", website: "https://www.epstax.net/" },
  ],
};

export const TAX_FEATURES: TaxFeature[] = [
  {
    icon: "Users",
    title: "Multiusuario Sin Costo Extra",
    description:
      "Agrega a todos los preparadores y asistentes de tu oficina sin pagar costos adicionales por asiento. Configura permisos granulares para cada rol.",
    badge: "Sin Costo por Asiento",
  },
  {
    icon: "PenLine",
    title: "Firmas Electrónicas Ilimitadas",
    description:
      "Recoge firmas digitales con plena validez legal (Formularios 8878 y 8879 del IRS) desde la pantalla táctil del móvil del cliente o su computadora.",
  },
  {
    icon: "FileText",
    title: "Portal Móvil del Contribuyente",
    description:
      "Tus clientes pueden escanear y enviar sus documentos fiscales (W-2, 1099, IDs) directamente desde sus teléfonos inteligentes con tu marca.",
  },
  {
    icon: "Landmark",
    title: "Productos Bancarios Integrados",
    description:
      "Integrado con TPG, Republic Bank, Refundo, Refund Advantage y EPS para adelantos de reembolso instantáneos y cobro de honorarios directo.",
    badge: "5 Bancos Aliados",
  },
  {
    icon: "Calculator",
    title: "Importación de Schedule K-1",
    description:
      "Extrae e importa automáticamente datos complejos de sociedades y corporaciones S (K-1) directamente dentro de la Forma 1040 sin teclear.",
  },
  {
    icon: "ScanLine",
    title: "Modo Entrevista vs. Formularios",
    description:
      "El modo entrevista paso a paso guía con facilidad a los preparadores principiantes, mientras que el modo de formulario directo brinda máxima velocidad a los veteranos.",
  },
  {
    icon: "LayoutDashboard",
    title: "Client Organizer y Gestor Documental",
    description:
      "Cuestionarios previos para recopilar la información del cliente antes de su cita y archivo digital seguro de declaraciones pasadas.",
  },
  {
    icon: "Smartphone",
    title: "100% Cloud: Cero Instalaciones",
    description:
      "Accede desde cualquier navegador web en Mac, Windows, iPad, iPhone, Android o Chromebook. Toda tu oficina viaja contigo de forma segura.",
  },
  {
    icon: "Languages",
    title: "100% Bilingüe (Español / Inglés)",
    description:
      "Cambia el idioma de la interfaz, los formularios, los reportes y las cartas al cliente con un solo clic según las necesidades de tu comunidad.",
    badge: "Español / Inglés",
  },
  {
    icon: "Lock",
    title: "Seguridad Grado Bancario",
    description:
      "Cifrado de datos en tránsito y en reposo, cumplimiento estricto con los estándares de seguridad de datos del IRS y copias de seguridad automáticas.",
  },
];

export const TAX_FORMS = {
  individual: ["1040", "1040-NR", "1040-SR", "1040-X"],
  business: [
    "1120 (Corporaciones)",
    "1120-S (Corporaciones S)",
    "1065 (Sociedades / LLC)",
    "1041 (Fideicomisos y Patrimonios)",
    "990 (Organizaciones sin fines de lucro)",
    "2290 (Impuesto de Vehículos Pesados)",
    "720 (Impuestos Especiales)",
    "706 (Herencias)",
    "709 (Donaciones)",
    "5500 (Planes de Beneficios)",
    "8849 (Reclamo de Reembolso)",
    "8038-CP (Créditos de Bonos)",
  ],
  updates2025: [
    "Schedule 1-A: Nuevas deducciones para propinas calificadas, horas extra e intereses vehiculares.",
    "Child Tax Credit: Ajuste aumentado de crédito tributario por hijos hasta $2,200.",
    "Form 1099-DA: Cumplimiento mandatorio para reporte de transacciones de activos digitales y criptomonedas.",
  ],
  note: "Formularios federales y declaraciones estatales completas para los 50 estados, adaptados de forma continua ante cualquier cambio legislativo del IRS.",
};

/** Lo que incluyen TODAS las modalidades (no depende del precio). */
export const TAX_PLAN_COMMON: string[] = [
  "Declaraciones individuales y de negocios ilimitadas (según modalidad)",
  "Todos los 50 estados soportados sin costo adicional",
  "Transmisión electrónica (e-file) ilimitada al IRS",
  "Portal del contribuyente para subida de fotos y documentos",
  "Firmas electrónicas digitales integradas (IRS compliant)",
  "Integración con los 5 bancos de reembolso y adelantos",
  "Asistente de IA para extracción de W-2s y 1099s",
  "Importación directa de Schedule K-1",
  "Plataforma y soporte 100% bilingüe (Español e Inglés)",
  "Curso completo del software con la marca Emprende 360",
  "Asistencia técnica para configuración del ERO y transmisión",
  "Garantía de devolución de 30 días sin riesgos",
];

/**
 * Las 3 modalidades de la temporada. Nombres y precios se completan
 * al recibir el tarifario oficial.
 */
export const TAX_PLANS: TaxPlan[] = [
  {
    id: "modalidad-1",
    name: "Modalidad 1",
    tagline: "Ideal para preparadores independientes o que inician",
    price: null,
    highlights: [
      "Acceso completo a la plataforma en la nube",
      "Declaraciones individuales y corporativas",
      "E-file a los 50 estados incluido",
      "Portal del cliente y firmas digitales",
      "Capacitación inicial del software",
    ],
  },
  {
    id: "modalidad-2",
    name: "Modalidad 2",
    tagline: "La opción más popular para oficinas en crecimiento",
    price: null,
    highlights: [
      "Todo lo de la Modalidad 1",
      "Multiusuario para todo tu equipo de trabajo",
      "Productos bancarios y adelantos de dinero en 24h",
      "Asistente de IA para extracción automática de documentos",
      "Soporte técnico preferencial durante toda la temporada",
    ],
    featured: true,
  },
  {
    id: "modalidad-3",
    name: "Modalidad 3",
    tagline: "Para oficinas consolidadas de alto volumen y multiservicios",
    price: null,
    highlights: [
      "Todo lo de la Modalidad 2",
      "Capacidad ilimitada de preparadores y sedes",
      "Acompañamiento VIP en configuración técnica ERO",
      "Integración prioritaria con el ecosistema E360 Hub",
      "Acceso prioritario a la futura Oficina Virtual E360",
    ],
  },
];

export const TAX_OFFICE_TEASER = {
  eyebrow: "Próximamente Integrado al Hub",
  title: "Oficina Virtual E360: Tu Centro de Control de la Temporada",
  description:
    "Estamos construyendo dentro del mismo E360 Hub la oficina virtual definitiva para preparadores: un panel en vivo donde podrás auditar honorarios colectados, cheques de reembolso emitidos por los bancos, casos abiertos, seguimiento de leads y gestión automatizada de comisiones y pagos.",
  items: [
    "Dashboard de Reembolsos y Cobros",
    "Monitoreo de Casos y E-file Status",
    "Gestión de Comisiones por Preparador",
    "CRM de Clientes y Leads de Impuestos",
    "Soporte Directo con el Equipo Central E360",
  ],
};

export const TAX_TRAINING = {
  title: "Acompañamiento Profesional: No Estás Solo en la Temporada",
  description:
    "El éxito de tu oficina de taxes no solo depende del software, sino del respaldo técnico y operativo detrás. Te capacitamos desde el día uno.",
  items: [
    {
      title: "Curso del Software Emprende 360",
      description:
        "Entrenamiento exhaustivo paso a paso grabado con la nueva identidad de Emprende 360 para que tú y tus preparadores dominen el sistema en días.",
    },
    {
      title: "Configuración Técnica del ERO / EFIN",
      description:
        "Te guiamos en el enrutamiento de tu Electronic Return Originator (ERO), configuración de credenciales del IRS y validación de software para transmitir legalmente.",
    },
    {
      title: "Soporte Técnico Especializado en Español",
      description:
        "Un equipo de soporte técnico dedicado a resolver cualquier bloqueo con la plataforma, códigos de rechazo del IRS o dudas operativas de la temporada.",
    },
  ],
};

export const TAX_FAQS: TaxFaq[] = [
  {
    question: "¿Qué es el Software de Taxes E360 y en qué se diferencia?",
    answer:
      "Es una plataforma profesional de preparación tributaria en la nube personalizada con la marca Emprende 360. A diferencia de programas tradicionales que requieren descargas lentas o cobros por cada usuario, E360 funciona 100% en el navegador, incluye asistente de IA para lectura de W-2s, soporte en español y convenios directos con bancos de reembolso.",
  },
  {
    question: "¿Necesito instalar algún software o tener un servidor en mi oficina?",
    answer:
      "No. Cero instalaciones y cero requerimientos de redes locales. Funciona en Windows, Mac, iPads, tablets y teléfonos con cualquier navegador moderno.",
  },
  {
    question: "¿Cómo funcionan los Productos Bancarios y Adelantos de Reembolso?",
    answer:
      "El software está integrado directamente con las 5 instituciones bancarias líderes (SBTPG, Republic Bank, Refundo, Refund Advantage y EPS). Esto te permite ofrecer a tus clientes adelantos de reembolso (Refund Loans) desembolsados en 24 horas y cobrar tus honorarios automáticamente del cheque de reembolso, sin que el cliente deba pagar de su bolsillo.",
  },
  {
    question: "¿La inteligencia artificial compromete los datos privados de mis clientes?",
    answer:
      "Absolutamente no. La función de IA solo extrae datos visuales de las fotos de los W-2 o 1099s para pre-llenar los formularios. La información personal (como Números de Seguro Social e ingresos) nunca se almacena para entrenar modelos de IA ni sale de los servidores protegidos con cifrado de grado bancario.",
  },
  {
    question: "¿Qué requisitos necesito para empezar a preparar y transmitir?",
    answer:
      "Necesitas contar con tu PTIN activo como preparador. Para transmitir como oficina necesitas tu EFIN (Electronic Filing Identification Number) otorgado por el IRS. Si estás en proceso de obtenerlo, nuestro equipo te asesora durante la inducción.",
  },
  {
    question: "¿Puedo agregar a otros preparadores de mi oficina?",
    answer:
      "Sí. El sistema permite crear perfiles multiusuario y establecer niveles de acceso y permisos según el rol de cada persona en tu oficina.",
  },
  {
    question: "¿Qué pasa si tengo dudas técnicas en plena temporada de taxes?",
    answer:
      "Contamos con un equipo de soporte técnico en español disponible para ayudarte a resolver dudas sobre el uso de la plataforma, transmisión de declaraciones y resolución de códigos de error.",
  },
  {
    question: "¿Ofrecen garantía de reembolso?",
    answer:
      "Sí. Respaldamos la plataforma con una garantía de devolución de 30 días. Si el software no cumple con las exigencias de tu oficina, te devolvemos tu inversión.",
  },
];
