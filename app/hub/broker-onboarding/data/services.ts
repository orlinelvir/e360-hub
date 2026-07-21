import { 
  User, 
  CreditCard, 
  Home, 
  Briefcase, 
  Users, 
  Calculator, 
  Laptop, 
  Car, 
  HeartPulse, 
  Heart, 
  ShieldCheck, 
  Building 
} from "lucide-react";

export interface ServiceDetail {
  id: string;
  title: string;
  icon: any;
  category: "financial" | "professional";
  status: "active" | "delay" | "paused" | "upcoming";
  statusLabel: string;
  description: string;
  requirements: string[];
  process: string[];
  timeframe: string;
  comission: string;
  formLink: string;
  supportPhone: string;
  supportPhoneFormatted: string;
}

export const servicesData: ServiceDetail[] = [
  {
    id: "business-loan",
    title: "Préstamo de Negocio (< 680 FICO / MCA)",
    icon: Briefcase,
    category: "financial",
    status: "active",
    statusLabel: "Activo",
    description: "Merchant Cash Advance (MCA) y préstamos empresariales rápidos basados en flujo de caja para clientes con puntaje de crédito inferior a 680. Underwriter asignado: James (Cliq Capital).",
    requirements: [
      "Mínimo 6 meses operando el negocio (1 año ideal)",
      "Depósitos bancarios mensuales consistentes de $5,000 o más",
      "Frecuencia de 10+ depósitos mensuales en la cuenta de negocio",
      "Saldo promedio positivo y sin NSF (fondos insuficientes) excesivos",
      "Identificación oficial vigente del dueño (Pasaporte o ID)",
      "Últimos 3 estados de cuenta bancarios de la empresa",
      "Voided check y número EIN del negocio"
    ],
    process: [
      "Precalificar al cliente respondiendo a las 4 preguntas clave de volumen e historial.",
      "Recopilar documentos básicos (Solicitud de financiamiento firmada, ID, EIN, 3 estados de cuenta, voided check).",
      "Revisar estados de cuenta (analizar volumen, NSF, y saldos negativos recurrentes antes de someter).",
      "Someter aplicación completa en la plataforma de Emprende 360.",
      "Recibir oferta en 24-48 horas, presentar al cliente, firmar y fondear en 24-72 horas."
    ],
    timeframe: "Aprobación en 24-48 horas. Fondeo en 1 a 3 días hábiles.",
    comission: "Comisión del 3% al 8% del monto financiado (Ej: $1,500 - $4,000 en un préstamo de $50,000).",
    formLink: "https://api.leadconnectorhq.com/widget/form/tvJ4AjmdXHVnOmm8DyEk?notrack=true",
    supportPhone: "tel:+16464729408",
    supportPhoneFormatted: "James - Cliq Capital: +1 (646) 472-9408"
  },
  {
    id: "business-loan-conventional",
    title: "Préstamo Empresarial Convencional (> 700 FICO)",
    icon: Briefcase,
    category: "financial",
    status: "active",
    statusLabel: "Activo",
    description: "Financiamiento empresarial de categoría A-Paper con las mejores tasas bancarias y plazos extendidos para dueños de negocio con excelente puntaje de crédito (700+ FICO).",
    requirements: [
      "Puntaje FICO de 700+ en los 3 burós de crédito principales",
      "Mínimo 2 años de impuestos (taxes) corporativos y personales declarados",
      "Estados de cuenta bancarios de los últimos 6 meses de la empresa",
      "Ingresos anuales declarados del negocio de $150,000+",
      "Relación Deuda / Ingresos (DTI) del negocio por debajo del 35%"
    ],
    process: [
      "Precalificar el reporte de crédito del cliente garantizando un score >= 700.",
      "Completar la aplicación digital del préstamo convencional.",
      "Cargar impuestos recientes y estados de cuenta de la empresa.",
      "Revisión y aprobación bancaria en 3 a 5 días hábiles."
    ],
    timeframe: "Precalificación inmediata. Aprobación y desembolso en 3 a 7 días hábiles.",
    comission: "Comisión del 2% al 5% sobre el valor total financiado.",
    formLink: "https://link.apisystem.tech/widget/form/9SjtRRXOxQjb7J5GphD9",
    supportPhone: "tel:+19172845636",
    supportPhoneFormatted: "+1 (917) 284-5636"
  },
  {
    id: "personal-loan",
    title: "Préstamo Personal",
    icon: User,
    category: "financial",
    status: "active",
    statusLabel: "Activo",
    description: "Financiamiento personal sin garantías para perfiles sólidos (A-Paper) que buscan liquidez inmediata con tasas competitivas y plazos cómodos.",
    requirements: [
      "Puntaje de crédito de 700 o superior obligatoriamente",
      "Relación Deuda-Ingreso (DTI) del 20% o menos",
      "Ingresos anuales comprobables (W-2, talones de pago o taxes)",
      "Historial de crédito limpio sin marcas negativas recientes"
    ],
    process: [
      "Consulta inicial para evaluar el reporte de crédito del cliente e ingresos.",
      "Verificación de DTI obligatoria antes de iniciar la solicitud.",
      "Llenado del formulario de aplicación y carga de pruebas de ingresos.",
      "Revisión y pre-aprobación automática en un lapso de 24-48 horas."
    ],
    timeframe: "Precalificación inmediata. Aprobación y desembolso en 24-48 horas.",
    comission: "Honorario fijo garantizado por referido aprobado y financiado.",
    formLink: "https://api.leadconnectorhq.com/widget/form/Qgnp3xRhHOWeUW4dUE63?notrack=true",
    supportPhone: "tel:+19172845636",
    supportPhoneFormatted: "+1 (917) 284-5636"
  },
  {
    id: "business-credit-cards",
    title: "Tarjetas de Crédito de Negocio",
    icon: CreditCard,
    category: "financial",
    status: "active",
    statusLabel: "Activo",
    description: "Líneas de crédito rotativas empresariales al 0% de interés introductorio por 12 a 24 meses para capital de trabajo y expansión del negocio sin afectar el crédito personal.",
    requirements: [
      "Puntaje de crédito personal de 680+ en los 3 burós de crédito",
      "Compañía registrada (LLC o Corp) con número EIN activo",
      "Sin bancarrotas ni pagos atrasados recientes en el reporte",
      "Uso de tarjetas de crédito actuales por debajo del 30%"
    ],
    process: [
      "Precalificar el reporte de crédito del dueño del negocio.",
      "Completar la aplicación oficial a través del enlace del widget CRM.",
      "El equipo procesa las solicitudes estratégicas con múltiples bancos asociados.",
      "Recepción y activación de las tarjetas de crédito corporativas en 7-14 días."
    ],
    timeframe: "Precalificación en 24 horas. Aprobación y entrega en 7 a 14 días.",
    comission: "Comisión fija sobre el volumen total de crédito aprobado para el negocio.",
    formLink: "https://api.leadconnectorhq.com/widget/form/rYyJUvwRiMc0bsznMjOd?notrack=true",
    supportPhone: "tel:+19172845636",
    supportPhoneFormatted: "+1 (917) 284-5636"
  },
  {
    id: "mortgage-loan",
    title: "Préstamo Hipotecario / Bienes Raíces",
    icon: Home,
    category: "financial",
    status: "active",
    statusLabel: "Activo",
    description: "Financiamiento integral para bienes raíces (residenciales y comerciales) adaptado a cada perfil: FHA, Convencionales, VA, DSCR (inversionistas sin verificar ingresos) y Dinero Duro.",
    requirements: [
      "FHA: 580+ FICO para 3.5% de enganche; con 500-579 se requiere 10% de enganche",
      "Convencional: 620+ FICO, enganche desde 3% para primerizos, 2 años de taxes/W2",
      "DSCR (Inversionistas): 620-680+ FICO, 20-25% de enganche, propiedad debe generar rentas >= pago mensual de hipoteca (DSCR >= 1.0)",
      "Dinero Duro / Harmony: 550+ FICO, 10-35% de enganche, basado en la solidez del proyecto (ARV de la propiedad >= 70%)"
    ],
    process: [
      "Cita inicial obligatoria con el Oficial de Préstamos para analizar el caso.",
      "Evaluación y selección del programa adecuado (FHA, Convencional, DSCR, Harmony).",
      "Carga de aplicación y expediente completo en la plataforma de procesamiento.",
      "Procesamiento y Underwriting del banco (tasación, revisión legal).",
      "Divulgación de cierre, firma final y entrega de llaves."
    ],
    timeframe: "DSCR/Dinero Duro: 5-30 días. FHA/Convencionales: 30-45 días. Nueva construcción: 45-90 días.",
    comission: "Comisión basada en la tabla de puntos de originación del préstamo.",
    formLink: "https://api.leadconnectorhq.com/widget/form/K9P2nfr7uoerIVXdS2hi",
    supportPhone: "tel:+19172845636",
    supportPhoneFormatted: "+1 (917) 284-5636"
  },
  {
    id: "credit-repair",
    title: "Reparación de Crédito",
    icon: CreditCard,
    category: "financial",
    status: "active",
    statusLabel: "Activo",
    description: "Programa integral de disputa y remoción de cuentas derogatorias del reporte de crédito utilizando la Ley de Crédito Justo (FCRA) para elevar el score de crédito del cliente.",
    requirements: [
      "Reporte de crédito completo y reciente de los 3 burós (Equifax, Experian, TransUnion)",
      "Identificación oficial válida y SSN o número ITIN",
      "Comprobante de domicilio reciente (factura de servicios, banco, etc.)"
    ],
    process: [
      "Consulta inicial y verificación del reporte de crédito de los tres bureaus.",
      "Cobro de honorarios de inicio según el nivel (Nivel 1: $250, Nivel 2: $500, Nivel 3: $1,000-$2,000; ¡el 100% de inicio y la cuota mensual es tuya!).",
      "Llenado del formulario oficial de onboarding para disputas.",
      "Envío automático de cartas de disputa a los burós de crédito en un lapso de 24-72 horas.",
      "Seguimiento mensual (cada 30 días) con el cliente para monitorear eliminaciones y variaciones del puntaje."
    ],
    timeframe: "Actualizaciones y rondas de disputa cada 30 días. Duración de 6 a 12 meses.",
    comission: "100% del pago de inicio y de la cuota mensual de $50 cobrada al cliente.",
    formLink: "Formulario en desarrollo",
    supportPhone: "tel:+19172845636",
    supportPhoneFormatted: "+1 (917) 284-5636"
  },
  {
    id: "incorporation",
    title: "Registro de Compañía",
    icon: Building,
    category: "financial",
    status: "active",
    statusLabel: "Activo",
    description: "Servicio de constitución y registro oficial de LLCs, Corporaciones (Corp) o Nonprofits en cualquiera de los 50 estados de USA. Incluye EIN y Acuerdo Operativo.",
    requirements: [
      "Nombre deseado del negocio (y 1 o 2 alternativas adicionales)",
      "Dirección física comercial o contratación de servicio de Agente Registrado",
      "Identificación de los dueños/socios y distribución de porcentajes de participación",
      "Correo electrónico oficial de la empresa para recibir los documentos"
    ],
    process: [
      "Conversación inicial para definir la industria, estado de registro y estructura adecuada (LLC vs Corp).",
      "Explicación del alcance del servicio (Artículos de formación, EIN del IRS, Operating Agreement).",
      "Cobro del servicio ($350 de honorario + tarifa oficial del estado correspondiente).",
      "Cliente llena el formulario oficial mediante el enlace proporcionado.",
      "Radicación estatal y entrega de documentos oficiales por correo electrónico."
    ],
    timeframe: "Entrega de documentos completos en 24 a 72 horas hábiles tras la radicación.",
    comission: "Comisión fija de $150 sobre los honorarios base del servicio de registro.",
    formLink: "Formulario en desarrollo",
    supportPhone: "tel:+19172845636",
    supportPhoneFormatted: "+1 (917) 284-5636"
  },
  {
    id: "payroll",
    title: "Servicios de Nómina",
    icon: Calculator,
    category: "financial",
    status: "upcoming",
    statusLabel: "Próximamente",
    description: "Configuración, manejo de payroll y automatización para el pago de empleados y contratistas, asegurando el cumplimiento tributario laboral local y federal. Disponible muy pronto.",
    requirements: [
      "EIN (Federal Tax ID) activo y registro estatal de empleador",
      "Cuenta bancaria corporativa para procesar los fondos de nómina",
      "Información personal, números SSN/ITIN y salarios de los empleados"
    ],
    process: [
      "Referir los datos básicos del cliente en el enlace de nómina.",
      "El equipo especialista de E360 se reúne con el cliente para cotizar y configurar el sistema.",
      "Carga e integración del software de payroll y procesamiento de la primera nómina activa."
    ],
    timeframe: "Lanzamiento previsto para el próximo mes.",
    comission: "Comisión por cuenta activada y residual recurrente por mes de actividad.",
    formLink: "Formulario en desarrollo",
    supportPhone: "tel:+19172845636",
    supportPhoneFormatted: "+1 (917) 284-5636"
  },
  {
    id: "pos-services",
    title: "Servicios de POS",
    icon: CreditCard,
    category: "financial",
    status: "upcoming",
    statusLabel: "Próximamente",
    description: "Instalación de terminales de pago con tarjeta e integración de procesamiento de merchant account con tarifas garantizadas y soporte técnico local. Disponible muy pronto.",
    requirements: [
      "EIN comercial y registro oficial de la empresa",
      "Cuenta de banco comercial para los depósitos de ventas",
      "Estados de cuenta de procesamiento actuales (si ya acepta tarjetas) para análisis de ahorro"
    ],
    process: [
      "Recopilar y enviar los estados de cuenta de merchant actuales del cliente.",
      "El departamento comercial realiza un estudio comparativo sin costo demostrando ahorros.",
      "Aprobación de la cuenta, configuración y envío/instalación de las terminales físicas."
    ],
    timeframe: "Lanzamiento previsto para el próximo mes.",
    comission: "Bono único por instalación física + comisión residual mensual de por vida sobre el volumen.",
    formLink: "Formulario en desarrollo",
    supportPhone: "tel:+19172845636",
    supportPhoneFormatted: "+1 (917) 284-5636"
  },
  {
    id: "auto-insurance",
    title: "Seguro de Auto Personal",
    icon: Car,
    category: "professional",
    status: "active",
    statusLabel: "Activo",
    description: "Pólizas de seguro automotriz personal, cotizando y comparando precios con las aseguradoras más importantes de USA.",
    requirements: [
      "Información del vehículo (año, marca, modelo o número VIN)",
      "Licencia de conducir de todos los conductores del núcleo familiar",
      "Código postal (ZIP) de residencia e historial de manejo (tickets, colisiones)"
    ],
    process: [
      "Si tienes licencia activa: ingresa los datos a la plataforma para cotización directa. Si no tienes: refiere la información.",
      "Comparar cotizaciones obtenidas con el cliente (se sugieren las 3 mejores opciones).",
      "Cliente acepta y firma la póliza; emisión de los 'binders' de cobertura."
    ],
    timeframe: "Cotización en menos de 24 horas. Emisión de cobertura en minutos tras el pago.",
    comission: "Comisión completa directa de la póliza (si tiene licencia) o bono por referido (sin licencia).",
    formLink: "https://api.leadconnectorhq.com/widget/form/Ofq6tPlRhtLS5P8nipYe",
    supportPhone: "tel:+19172845636",
    supportPhoneFormatted: "+1 (917) 284-5636"
  },
  {
    id: "commercial-auto-insurance",
    title: "Seguro Comercial de Auto & Trucking",
    icon: Car,
    category: "professional",
    status: "active",
    statusLabel: "Activo",
    description: "Pólizas de seguro comercial automotriz y de transporte pesado (Trucking / Flotillas) para camiones de carga, semi-remolques y vehículos corporativos.",
    requirements: [
      "EIN y registro oficial de la empresa transportista o comercial",
      "Información de los vehículos (VIN, año, modelo, capacidad de carga)",
      "Licencias CDL o de conducir de los choferes y registro de radio de operación"
    ],
    process: [
      "Entrevistar al cliente sobre los vehículos, rutas y carga transportada.",
      "Enviar formulario al departamento de suscripción de camiones y auto comercial.",
      "Revisar cotizaciones con las aseguradoras especializadas en transportación.",
      "Emisión del certificado de seguro (COI) y cobertura activa."
    ],
    timeframe: "Cotizaciones en 24 a 48 horas hábiles.",
    comission: "Comisión sobre la prima comercial adjudicada o tarifa de referido.",
    formLink: "https://api.leadconnectorhq.com/widget/form/LTDvyVbeNDxgawUvtxmt",
    supportPhone: "tel:+19172845636",
    supportPhoneFormatted: "+1 (917) 284-5636"
  },
  {
    id: "home-insurance",
    title: "Seguro de Casa (Homeowners)",
    icon: Home,
    category: "professional",
    status: "active",
    statusLabel: "Activo",
    description: "Seguros residenciales (homeowners) para proteger la estructura física de la vivienda, propiedad personal y responsabilidad civil del asegurado.",
    requirements: [
      "Dirección física exacta de la vivienda",
      "Año de construcción, tipo de techo y detalles estructurales claves",
      "Historial de reclamos de seguros de casa del propietario"
    ],
    process: [
      "Recopilar la información y detalles de la propiedad a asegurar.",
      "Someter los datos a cotización con las agencias aliadas de E360 (24-48 horas).",
      "Presentar ofertas, verificar endosos requeridos (hipoteca) y emitir póliza."
    ],
    timeframe: "Cotizaciones de seguros de hogar listas en 24 a 48 horas.",
    comission: "Comisión sobre prima anual (con licencia) o tarifa de referido (sin licencia).",
    formLink: "https://api.leadconnectorhq.com/widget/form/4wTIAcBmi4DuuoyIccvk",
    supportPhone: "tel:+19172845636",
    supportPhoneFormatted: "+1 (917) 284-5636"
  },
  {
    id: "business-insurance",
    title: "Seguro de Negocio (General Liability)",
    icon: Laptop,
    category: "professional",
    status: "active",
    statusLabel: "Activo",
    description: "Cobertura de Responsabilidad Civil General (Commercial General Liability - CGL), BOP y propiedad comercial para blindar la operación del negocio ante reclamos y demandas.",
    requirements: [
      "EIN y registro de empresa",
      "Descripción exacta de las operaciones, estimados de facturación y nómina anual",
      "Número de empleados y detalles físicos de la locación comercial"
    ],
    process: [
      "Entrevistar al cliente sobre los riesgos específicos de su industria.",
      "Enviar formulario al departamento de suscripción comercial de E360.",
      "El equipo cotiza con múltiples mercados especializados en riesgos comerciales.",
      "Revisión de coberturas con el cliente y emisión de certificados de seguro (COI)."
    ],
    timeframe: "Cotizaciones comerciales toman de 24 a 48 horas hábiles.",
    comission: "Comisión comercial según la póliza adjudicada (o referido a agentes de E360).",
    formLink: "https://api.leadconnectorhq.com/widget/form/YWiqKYGs4JzNfzklDwZo",
    supportPhone: "tel:+19172845636",
    supportPhoneFormatted: "+1 (917) 284-5636"
  },
  {
    id: "workers-comp",
    title: "Seguro de Compensación de Trabajadores",
    icon: ShieldCheck,
    category: "professional",
    status: "active",
    statusLabel: "Activo",
    description: "Seguro obligatorio de Workers' Compensation para proteger la salud de los empleados y blindar al empleador ante lesiones o accidentes dentro del área de trabajo.",
    requirements: [
      "EIN corporativo y estimación de nómina total anual (Payroll)",
      "Número de empleados a tiempo completo (FT) y tiempo parcial (PT)",
      "Clasificación del tipo de trabajo / industria (Construcción, Transporte, Comercio, etc.)"
    ],
    process: [
      "Recopilar la nómina anual estimada y clasificación de puestos.",
      "Someter aplicación al departamento de suscripción de Workers Comp.",
      "Presentar cotizaciones comparativas ajustadas al riesgo de la nómina.",
      "Emisión inmediata de certificados de cumplimiento laboral."
    ],
    timeframe: "Cotización e inspección de riesgo en 24 a 48 horas.",
    comission: "Comisión sobre prima de nómina contratada por la empresa.",
    formLink: "https://api.leadconnectorhq.com/widget/form/RzPn2LF1d6tXzGM5X8PI",
    supportPhone: "tel:+19172845636",
    supportPhoneFormatted: "+1 (917) 284-5636"
  },
  {
    id: "immigration-services",
    title: "Servicios de Inmigración",
    icon: Users,
    category: "professional",
    status: "active",
    statusLabel: "Activo",
    description: "Asistencia no legal en la preparación y envío de documentación oficial para trámites ante el USCIS (DACA, renovación de permisos de trabajo, cartas de patrocinio). NO incluye representación jurídica.",
    requirements: [
      "Documentación vigente de identidad del solicitante",
      "Historial de trámites y formularios presentados previamente",
      "Pago de tarifas correspondientes a la solicitud estatal"
    ],
    process: [
      "Revisar el trámite que requiere el cliente en la tabla de servicios elegibles.",
      "Completar el formulario básico de recolección de información del cliente.",
      "El equipo experto de E360 prepara las formas oficiales del USCIS.",
      "Entrega del expediente completo listo para firma y envío por correo certificado."
    ],
    timeframe: "Preparación de expedientes en 3 a 7 días hábiles tras recopilación completa.",
    comission: "Comisión fija de referido del 30% sobre el valor del servicio preparado.",
    formLink: "Formulario en desarrollo",
    supportPhone: "tel:+19087332891",
    supportPhoneFormatted: "+1 (908) 733-2891 (Llamadas / WhatsApp)"
  },
  {
    id: "tax-preparation",
    title: "Preparación de Impuestos",
    icon: Calculator,
    category: "professional",
    status: "active",
    statusLabel: "Activo",
    description: "Declaración anual y trimestral de taxes personales y corporativos. Trámite de nuevo número ITIN, enmiendas y corrección de impuestos de años anteriores.",
    requirements: [
      "W-2, 1099 y registros detallados de ingresos y egresos del negocio",
      "Identificación oficial, número SSN o tarjeta/carta de número ITIN",
      "Copia de la declaración de impuestos del año fiscal anterior"
    ],
    process: [
      "Recoger toda la documentación y subirla a través del portal de impuestos de E360.",
      "El especialista fiscal de E360 realiza los cálculos y el borrador de declaración.",
      "Reunión de revisión de reembolsos/pagos con el cliente, firma y transmisión electrónica al IRS."
    ],
    timeframe: "En temporada (Ene-Abr): 24 a 72 horas. Fuera de temporada: 3 a 5 días hábiles.",
    comission: "Porcentaje sobre el costo base de preparación cobrado por E360.",
    formLink: "Formulario en desarrollo",
    supportPhone: "tel:+19087332891",
    supportPhoneFormatted: "+1 (908) 733-2891 (Llamadas / WhatsApp)"
  },
  {
    id: "life-insurance",
    title: "Seguro de Vida",
    icon: Heart,
    category: "professional",
    status: "active",
    statusLabel: "Activo",
    description: "Pólizas de seguro de vida individuales a término o permanente para la protección patrimonial y financiera de la familia del tomador.",
    requirements: [
      "Edad, sexo, estado de salud y hábitos del asegurado (condiciones preexistentes)",
      "Monto de cobertura deseado e información detallada de beneficiarios",
      "Examen médico preventivo en sitio (si el programa lo requiere)"
    ],
    process: [
      "Evaluar la necesidad financiera y de herencia del asegurado.",
      "Realizar cotización en la plataforma multi-compañías.",
      "Someter aplicación médica a través de la red autorizada.",
      "Aprobación por parte del departamento de Suscripción (Underwriting) y emisión."
    ],
    timeframe: "Planes simplificados: emisión inmediata. Planes médicos: de 2 a 4 semanas.",
    comission: "Sólo brokers con licencia de vida activa: 80% al 100% de la prima pagada el primer año.",
    formLink: "Formulario en desarrollo",
    supportPhone: "tel:+19172845636",
    supportPhoneFormatted: "+1 (917) 284-5636"
  },
  {
    id: "health-insurance",
    title: "Membresía de Seguro Médico",
    icon: HeartPulse,
    category: "professional",
    status: "active",
    statusLabel: "Activo",
    description: "Planes de seguro médico individuales, familiares y comerciales (Planes bajo el Obamacare - Mercado de Seguros de Salud, y seguros privados).",
    requirements: [
      "Estimado de ingresos del hogar para el año fiscal actual y número de dependientes",
      "ZIP code de residencia e información personal de todos los miembros",
      "Documento de estatus migratorio válido en USA para planes subsidiados (Obamacare)"
    ],
    process: [
      "Recopilar ingresos y dependientes para calcular el subsidio federal asignado.",
      "Seleccionar el plan ideal considerando deducibles, copagos y red de especialistas.",
      "Proceder con el enrolamiento en el sistema oficial del Mercado de Salud."
    ],
    timeframe: "Inscripción en 20 minutos. Cobertura activa el primer día del mes entrante.",
    comission: "Sólo brokers con licencia de salud activa: comisión mensual recurrente por miembro inscrito.",
    formLink: "Formulario en desarrollo",
    supportPhone: "tel:+19172845636",
    supportPhoneFormatted: "+1 (917) 284-5636"
  }
];
