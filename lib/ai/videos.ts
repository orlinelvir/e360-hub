export interface VideoEntry {
  slug: string;
  title: string;
  category: string;
  description: string;
  // Grabación de Fathom con enlace estable (no depende del login GHL del usuario).
  // null cuando la lección es del catálogo nativo de e360library.com sin URL recuperable:
  // en ese caso se debe referir al broker a e360library.com, no inventar un enlace.
  url: string | null;
}

export const VIDEOS: VideoEntry[] = [
  // --- Reparación de Crédito ---
  {
    slug: "credito-como-usar-crm-monetizar",
    title: "Cómo Usar el CRM, Activar WhatsApp y Monetizar Servicios de Reparación de Crédito",
    category: "Reparación de Crédito",
    description: "Flujo completo para dar de alta el servicio de reparación de crédito en el CRM, activar WhatsApp y cobrar por el servicio.",
    url: "https://fathom.video/share/QoAsP_kkrvhiffwbmqyntUsMyNy5BYy7"
  },
  {
    slug: "credito-proceso-herramientas",
    title: "Proceso y Herramientas para la Reparación de Crédito",
    category: "Reparación de Crédito",
    description: "Flujo de trabajo actualizado del sistema de reparación de crédito: plataformas usadas, pasos y herramientas.",
    url: "https://fathom.video/share/nK7XWxnz_9J67wpxD66sA6xad8dsXxFk"
  },
  {
    slug: "credito-vision-general-proceso",
    title: "Visión General del Proceso de Reparación de Crédito",
    category: "Reparación de Crédito",
    description: "Explicación completa del flujo de reparación de crédito: onboarding de nuevos clientes y proceso de presentación de disputas.",
    url: "https://fathom.video/share/47wwPhzXXaftHR2SSA9yw_7wbcBf4ysU"
  },
  {
    slug: "credito-analisis-reportes",
    title: "Análisis de Reportes Crediticios y Estrategias para Financiamiento",
    category: "Reparación de Crédito",
    description: "Cómo leer e interpretar un informe de crédito para identificar oportunidades de mejora y financiamiento.",
    url: "https://fathom.video/share/nuGfqegB32wUQqQi8PYQRx4q1yzqPaDx"
  },
  {
    slug: "credito-usuarios-ssn",
    title: "Reparación de Crédito para Usuarios con SSN",
    category: "Reparación de Crédito",
    description: "Cómo funciona el servicio de reparación de crédito específicamente para clientes con SSN (Seguro Social).",
    url: "https://fathom.video/share/q4Nyys4VZuf2DaoMLANzq3PmNsNTGVmq"
  },
  {
    slug: "credito-estrategia-profesional",
    title: "Estrategia Profesional en Reparación de Crédito: Comunicación, Conversión y Ejecución",
    category: "Reparación de Crédito",
    description: "Cómo ofrecer el servicio de reparación de crédito de forma profesional: comunicación con el cliente y conversión de la venta.",
    url: "https://fathom.video/share/n3m83PFWUWmVxo4u-rTiKLg2vPPPB2Ka"
  },
  {
    slug: "credito-puntaje-cobranzas",
    title: "Fundamentos del Puntaje de Crédito, Manejo de Cobranzas y Estructuración de Servicios",
    category: "Reparación de Crédito",
    description: "Fundamentos de cómo se calcula el puntaje de crédito, cómo manejar cuentas en cobranza y cómo estructurar el servicio al cliente.",
    url: "https://fathom.video/share/6s2XYi-AaTUUz_x96gcEyjCyuPsspKkz"
  },
  {
    slug: "credito-proceso-completo-analisis",
    title: "Proceso Completo de Reparación de Crédito: Análisis, Ejecución y Manejo de Clientes",
    category: "Reparación de Crédito",
    description: "Guía completa del proceso de reparación de crédito, desde el análisis del perfil del cliente hasta la ejecución del servicio.",
    url: "https://fathom.video/share/8RsaqVgZyp2HSLi4m9vFQB7fE_S46zCD"
  },
  {
    slug: "credito-nombres-comerciales-alto-riesgo",
    title: "Selección de Nombres Comerciales y Reparación de Crédito para Evitar Clasificaciones de Alto Riesgo",
    category: "Reparación de Crédito",
    description: "Cómo elegir nombres comerciales y estructurar el crédito para evitar que un negocio sea clasificado como de alto riesgo por los bancos.",
    url: "https://fathom.video/share/eCWnxZJi8yugP6tm9tdSxPkVPEVRuW8D"
  },

  // --- CRM (StartPoint) ---
  {
    slug: "crm-guia-integral-operacion",
    title: "Guía Integral: CRM, Reparación de Crédito y Operación del Sistema E360",
    category: "CRM",
    description: "Sesión de preguntas y respuestas sobre configuración del CRM, proceso de reparación de crédito y cumplimiento técnico para que el sistema funcione correctamente.",
    url: "https://fathom.video/share/yLD9RB9tzfWm8CozL5id9FVMjA4_kf3C"
  },
  {
    slug: "crm-automatizacion-marketing",
    title: "Automatización del Marketing y Uso del CRM para una Adquisición Constante de Clientes",
    category: "CRM",
    description: "Estrategias para automatizar marketing digital usando el CRM y herramientas de IA, con el objetivo de generar clientes de forma constante.",
    url: "https://fathom.video/share/dyjY_Tyh24PpbTZ1KUPohfjz5RAd8EA1"
  },
  {
    slug: "crm-reparacion-financiamiento",
    title: "CRM, Reparación de Crédito y Requisitos de Financiamiento Empresarial",
    category: "CRM",
    description: "Sesión de preguntas y respuestas sobre uso del CRM, reparación de crédito, financiamiento empresarial y carga de documentos.",
    url: "https://fathom.video/share/TnNUjQWgyXmSt2AVVFbvjp99N4yzr8HW"
  },

  // --- Financiamiento Empresarial ---
  {
    slug: "financiamiento-duns-proveedores",
    title: "Cómo Obtener Financiamiento con Crédito Empresarial: Estrategia con D-U-N-S y Cuentas de Proveedor",
    category: "Financiamiento Empresarial",
    description: "Cómo las empresas pueden acceder a financiamiento usando exclusivamente su crédito empresarial (DUNS, cuentas de proveedor), sin depender del crédito personal del dueño.",
    url: "https://fathom.video/share/99wHi3Qs8BaYrcLdY9ysZqsys1aBB6ME"
  },
  {
    slug: "financiamiento-construir-credito-vender",
    title: "Cómo Construir Crédito Empresarial y Vender el Programa de Financiamiento de Forma Efectiva",
    category: "Financiamiento Empresarial",
    description: "Proceso completo para establecer crédito empresarial desde cero y cómo venderlo como servicio sin depender del crédito personal del cliente.",
    url: "https://fathom.video/share/V2idFa9_FMgZzwAAJTMobkE5QKXNj_hL"
  },
  {
    slug: "financiamiento-tradelines",
    title: "Cómo Ofrecer Crédito Empresarial y Utilizar Tradelines para Mejorar el Crédito",
    category: "Financiamiento Empresarial",
    description: "Uso de tradelines como estrategia para mejorar el perfil crediticio y ofrecer crédito empresarial a los clientes.",
    url: "https://fathom.video/share/xxBxE6EJ4mGY2tN_VrMS8hssoJUhkRCm"
  },
  {
    slug: "financiamiento-programa-pequenas-empresas",
    title: "Programa de Préstamos para Pequeñas Empresas: Requisitos, Beneficios y Expansión",
    category: "Financiamiento Empresarial",
    description: "Programa de préstamos rápidos de hasta $25,000 para negocios que califican, con requisitos de ingresos mensuales mínimos.",
    url: "https://fathom.video/share/vzYFUo9KMgdxhzBpxemCap3_ge5Tzja5"
  },
  {
    slug: "financiamiento-tarjetas-empresariales",
    title: "Requisitos y Estrategias para Obtener Tarjetas de Crédito Empresariales",
    category: "Financiamiento Empresarial",
    description: "Requisitos principales para obtener tarjetas de crédito empresariales, incluyendo perfil de crédito personal necesario.",
    url: "https://fathom.video/share/_Jsv7-rwQA57zj569McCPDaKisZoTEtV"
  },
  {
    slug: "financiamiento-midwest-corporate-credit",
    title: "Financiamiento Inteligente con Midwest Corporate Credit",
    category: "Financiamiento Empresarial",
    description: "Tarjetas de crédito empresariales con 0% de interés durante 6 a 12 meses ofrecidas por Midwest Corporate Credit.",
    url: "https://fathom.video/share/DgLUU1Sat69KTYurXSixDejFZ8h8dVJ7"
  },
  {
    slug: "financiamiento-construccion-brokers",
    title: "Financiamiento Estratégico en la Construcción: Oportunidades para Corredores y Prestamistas",
    category: "Financiamiento Empresarial",
    description: "Cómo los corredores pueden posicionarse en el financiamiento de proyectos de construcción, tanto para contratistas generales como subcontratistas.",
    url: "https://fathom.video/share/ZV8NM43gRAYutgKUfYX43MbxDup8HsMX"
  },
  {
    slug: "financiamiento-programas-credito",
    title: "Financiamiento Empresarial y Programas de Crédito",
    category: "Financiamiento Empresarial",
    description: "Las tres formas principales en que un negocio puede obtener financiamiento: garantía personal, crédito empresarial o crédito mixto.",
    url: "https://fathom.video/share/Naxy4B19ZVawzUiFw-2WTJGUxVGH3bEe"
  },
  {
    slug: "financiamiento-ingresos-recurrentes",
    title: "Cómo Ofrecer Financiamiento Empresarial y Construir Ingresos Recurrentes",
    category: "Financiamiento Empresarial",
    description: "Estrategias para ofrecer financiación empresarial de forma rentable, tanto para corredores como para emprendedores.",
    url: "https://fathom.video/share/BFYz8use9whMpyE-DMQUtATiDWyC_H_L"
  },
  {
    slug: "financiamiento-nuevos-negocios",
    title: "Proceso de Financiación de Nuevos Negocios",
    category: "Financiamiento Empresarial",
    description: "Proceso de financiación de principio a fin para negocios nuevos y los distintos tipos de préstamos disponibles.",
    url: "https://fathom.video/share/2TszHavyB5fhRA5tSu_ZtYmQEaLKddDz"
  },
  {
    slug: "financiamiento-evaluacion-perfil-cliente",
    title: "Estrategias de Financiación Empresarial y Evaluación del Perfil del Cliente",
    category: "Financiamiento Empresarial",
    description: "Cómo evaluar el perfil financiero de un cliente para determinar qué opciones de financiamiento empresarial califican.",
    url: "https://fathom.video/share/gPEcz4xNi5SAzjTyhXUTo6SBAsuLu6Lx"
  },

  // --- Bienes Raíces / Hipotecas ---
  {
    slug: "hipotecas-prestamos-pete",
    title: "Préstamos Inmobiliarios con Pete",
    category: "Bienes Raíces / Hipotecas",
    description: "Procesos de préstamos hipotecarios, requisitos y estrategias para inversiones inmobiliarias con el oficial de préstamos Pete Severino.",
    url: "https://fathom.video/share/tgPxd-c6ZMshm67RycN1k_-wqdn-2pL-"
  },
  {
    slug: "hipotecas-hard-money-lender",
    title: "Nuevo Hard Money Lender (Luis - HGRN Capital)",
    category: "Bienes Raíces / Hipotecas",
    description: "Préstamos de dinero rápido para proyectos de compra y renovación de bienes raíces con prestamista directo.",
    url: "https://fathom.video/share/jCSbyecADzxnHTv4quiyBxmK5XuJ9Nmb"
  },

  // --- Formación de Empresas / Crédito Empresarial (DUNS, LLC, EIN) ---
  {
    slug: "empresas-credito-empresarial",
    title: "Crédito Empresarial: Cómo Empezar",
    category: "Formación de Empresas",
    description: "Proceso de construcción de un perfil de crédito empresarial y orientación sobre la prestación de servicios financieros a los clientes.",
    url: "https://fathom.video/share/41URZdqH6X-oZxwFvyDKczGJFNJxNHWV"
  },
  {
    slug: "empresas-crear-duns",
    title: "Cómo Crear un DUNS Correctamente",
    category: "Formación de Empresas",
    description: "El Número de DUNS es un identificador esencial para un negocio, necesario antes de abrir cuentas de proveedor.",
    url: "https://fathom.video/share/RCKsJA-siuxaxD9BVojz1WGzCAMYvaQk"
  },
  {
    slug: "empresas-pasos-formacion",
    title: "Pasos para Formación de Empresas (LLC)",
    category: "Formación de Empresas",
    description: "Pasos necesarios para formar una LLC (Compañía de Responsabilidad Limitada) en Estados Unidos.",
    url: "https://fathom.video/share/CwoirxsGg_Ayo-piZrSaL_S7TK9VHyLz"
  },
  {
    slug: "empresas-formacion-legal-monetizar",
    title: "Formación Legal de Empresas en EE. UU. y Estrategias para Monetizar Servicios de Registro",
    category: "Formación de Empresas",
    description: "Guía práctica sobre la formación de empresas en Estados Unidos y por qué este servicio es fundamental para emprendedores y para el broker.",
    url: "https://fathom.video/share/jV4AQ1doqWnsyK8Yssuezv98s6NWireQ"
  },
  {
    slug: "empresas-escalar-multiservicio",
    title: "Cómo Escalar un Negocio Multiservicio con Estrategias Eficientes y Paquetes Rentables",
    category: "Formación de Empresas",
    description: "Cómo estructurar y escalar un ecosistema de negocios multiservicio usando el registro de empresas como punto de entrada estratégico.",
    url: "https://fathom.video/share/Qy4xzmw-vwpY_zxMYTH3YEwvaaFYgdkB"
  },

  // --- Ventas / Marketing ---
  {
    slug: "ventas-leer-extracto-bancario",
    title: "Cómo Leer un Extracto Bancario Comercial para Clientes que Buscan Financiación",
    category: "Ventas",
    description: "Cómo analizar estados de cuenta bancarios comerciales para la aprobación de préstamos y factores clave en la decisión crediticia.",
    url: "https://fathom.video/share/aLWWpTV3uRSxQfov1jvtDaFUux-45ivK"
  }
];

export function getVideoBySlug(slug: string): VideoEntry | undefined {
  return VIDEOS.find((v) => v.slug === slug);
}
