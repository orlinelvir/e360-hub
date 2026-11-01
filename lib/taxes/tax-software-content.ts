/**
 * Contenido oficial del Software de Taxes y Servicios Fiscales Emprende 360.
 *
 * Basado estrictamente en las "Fichas de Servicio - Equipo de Ventas E360".
 * Modela los 3 Caminos Reales según el perfil del cliente:
 *  1. Software Autónomo (tiene PTIN y EFIN - $899 Nov/Dic, $1,400 Enero)
 *  2. Curso de Preparador + Mentoría (sin EFIN - $150 curso + desde $60/declaración)
 *  3. Service Bureau (quiere vender software con su propia marca - Agenda con Yampiero)
 */

export interface TaxPlan {
  id: string;
  name: string;
  profile: string;
  tagline: string;
  priceDisplay: string;
  priceDetail: string;
  priceBadge?: string;
  highlights: string[];
  notIncluded?: string[];
  ctaText: string;
  ctaType: "software" | "mentoria" | "bureau";
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

/** Destinos de los botones principales. null = link hacia la sección o WhatsApp de ventas. */
export const TAX_SOFTWARE_CTA = {
  buySoftwareUrl: null, // Si es null, lleva al formulario de compra o contacto
  mentoriaUrl: null,    // Si es null, lleva al formulario de registro del curso
  bureauUrl: "https://meet.google.com/", // O Calendly de Yampiero
};

export const TAX_HERO = {
  eyebrow: "Emprende 360 • Temporada de Impuestos 2025 - 2026",
  title: "Tu oficina de taxes profesional,",
  titleAccent: "100% en la nube y con IA.",
  subtitle:
    "El ecosistema fiscal más completo para la comunidad hispana. Ya sea que tengas tu propia oficina con EFIN, estés dando tus primeros pasos con mentoría guiada, o quieras lanzar tu propia marca de software, en E360 tenemos el camino exacto para ti.",
};

export const TAX_TRUST_BADGES: string[] = [
  "Software autorizado para e-file al IRS",
  "Todos los 50 estados (Personal y Corporativo)",
  "Sin costo por declaración en el software",
  "Soporte en español: Fernando (9 AM a 6 PM EST)",
  "Clases en vivo los jueves a las 12 PM EST",
];

export const TAX_AI_BLOCK = {
  eyebrow: "Asistente de Inteligencia Artificial Integrado",
  title: "Una IA que lee el W-2 y 1099 y llena el formulario.",
  subtitle: "Ya no pierdes horas tipeando a mano.",
  description:
    "Sube la foto o el PDF de los W-2, 1099, K-1 y documentos del cliente. La IA identifica los datos y los coloca automáticamente en la declaración. Si la foto sale borrosa, el sistema te avisa de inmediato para mantener cero errores.",
  privacyGuarantee:
    "Privacidad Estricta: La IA solo procesa la imagen para extraer los datos necesarios. La información confidencial del cliente (SSN, ingresos) NUNCA se utiliza para entrenar modelos de IA.",
  humanOversight:
    "El Preparador Siempre Aprueba: Nada se envía solo. El preparador revisa y aprueba cada dato antes de procesar cualquier declaración.",
  documents: ["Form W-2", "Form 1099 (NEC/MISC/K/DA)", "Schedule K-1", "Form 1098", "Licencias / IDs"],
};

export const TAX_BANK_SECTION = {
  eyebrow: "Productos Bancarios Oficiales Integrados",
  title: "Adelanto de Reembolso y Cobro de tus Honorarios Directo del Reembolso",
  subtitle:
    "El software viene con integración a los 4 bancos líderes del mercado fiscal. El cliente puede recibir su dinero antes y tú cobras sin que el cliente pague de su bolsillo.",
  highlights: [
    {
      title: "Adelantos de Reembolso Inmediatos",
      desc: "Tus clientes pueden calificar para préstamos de reembolso desembolsados en 24 horas o el mismo día, según aprobación bancaria.",
    },
    {
      title: "Cobro de Honorarios de Preparación",
      desc: "Tus tarifas se descuentan automáticamente del reembolso que emite el banco. El cliente paga $0 al momento de la preparación.",
    },
    {
      title: "Costos Bancarios Transparentes",
      desc: "Hay costos de banco y transmisión (alrededor de $37 a $47 según el banco) únicamente cuando el cliente decide usar el producto bancario. Si no usa banco, ¡no hay costo extra de transmisión!",
    },
  ],
  partners: [
    { name: "Santa Barbara TPG (SBTPG)", tagline: "El banco fiscal más grande de Estados Unidos", website: "https://www.sbtpg.com/" },
    { name: "Refund Advantage", tagline: "Procesamiento ágil con soporte especializado", website: "https://www.refund-advantage.com/" },
    { name: "Republic Bank", tagline: "Especialistas en adelantos y cheques en oficina", website: "https://www.republicrefund.com/" },
    { name: "EPS Financial", tagline: "Soluciones de reembolso confiables y flexibles", website: "https://www.epstax.net/" },
  ],
};

export const TAX_FEATURES: TaxFeature[] = [
  {
    icon: "Users",
    title: "Equipo Ilimitado Sin Costo",
    description:
      "Preparadores ilimitados sin pagar por usuario adicional. Cada persona tiene su propio acceso, usa su propio PTIN y ve únicamente sus clientes.",
    badge: "Sin Costo por Asiento",
  },
  {
    icon: "ScanLine",
    title: "Dos Formas de Trabajar",
    description:
      "Modo entrevista que pregunta paso a paso (ideal para principiantes) y modo directo para que el preparador experimentado llene los formularios a su ritmo.",
  },
  {
    icon: "FileText",
    title: "Años Anteriores Desde 2019",
    description:
      "Prepara declaraciones de años anteriores desde 2019 hasta 2026. Los últimos 3 años se pueden enviar electrónicamente al IRS.",
    badge: "2019 - 2026",
  },
  {
    icon: "PenLine",
    title: "Firma Electrónica Ilimitada",
    description:
      "El cliente firma desde su celular, por email o mensaje de texto. La firma llega al sistema al instante sin descargar apps ni crear cuentas.",
  },
  {
    icon: "Landmark",
    title: "4 Bancos Fiscales Integrados",
    description:
      "TPG, Refund Advantage, Republic Bank y EPS Financial para adelantos y retención de honorarios directamente del reembolso.",
    badge: "TPG • Republic • EPS • RA",
  },
  {
    icon: "LayoutDashboard",
    title: "Panel del Dueño de Oficina",
    description:
      "Control total: supervisa cuántas declaraciones hay, en qué estado se encuentran y qué hace cada preparador en tiempo real. Sirve para varias oficinas.",
  },
  {
    icon: "Calculator",
    title: "Importación de Schedule K-1",
    description:
      "Importa directamente los datos de sociedades y corporaciones S (K-1) dentro de la Forma 1040 sin perder tiempo ingresando filas a mano.",
  },
  {
    icon: "Smartphone",
    title: "100% en la Nube: Cero Instalaciones",
    description:
      "Abre el navegador, entra con tu usuario y listo. Sirve en computadora, laptop, tableta o teléfono. Lo que haces en la oficina lo ves igual en tu casa.",
  },
  {
    icon: "Languages",
    title: "Hecho para Hispanos (Bilingüe)",
    description:
      "Interfaz, formularios y reportes en español e inglés. Toda la capacitación y el soporte se brinda 100% en tu idioma.",
  },
  {
    icon: "Lock",
    title: "Seguridad y Cifrado 256 bits",
    description:
      "Datos cifrados de grado bancario, respaldos automáticos en la nube y formularios siempre al día con los últimos cambios de ley del IRS.",
  },
];

export const TAX_FORMS = {
  individual: ["1040 (Ilimitadas)", "1040-NR (No residentes)", "1040-SR (Seniors)", "1040-X (Enmiendas)"],
  business: [
    "1041 (Fideicomisos y Patrimonios)",
    "1065 (Sociedades / LLC)",
    "1120 (Corporaciones)",
    "1120-S (Corporaciones S)",
    "2290 (Impuesto Vehículos Pesados)",
    "5500 (Planes de Beneficios)",
    "720 (Impuestos Especiales)",
    "706 (Herencias)",
    "709 (Donaciones)",
    "990 (Sin Fines de Lucro)",
    "8849 (Reembolso de Impuestos Especiales)",
  ],
  updates2025: [
    "Schedule 1-A: Nuevas deducciones para propinas calificadas, horas extra e intereses en préstamos de auto.",
    "Child Tax Credit: Crédito tributario aumentado de hasta $2,200 por cada hijo calificado.",
    "Form 1099-DA: Nuevo formulario mandatorio para reporte de operaciones con criptoactivos y activos digitales.",
  ],
  note: "Formularios de todos los 50 estados (personales y de empresas) sin costo extra por declaración.",
};

/** Los 3 Caminos Oficiales de Emprende 360 */
export const TAX_PLANS: TaxPlan[] = [
  {
    id: "camino-1-software",
    name: "Software Emprende 360",
    profile: "YA PREPARAS (Tienes PTIN y EFIN propio)",
    tagline: "Para quien trabaja por su cuenta, con su propia oficina y equipo.",
    priceDisplay: "$899",
    priceDetail: "Precio especial de Noviembre y Diciembre (Sube a $1,400 en Enero)",
    priceBadge: "Precio Fundador / Prelanzamiento",
    highlights: [
      "Software 100% en la nube (computadora, laptop, tablet o celular)",
      "Preparadores ilimitados sin costo extra por usuario",
      "Declaraciones personales y de empresa ilimitadas a los 50 estados",
      "Asistente de IA: lee W-2, 1099 y K-1 automáticamente",
      "Años anteriores desde 2019 (últimos 3 años al IRS)",
      "Firmas electrónicas ilimitadas directo al celular del cliente",
      "4 Bancos integrados (Adelantos de dinero y cobro de honorarios)",
      "Soporte oficial de 9 AM a 6 PM EST con Fernando (equipo de Gabriela)",
      "Clases en vivo los jueves a las 12 PM EST y clases grabadas de uso",
      "Convención de Enero en New Jersey (online o presencial) de regalo",
    ],
    notIncluded: [
      "No incluye revisión de declaraciones (preparas y transmites por tu cuenta)",
      "El EFIN y PTIN los tramita el preparador ante el IRS",
    ],
    ctaText: "Adquirir Licencia Software ($899)",
    ctaType: "software",
    featured: true,
  },
  {
    id: "camino-2-mentoria",
    name: "Curso de Preparador + Mentoría",
    profile: "ESTÁS EMPEZANDO (1ª o 2ª temporada, sin EFIN)",
    tagline: "No estás solo. Montas la declaración, nosotros la revisamos y la enviamos.",
    priceDisplay: "$150 + desde $60",
    priceDetail: "Curso $150 (pago único) + Desde $60 por declaración revisada y enviada",
    priceBadge: "Cero Riesgo de Multas",
    highlights: [
      "Curso en vivo de 12 horas para preparar Forma 1040 y tramitar tu PTIN",
      "Uso completo del software Emprende 360 con Asistente de IA",
      "Revisión de cada declaración por nuestro equipo antes de salir al IRS",
      "Transmisión legal bajo el EFIN de Emprende 360 (sin esperar 45 días)",
      "Modo entrevista guiado paso a paso para no cometer errores",
      "Pagas solo lo que usas (se descuenta del reembolso del cliente)",
      "Clases de los jueves 12 PM EST (actualizaciones IRS, marketing y ventas)",
      "Convención obligatoria de Enero en New Jersey (o virtual) antes de iniciar",
      "Evitas multas y sanciones del IRS teniendo una segunda mirada experta",
    ],
    notIncluded: [
      "No incluye software independiente (transmite el equipo central E360)",
    ],
    ctaText: "Inscribirme al Curso + Mentoría ($150)",
    ctaType: "mentoria",
  },
  {
    id: "camino-3-service-bureau",
    name: "Service Bureau (Tu Propia Marca)",
    profile: "QUIERES VENDER SOFTWARE A OTRAS OFICINAS",
    tagline: "Monta tu propio negocio revendiendo software con tu logotipo y tus precios.",
    priceDisplay: "Llamada Estratégica",
    priceDetail: "Evaluación personalizada con Yampiero de Dios para tu plan de negocio",
    priceBadge: "Marca Blanca Completa",
    highlights: [
      "Software de taxes con tu propio nombre, marca y colores corporativos",
      "Licencias ilimitadas para revender a tus clientes y oficinas aliadas",
      "Transmisiones personales y de empresa gratis e ilimitadas",
      "Firmas electrónicas gratis y años anteriores de 2019 a 2026",
      "5 Clases maestras: estructura de ingresos, contratos, reventa y soporte",
      "6 Meses de comunidad exclusiva con clases grabadas y webinars",
      "Soporte directo para tu software y la administración de tus licencias",
      "Tú defines el precio de reventa y conservas las ganancias de tus clientes",
    ],
    notIncluded: [
      "No incluye PTIN ni EFIN (cada oficina aliada debe tener el suyo)",
    ],
    ctaText: "Agendar Llamada con Yampiero",
    ctaType: "bureau",
  },
];

export const TAX_OFFICE_TEASER = {
  eyebrow: "Próximamente Integrado al E360 Hub",
  title: "Oficina Virtual E360: Tu Centro de Control de la Temporada",
  description:
    "Muy pronto dentro del mismo Hub: un panel en vivo donde podrás auditar honorarios colectados, cheques de reembolso emitidos por los bancos, casos abiertos, seguimiento de leads y clientes, y liquidación de comisiones con la marca Emprende 360.",
  items: [
    "Dashboard de Reembolsos y Honorarios Colectados",
    "Monitoreo de Casos y E-file Status en Vivo",
    "Gestión de Comisiones por Preparador",
    "CRM de Clientes y Documentos Fiscales",
    "Soporte Técnico Directo Integrado",
  ],
};

export const TAX_TRAINING = {
  title: "Acompañamiento Real: Aquí No Estás Solo",
  description:
    "El éxito de tu oficina en la temporada no depende solo de un programa, sino del soporte que tienes cuando surgen dudas.",
  items: [
    {
      title: "Soporte en Español: Atiende Fernando",
      description:
        "Atención de 9 AM a 6 PM EST por el equipo de Gabriela (Emprende 360). Resolvemos dudas de la plataforma y configuración técnica.",
    },
    {
      title: "Clases de los Jueves a las 12 PM EST",
      description:
        "Sesiones semanales en vivo sobre actualizaciones de ley del IRS, estrategias de marketing, captación de clientes y seguridad de datos.",
    },
    {
      title: "Convención de Enero en New Jersey",
      description:
        "Evento presencial y online antes de abrir la temporada para revisar protocolos del IRS, reglas operativas y arranque de campaña.",
    },
  ],
};

export const TAX_FAQS: TaxFaq[] = [
  {
    question: "¿Por qué sube el precio del software en enero?",
    answer:
      "Estamos en etapa de prelanzamiento. Al igual que los grandes proveedores de la industria, las tarifas son escalonadas por fecha: $899 durante noviembre y diciembre, y $1,400 en enero. Al adquirirlo hoy aseguras el precio de prelanzamiento para toda la temporada.",
  },
  {
    question: "Si compro el software, ¿el equipo de E360 me revisa los taxes?",
    answer:
      "No. Mentoría y software son dos caminos completamente separados. Quien compra el software trabaja de forma 100% independiente con su propio EFIN. Si estás empezando y deseas que nuestro equipo revise y transmita cada declaración por ti, tu camino ideal es el de Curso + Mentoría.",
  },
  {
    question: "¿Y qué pasa el próximo año con el software?",
    answer:
      "El software se paga una vez por temporada fiscal y te da acceso completo durante todo el año. En la siguiente temporada renuevas a un precio preferencial parecido.",
  },
  {
    question: "¿Por qué me conviene entrar a Mentoría en vez de comprar el software si estoy empezando?",
    answer:
      "Porque quien prepara impuestos responde legalmente ante el IRS. Un error u omisión puede acarrear multas costosas. Además, si estás en tu primera temporada y haces pocas declaraciones, pagar $899 no se amortiza tan fácil; con la mentoría pagas solo $150 de curso y luego pagas solo por cada declaración que realmente prepares y envíes, con el respaldo de que un experto revisa todo antes de que salga.",
  },
  {
    question: "¿Cómo funciona el cobro de 'desde $60' en la Mentoría?",
    answer:
      "Tú cobras tus honorarios al cliente (por ejemplo, $150 o $200). A Emprende 360 le pagas desde $60 por la revisión y envío bajo nuestro EFIN, y el resto es tu ganancia neta. Si el cliente usa producto bancario, los $60 se descuentan directamente del reembolso; si no, se abonan al enviar el expediente.",
  },
  {
    question: "¿Cómo funcionan los Productos Bancarios y qué costo tienen?",
    answer:
      "El sistema está integrado con TPG, Refund Advantage, Republic Bank y EPS. Permiten ofrecer adelantos de dinero en 24 horas y cobrar tus honorarios directo del reembolso. Hay un costo bancario y de transmisión de aproximadamente $37 a $47 que se cobra ÚNICAMENTE cuando el cliente decide usar el producto bancario. Si el cliente no usa banco, ¡no hay costo extra de transmisión!",
  },
  {
    question: "¿Qué pasa si me arrepiento después de pagar? ¿Hay devolución?",
    answer:
      "No hay devolución de dinero. Al ser software en la nube y servicios de capacitación y credenciales con entrega inmediata, todo queda estipulado de forma transparente en el contrato de servicio firmado.",
  },
  {
    question: "¿El software incluye declaraciones de años anteriores?",
    answer:
      "Sí. Puedes preparar declaraciones de años anteriores desde 2019 hasta 2026. Los últimos 3 años se pueden enviar electrónicamente al IRS sin costo extra.",
  },
];
