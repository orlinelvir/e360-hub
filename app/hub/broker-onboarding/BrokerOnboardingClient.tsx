"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { 
  Search, 
  ChevronRight, 
  Phone, 
  Copy, 
  Check, 
  Lock, 
  User, 
  FileText, 
  X,
  CheckCircle2,
  Clock,
  Coins,
  ShieldCheck,
  Building,
  CreditCard,
  Home,
  Briefcase,
  Users,
  Smile,
  Activity,
  Calculator,
  Laptop,
  Car,
  HeartPulse,
  Heart
} from "lucide-react";

// Estructura de tipo para los servicios
interface ServiceDetail {
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

// Iconos mapeados a cada servicio para renderizado dinámico
const servicesData: ServiceDetail[] = [
  {
    id: "business-loan",
    title: "Préstamo de Negocio",
    icon: Briefcase,
    category: "financial",
    status: "active",
    statusLabel: "Activo",
    description: "Merchant Cash Advance (MCA) y préstamos empresariales rápidos basados en el flujo de caja del negocio. Aprobación rápida sin colaterales y con crédito desde 500.",
    requirements: [
      "Mínimo 6 meses operando el negocio (1 año ideal)",
      "Depósitos bancarios mensuales consistentes de $10,000+",
      "Frecuencia de 10+ depósitos mensuales en la cuenta de negocio",
      "Saldo promedio positivo y sin NSF (fondos insuficientes) excesivos",
      "Identificación oficial vigente del dueño (Pasaporte o ID)",
      "Últimos 3 estados de cuenta bancarios de la empresa",
      "Voided check y número EIN del negocio"
    ],
    process: [
      "Precalificar al cliente respondiendo a las 6 preguntas clave de volumen e historial.",
      "Recopilar documentos básicos (Solicitud de financiamiento firmada, ID, EIN, 3 estados de cuenta, voided check).",
      "Revisar estados de cuenta (analizar volumen, NSF, y saldos negativos recurrentes antes de someter).",
      "Someter aplicación completa en la plataforma de Emprende 360.",
      "Recibir oferta en 24-48 horas, presentar al cliente, firmar y fondear en 24-72 horas."
    ],
    timeframe: "Aprobación en 24-48 horas. Fondeo en 1 a 3 días hábiles.",
    comission: "Comisión del 3% al 8% del monto financiado (Ej: $1,500 - $4,000 en un préstamo de $50,000).",
    formLink: "https://api.leadconnectorhq.com/widget/form/tvJ4AjmdXHVnOmm8DyEk?notrack=true",
    supportPhone: "tel:+18003605626",
    supportPhoneFormatted: "+1 (800) 360-5626"
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
    supportPhone: "tel:+18003605626",
    supportPhoneFormatted: "+1 (800) 360-5626"
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
      "Completar la aplicación oficial a través del enlace del widget GHL.",
      "El equipo procesa las solicitudes estratégicas con múltiples bancos asociados.",
      "Recepción y activación de las tarjetas de crédito corporativas en 7-14 días."
    ],
    timeframe: "Precalificación en 24 horas. Aprobación y entrega en 7 a 14 días.",
    comission: "Comisión fija sobre el volumen total de crédito aprobado para el negocio.",
    formLink: "https://api.leadconnectorhq.com/widget/form/rYyJUvwRiMc0bsznMjOd?notrack=true",
    supportPhone: "tel:+18003605626",
    supportPhoneFormatted: "+1 (800) 360-5626"
  },
  {
    id: "mortgage-loan",
    title: "Préstamo Hipotecario",
    icon: Home,
    category: "financial",
    status: "active",
    statusLabel: "Activo",
    description: "Financiamiento integral para bienes raíces (residenciales y comerciales) adaptado a cada perfil: FHA (compradores primerizos), Convencionales, VA (veteranos), DSCR (inversionistas sin verificar ingresos personales) y Dinero Duro.",
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
    formLink: "https://app.emprende360.com/forms/mortgage",
    supportPhone: "tel:+18003604663",
    supportPhoneFormatted: "+1 (800) 360-4663"
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
    formLink: "https://app.emprende360.com/forms/credit-repair",
    supportPhone: "tel:+18003607372",
    supportPhoneFormatted: "+1 (800) 360-7372"
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
    formLink: "https://app.emprende360.com/forms/company-registration",
    supportPhone: "tel:+18003602677",
    supportPhoneFormatted: "+1 (800) 360-2677"
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
    formLink: "https://app.emprende360.com/forms/payroll",
    supportPhone: "tel:+18003607297",
    supportPhoneFormatted: "+1 (800) 360-7297"
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
    formLink: "https://app.emprende360.com/forms/pos",
    supportPhone: "tel:+18003607273",
    supportPhoneFormatted: "+1 (800) 360-7273"
  },
  {
    id: "auto-insurance",
    title: "Seguro de Auto",
    icon: Car,
    category: "professional",
    status: "active",
    statusLabel: "Activo",
    description: "Pólizas de seguro automotriz personal o comercial (flotillas), cotizando y comparando precios con las aseguradoras más importantes de USA.",
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
    formLink: "https://app.emprende360.com/forms/auto-insurance",
    supportPhone: "tel:+18003607233",
    supportPhoneFormatted: "+1 (800) 360-7233"
  },
  {
    id: "home-insurance",
    title: "Seguro de Casa",
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
    formLink: "https://app.emprende360.com/forms/home-insurance",
    supportPhone: "tel:+18003607233",
    supportPhoneFormatted: "+1 (800) 360-7233"
  },
  {
    id: "business-insurance",
    title: "Seguro de Negocio",
    icon: Laptop,
    category: "professional",
    status: "active",
    statusLabel: "Activo",
    description: "Coberturas de seguros comerciales clave como General Liability, BOP, Commercial Property y Workers Comp para blindar legal y financieramente la operación del negocio.",
    requirements: [
      "EIN y registro de empresa",
      "Descripción exacta de las operaciones, estimados de facturación y nómina anual",
      "Número de empleados y detalles físicos de la locación comercial"
    ],
    process: [
      "Entrevistar al cliente sobre los riesgos específicos de su industria.",
      "Enviar formulario al departamento de suscripción comercial de E360.",
      "El equipo cotiza con múltiples mercados especializados en riesgos comerciales.",
      "Revisión de coberturas con el cliente y emisión de certificados de seguro."
    ],
    timeframe: "Cotizaciones comerciales toman de 48 a 72 horas hábiles debido a revisiones de riesgo.",
    comission: "Comisión comercial según la póliza adjudicada (o referido a agentes de E360).",
    formLink: "https://app.emprende360.com/forms/business-insurance",
    supportPhone: "tel:+18003607233",
    supportPhoneFormatted: "+1 (800) 360-7233"
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
    formLink: "https://app.emprende360.com/forms/immigration",
    supportPhone: "tel:+18003604664",
    supportPhoneFormatted: "+1 (800) 360-4664"
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
    formLink: "https://app.emprende360.com/forms/tax",
    supportPhone: "tel:+18003608293",
    supportPhoneFormatted: "+1 (800) 360-8293"
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
    formLink: "https://app.emprende360.com/forms/life-insurance",
    supportPhone: "tel:+18003607233",
    supportPhoneFormatted: "+1 (800) 360-7233"
  },
  {
    id: "health-insurance",
    title: "Seguro Médico",
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
    formLink: "https://app.emprende360.com/forms/health-insurance",
    supportPhone: "tel:+18003607233",
    supportPhoneFormatted: "+1 (800) 360-7233"
  }
];

import MisClientesSection from "./components/MisClientesSection";
import SoporteSection from "./components/SoporteSection";
import MiPerfilSection from "./components/MiPerfilSection";
import { ActiveTab } from "./types";

export default function BrokerOnboardingClient() {
  const [mounted, setMounted] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [brokerName, setBrokerName] = useState<string>("");
  const [accessCode, setAccessCode] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("inicio");
  
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedService, setSelectedService] = useState<ServiceDetail | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [checkedServices, setCheckedServices] = useState<Record<string, { reqs: boolean; process: boolean; terms: boolean }>>({});

  // Cargar estado de sesión persistido
  useEffect(() => {
    setMounted(true);
    const savedAuth = localStorage.getItem("e360_broker_auth");
    const savedName = localStorage.getItem("e360_broker_name");
    if (savedAuth === "true" && savedName) {
      setIsAuthenticated(true);
      setBrokerName(savedName);
    }
  }, []);

  // Manejo del Login del Broker
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brokerName.trim()) {
      setLoginError("Por favor ingresa tu nombre completo");
      return;
    }
    // Permitir cualquier ingreso por defecto para facilitar pruebas, o un código simple si es requerido
    setIsAuthenticated(true);
    localStorage.setItem("e360_broker_auth", "true");
    localStorage.setItem("e360_broker_name", brokerName.trim());
    setLoginError("");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("e360_broker_auth");
    localStorage.removeItem("e360_broker_name");
  };

  // Filtrado de servicios según el buscador en tiempo real
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return servicesData;
    const query = searchQuery.toLowerCase();
    return servicesData.filter(service => 
      service.title.toLowerCase().includes(query) || 
      service.description.toLowerCase().includes(query) ||
      service.requirements.some(req => req.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  // Clasificación por columnas
  const financialServices = useMemo(() => 
    filteredServices.filter(s => s.category === "financial"), 
    [filteredServices]
  );

  const professionalServices = useMemo(() => 
    filteredServices.filter(s => s.category === "professional"), 
    [filteredServices]
  );

  // Copiar link de formulario al portapapeles
  const handleCopyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const toggleCheck = (serviceId: string, field: "reqs" | "process" | "terms") => {
    setCheckedServices(prev => {
      const current = prev[serviceId] || { reqs: false, process: false, terms: false };
      return {
        ...prev,
        [serviceId]: {
          ...current,
          [field]: !current[field]
        }
      };
    });
  };

  // Determinar color de estatus
  const getStatusColor = (status: "active" | "delay" | "paused" | "upcoming") => {
    switch (status) {
      case "active": return "bg-green-500 shadow-green-500/50";
      case "delay": return "bg-yellow-500 shadow-yellow-500/50";
      case "paused": return "bg-red-500 shadow-red-500/50";
      case "upcoming": return "bg-purple-500 shadow-purple-500/50";
    }
  };

  const getStatusBadge = (status: "active" | "delay" | "paused" | "upcoming") => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "delay": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "paused": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "upcoming": return "bg-purple-500/10 text-purple-300 border-purple-500/20";
    }
  };

  if (!mounted) {
    return <div className="fixed inset-0 bg-[#030812]" />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#030812] text-white overflow-y-auto flex flex-col font-sans">
      
      {/* Luces de Fondo Decorativas */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none z-0" />

      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          /* --- PANTALLA DE ACCESO (LOGIN GLASSMORPHISM) --- */
          <motion.div 
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow flex items-center justify-center p-6 relative z-10"
          >
            <div className="w-full max-w-md bg-[#0A182D]/70 backdrop-blur-xl border border-gray-800/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500" />
              
              <div className="flex flex-col items-center mb-8">
                <div className="relative h-12 w-44 mb-6">
                  <Image 
                    src="/logo.png" 
                    alt="E360 Logo" 
                    fill
                    priority
                    className="object-contain" 
                  />
                </div>
                <h2 className="text-xl font-bold text-center tracking-tight">Acceso Exclusivo para Brokers</h2>
                <p className="text-xs text-gray-400 text-center mt-2 leading-relaxed">
                  Ingresa tus credenciales oficiales de E360 Hub para desbloquear la guía rápida de servicios.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-widest mb-2">
                    Nombre del Broker
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                      type="text"
                      value={brokerName}
                      onChange={(e) => setBrokerName(e.target.value)}
                      placeholder="Ej. Yampiero de Dios"
                      className="w-full bg-[#05101F] border border-gray-800 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/80 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-widest mb-2">
                    Código de Acceso CRM
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                      type="password"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#05101F] border border-gray-800 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/80 transition-colors"
                    />
                  </div>
                </div>

                {loginError && (
                  <p className="text-xs font-semibold text-red-400 flex items-center gap-1.5 animate-pulse">
                    ⚠️ {loginError}
                  </p>
                )}

                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 text-black py-4 rounded-xl font-bold text-sm tracking-wide uppercase hover:opacity-90 transition-opacity active:scale-[0.98] transform flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,224,240,0.15)] cursor-pointer"
                >
                  <Lock size={16} /> Ingresar al Hub
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                  Documento de Diseño Web · Confidencial · 2026
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          /* --- PANTALLA PRINCIPAL (DASHBOARD HUB ONBOARDING) --- */
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow flex flex-col relative z-10 w-full"
          >
            {/* --- HEADER SUPERIOR --- */}
            <header className="sticky top-0 w-full z-40 bg-[#05101F]/90 backdrop-blur-md border-b border-gray-800/80 py-4 px-6">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                
                {/* Logo E360 */}
                <div className="relative h-9 w-32 cursor-pointer" onClick={() => setActiveTab("inicio")}>
                  <Image 
                    src="/logo.png" 
                    alt="E360 Logo" 
                    fill
                    className="object-contain" 
                  />
                </div>

                {/* Enlaces de Navegación del Hub */}
                <div className="hidden md:flex items-center gap-8">
                  {[
                    { id: "inicio", label: "Inicio / Servicios" },
                    { id: "clientes", label: "Mis Clientes (GHL)" },
                    { id: "soporte", label: "Soporte VIP" },
                    { id: "perfil", label: "Mi Perfil" }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as ActiveTab)}
                      className={`text-xs uppercase tracking-widest py-1 transition-all ${
                        activeTab === tab.id
                          ? "font-extrabold text-cyan-400 border-b-2 border-cyan-400"
                          : "font-semibold text-gray-400 hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Info Broker / Salida */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs font-bold text-white leading-none">{brokerName}</p>
                    <button 
                      onClick={handleLogout}
                      className="text-[10px] font-semibold text-gray-500 hover:text-red-400 transition-colors mt-1"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                  <div 
                    onClick={() => setActiveTab("perfil")}
                    className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm shadow-[0_0_15px_rgba(0,224,240,0.1)] cursor-pointer hover:border-cyan-400 transition-colors"
                  >
                    {brokerName.charAt(0).toUpperCase()}
                  </div>
                </div>

              </div>

              {/* Navegación Móvil */}
              <div className="flex md:hidden items-center justify-around pt-3 border-t border-gray-800/80 mt-3">
                {[
                  { id: "inicio", label: "Inicio" },
                  { id: "clientes", label: "Clientes" },
                  { id: "soporte", label: "Soporte" },
                  { id: "perfil", label: "Perfil" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                    className={`text-[10px] uppercase tracking-wider py-1 font-bold ${
                      activeTab === tab.id ? "text-cyan-400 border-b border-cyan-400" : "text-gray-400"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </header>

            {activeTab === "inicio" && (
              <>
                {/* --- HERO SECTION --- */}
                <section className="py-12 px-6 border-b border-gray-900 bg-gradient-to-b from-[#05101F]/40 to-transparent">
                  <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
                      Bienvenido, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-400 to-blue-600">{brokerName}</span>
                    </h1>
                    <p className="text-sm md:text-base text-gray-400 font-light mb-8 max-w-2xl mx-auto leading-relaxed">
                      Selecciona el servicio que necesitas para ver los requisitos, la hoja de ruta paso a paso, los tiempos y el contacto directo con soporte.
                    </p>

                    {/* Buscador Rápido */}
                    <div className="max-w-lg mx-auto relative">
                      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar servicio, requisito o palabra clave..."
                        className="w-full bg-[#0A182D]/80 border border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all shadow-inner"
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery("")}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-white"
                        >
                          Limpiar
                        </button>
                      )}
                    </div>
                  </div>
                </section>

                {/* --- COLUMNAS DE SERVICIOS --- */}
                <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-12">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    
                    {/* COLUMNA IZQUIERDA: SERVICIOS FINANCIEROS */}
                    <div>
                      <div className="flex items-center gap-3 mb-6 pb-2 border-b border-blue-900/30">
                        <div className="w-2.5 h-6 bg-blue-500 rounded-full" />
                        <h2 className="text-lg font-bold tracking-widest text-blue-400 uppercase">
                          Servicios Financieros
                        </h2>
                      </div>

                      {financialServices.length === 0 ? (
                        <p className="text-xs text-gray-600 py-4 italic">No se encontraron servicios financieros.</p>
                      ) : (
                        <div className="space-y-4">
                          {financialServices.map((service) => {
                            const IconComponent = service.icon;
                            return (
                              <motion.button
                                key={service.id}
                                whileHover={{ scale: 1.01, x: 4 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => setSelectedService(service)}
                                className="w-full bg-[#0A182D]/40 hover:bg-[#0A182D]/80 border border-gray-800/80 hover:border-blue-500/40 p-5 rounded-2xl flex items-center justify-between text-left transition-all group shadow-sm"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 group-hover:text-blue-300 transition-colors">
                                    <IconComponent size={22} />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-white group-hover:text-blue-300 transition-colors text-sm md:text-base">
                                      {service.title}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-[250px] md:max-w-[400px]">
                                      {service.description}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  {/* Estatus */}
                                  <div className="flex items-center gap-1.5 bg-gray-900/60 py-1.5 px-3 rounded-full border border-gray-800">
                                    <span className={`w-2 h-2 rounded-full ${getStatusColor(service.status)} relative`}>
                                      <span className={`absolute inset-0 rounded-full ${getStatusColor(service.status)} animate-ping opacity-75`} />
                                    </span>
                                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:inline">
                                      {service.statusLabel}
                                    </span>
                                  </div>
                                  <ChevronRight size={18} className="text-gray-600 group-hover:text-white transition-colors" />
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* COLUMNA DERECHA: SEGUROS Y SERVICIOS PROFESIONALES */}
                    <div>
                      <div className="flex items-center gap-3 mb-6 pb-2 border-b border-cyan-900/30">
                        <div className="w-2.5 h-6 bg-cyan-400 rounded-full" />
                        <h2 className="text-lg font-bold tracking-widest text-cyan-400 uppercase">
                          Seguros y Servicios Profesionales
                        </h2>
                      </div>

                      {professionalServices.length === 0 ? (
                        <p className="text-xs text-gray-600 py-4 italic">No se encontraron seguros o servicios profesionales.</p>
                      ) : (
                        <div className="space-y-4">
                          {professionalServices.map((service) => {
                            const IconComponent = service.icon;
                            return (
                              <motion.button
                                key={service.id}
                                whileHover={{ scale: 1.01, x: 4 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => setSelectedService(service)}
                                className="w-full bg-[#0A182D]/40 hover:bg-[#0A182D]/80 border border-gray-800/80 hover:border-cyan-500/40 p-5 rounded-2xl flex items-center justify-between text-left transition-all group shadow-sm"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 transition-colors">
                                    <IconComponent size={22} />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-white group-hover:text-cyan-300 transition-colors text-sm md:text-base">
                                      {service.title}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-[250px] md:max-w-[400px]">
                                      {service.description}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  {/* Estatus */}
                                  <div className="flex items-center gap-1.5 bg-gray-900/60 py-1.5 px-3 rounded-full border border-gray-800">
                                    <span className={`w-2 h-2 rounded-full ${getStatusColor(service.status)} relative`}>
                                      <span className={`absolute inset-0 rounded-full ${getStatusColor(service.status)} animate-ping opacity-75`} />
                                    </span>
                                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:inline">
                                      {service.statusLabel}
                                    </span>
                                  </div>
                                  <ChevronRight size={18} className="text-gray-600 group-hover:text-white transition-colors" />
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                </main>
              </>
            )}

            {activeTab === "clientes" && (
              <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-8">
                <MisClientesSection brokerName={brokerName} />
              </main>
            )}

            {activeTab === "soporte" && (
              <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-8">
                <SoporteSection brokerName={brokerName} />
              </main>
            )}

            {activeTab === "perfil" && (
              <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-8">
                <MiPerfilSection brokerName={brokerName} />
              </main>
            )}

            {/* --- PIE DE PÁGINA CONFIDENCIAL --- */}
            <footer className="w-full py-8 px-6 mt-auto border-t border-gray-900/80 bg-gray-950/40 text-center">
              <p className="text-xs text-gray-600 font-mono tracking-widest uppercase">
                Emprende 360 · E360 Hub — Documento de Diseño Web · Confidencial · 2026
              </p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- PANEL DE DETALLE (SLIDER SIDEBAR DE LA DERECHA) --- */}
      <AnimatePresence>
        {selectedService && (
          <>
            {/* Backdrop con Blur */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedService(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 cursor-pointer"
            />

            {/* Contenedor del Panel */}
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-[#0A182D] border-l border-gray-800/80 shadow-2xl z-[60] flex flex-col overflow-hidden"
            >
              
              {/* Encabezado del Panel */}
              <div className="p-6 border-b border-gray-800/80 bg-[#05101F]/80 flex justify-between items-center relative">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-400 to-blue-500" />
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400">
                    {(() => {
                      const Icon = selectedService.icon;
                      return <Icon size={24} />;
                    })()}
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-white">{selectedService.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold tracking-widest uppercase ${getStatusBadge(selectedService.status)}`}>
                        {selectedService.statusLabel}
                      </span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                        {selectedService.category === "financial" ? "Financiero" : "Seguros/Profesional"}
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedService(null)}
                  className="p-2 hover:bg-gray-800/80 rounded-full transition-colors text-gray-400 hover:text-white"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Cuerpo Scrollable */}
              <div className="p-6 md:p-8 overflow-y-auto flex-grow space-y-8">
                
                {/* Descripción General */}
                <div>
                  <h3 className="text-cyan-400 font-bold uppercase tracking-wider text-[10px] mb-3">
                    Descripción del Servicio
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed bg-[#05101F]/30 p-4 rounded-xl border border-gray-900">
                    {selectedService.description}
                  </p>
                </div>

                {/* Comisiones del Broker */}
                <div className="bg-gradient-to-r from-cyan-500/5 to-transparent border-l-2 border-cyan-500 p-4 rounded-r-xl">
                  <div className="flex items-center gap-2 mb-2 text-cyan-400">
                    <Coins size={16} />
                    <h4 className="text-xs font-bold uppercase tracking-widest">
                      Comisión / Beneficio del Broker
                    </h4>
                  </div>
                  <p className="text-gray-200 text-sm font-semibold leading-relaxed">
                    {selectedService.comission}
                  </p>
                </div>

                {/* Requisitos del Cliente */}
                <div>
                  <h3 className="text-cyan-400 font-bold uppercase tracking-wider text-[10px] mb-4">
                    Requisitos que el Cliente debe entregar
                  </h3>
                  <ul className="grid grid-cols-1 gap-3.5">
                    {selectedService.requirements.map((req, idx) => (
                      <li key={idx} className="flex gap-3 text-gray-300 text-xs leading-relaxed">
                        <CheckCircle2 size={16} className="text-cyan-500 shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Hoja de Ruta / Proceso Paso a Paso */}
                <div>
                  <h3 className="text-cyan-400 font-bold uppercase tracking-wider text-[10px] mb-6">
                    Procedimiento del Servicio (Hoja de Ruta)
                  </h3>
                  <div className="space-y-6 relative ml-3">
                    {/* Línea vertical conectora */}
                    <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-800" />
                    
                    {selectedService.process.map((step, idx) => (
                      <div key={idx} className="flex gap-4 relative z-10">
                        <div className="w-6 h-6 rounded-full bg-[#0A182D] border border-cyan-500/50 flex items-center justify-center text-[10px] font-bold text-cyan-400 shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-gray-300 text-xs leading-relaxed">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tiempos de Entrega */}
                <div className="flex items-center gap-3 bg-[#05101F]/60 border border-gray-800 p-4 rounded-2xl">
                  <div className="p-2.5 bg-cyan-950/40 rounded-xl text-cyan-400 border border-cyan-500/20">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Tiempo Estimado</h4>
                    <p className="text-gray-200 text-xs font-semibold mt-1">{selectedService.timeframe}</p>
                  </div>
                </div>

                {/* Confirmación Obligatoria de Términos y Requisitos */}
                {selectedService.status === "upcoming" ? (
                  <div className="bg-purple-950/30 border border-purple-500/30 p-5 rounded-2xl flex items-center gap-3">
                    <Clock size={22} className="text-purple-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">Servicio Disponible Próximamente</h4>
                      <p className="text-xs text-purple-200/80 mt-1 leading-relaxed">
                        Este servicio se encuentra en etapa final de preparación y estará 100% operativo para todos los brokers el próximo mes.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#05101F] border border-cyan-500/30 p-5 rounded-2xl space-y-3 shadow-inner">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                        <ShieldCheck size={16} />
                        <span>Confirmación de Lectura Obligatoria</span>
                      </h4>
                      <span className="text-[10px] font-mono font-semibold text-gray-500">3 de 3 requeridos</span>
                    </div>

                    <div className="space-y-2.5 text-xs text-gray-300">
                      {(() => {
                        const checks = checkedServices[selectedService.id] || { reqs: false, process: false, terms: false };
                        return (
                          <>
                            <label className="flex items-start gap-3 cursor-pointer select-none group">
                              <input 
                                type="checkbox"
                                checked={checks.reqs}
                                onChange={() => toggleCheck(selectedService.id, "reqs")}
                                className="mt-0.5 w-4 h-4 rounded border-gray-700 bg-black text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                              />
                              <span className="group-hover:text-white transition-colors">
                                Confirmo que el cliente cumple con los <strong>requisitos documentales mínimos</strong> solicitados.
                              </span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer select-none group">
                              <input 
                                type="checkbox"
                                checked={checks.process}
                                onChange={() => toggleCheck(selectedService.id, "process")}
                                className="mt-0.5 w-4 h-4 rounded border-gray-700 bg-black text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                              />
                              <span className="group-hover:text-white transition-colors">
                                He leído el <strong>procedimiento y hoja de ruta</strong> para orientar correctamente al cliente.
                              </span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer select-none group">
                              <input 
                                type="checkbox"
                                checked={checks.terms}
                                onChange={() => toggleCheck(selectedService.id, "terms")}
                                className="mt-0.5 w-4 h-4 rounded border-gray-700 bg-black text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                              />
                              <span className="group-hover:text-white transition-colors">
                                Acepto los <strong>términos de originación y políticas de comisión</strong> de E360 Hub.
                              </span>
                            </label>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

              </div>

              {/* Sección Inferior de Acciones / CTAs */}
              <div className="p-6 border-t border-gray-800/80 bg-[#05101F]/70 space-y-4">
                
                {(() => {
                  const isUpcoming = selectedService.status === "upcoming";
                  const checks = checkedServices[selectedService.id] || { reqs: false, process: false, terms: false };
                  const isUnlocked = !isUpcoming && checks.reqs && checks.process && checks.terms;

                  return (
                    <>
                      {/* Caja del Formulario con botón para copiar enlace */}
                      <div className={`border rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 transition-all ${
                        isUnlocked 
                          ? "bg-black/60 border-cyan-500/50 shadow-[0_0_20px_rgba(0,224,240,0.1)]" 
                          : "bg-black/20 border-gray-900 opacity-75"
                      }`}>
                        <div className="min-w-0 flex-grow">
                          <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Enlace del Formulario</p>
                          <p className="text-xs font-mono mt-1 truncate">
                            {isUpcoming ? (
                              <span className="text-purple-400 font-semibold">🔒 Próximamente disponible</span>
                            ) : isUnlocked ? (
                              <span className="text-cyan-400 font-bold">{selectedService.formLink}</span>
                            ) : (
                              <span className="text-amber-400/90 font-semibold">🔒 Marca las 3 casillas para desbloquear</span>
                            )}
                          </p>
                        </div>
                        
                        <div className="flex gap-2 shrink-0">
                          <button 
                            disabled={!isUnlocked}
                            onClick={() => isUnlocked && handleCopyLink(selectedService.formLink, selectedService.id)}
                            className={`px-3 py-2.5 rounded-xl transition-all text-xs font-bold flex items-center justify-center gap-1.5 ${
                              isUnlocked 
                                ? "bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white cursor-pointer" 
                                : "bg-gray-950 border border-gray-900 text-gray-600 cursor-not-allowed opacity-50"
                            }`}
                          >
                            {copiedId === selectedService.id ? (
                              <>
                                <Check size={14} className="text-green-400" />
                                <span className="text-green-400">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy size={14} />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                          
                          {isUnlocked ? (
                            <a 
                              href={selectedService.formLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors shadow-[0_0_15px_rgba(0,224,240,0.2)]"
                            >
                              <span>Abrir Formulario</span>
                              <ChevronRight size={14} />
                            </a>
                          ) : (
                            <button 
                              disabled 
                              className="px-4 py-2.5 bg-gray-800 text-gray-500 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-not-allowed opacity-50"
                            >
                              <span>Bloqueado</span>
                              <Lock size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Botón de Llamar al Soporte Específico */}
                <a 
                  href={selectedService.supportPhone} 
                  className="w-full bg-[#05101F] hover:bg-red-500/10 border border-gray-800 hover:border-red-500/30 text-white hover:text-red-400 py-3.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <Phone size={14} className="group-hover:animate-bounce" /> 
                  Llamar a Soporte ({selectedService.supportPhoneFormatted})
                </a>

              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
