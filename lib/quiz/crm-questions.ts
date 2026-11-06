import { QuizQuestion } from "@/app/hub/broker-onboarding/types";

// 80% — ajustable; no hay un número "oficial" confirmado por E360 todavía.
// Vive aquí (no en quiz-service.ts) porque este archivo no importa nada de
// servidor (firebase-admin) y lo puede leer tanto el cliente como la API.
export const QUIZ_PASS_PERCENTAGE = 80;

// Banco de preguntas del Examen de Conocimiento del CRM — basado fielmente en
// el contenido de "Guía de Onboarding E360.pdf" (las 7 fases + checklist
// final), no inventado. Si la guía cambia, actualizar aquí también.
//
// correctIndex es 0-indexado. El grading real pasa por
// lib/services/quiz-service.ts en el servidor — nunca se confía en lo que
// mande el cliente sobre qué respuesta es correcta.
export const CRM_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "acceso-1",
    phase: "Acceso y Perfil",
    question: "¿En qué sección configuras tu zona horaria?",
    options: ["Calendarios > Crear calendario", "Settings > My Profile", "Contactos > Etiquetas", "Marketing > Social Planner"],
    correctIndex: 1,
    explanation: "La zona horaria se configura en Settings > My Profile — la guía la marca como 'crítico'."
  },
  {
    id: "acceso-2",
    phase: "Acceso y Perfil",
    question: "¿Por qué es tan importante configurar bien tu zona horaria desde el primer día?",
    options: [
      "Porque cambia el idioma del CRM",
      "Si queda mal, las citas y recordatorios llegan a mala hora",
      "Porque afecta el precio de tu suscripción",
      "No tiene ningún efecto real"
    ],
    correctIndex: 1,
    explanation: "Si la zona horaria queda mal configurada, las citas y recordatorios llegan a mala hora."
  },
  {
    id: "acceso-3",
    phase: "Acceso y Perfil",
    question: "¿Cuál es la URL para iniciar sesión en tu cuenta de E360?",
    options: ["app.startpoint.biz", "hub.emprende360.com", "e360library.com", "gohighlevel.com"],
    correctIndex: 0,
    explanation: "Se ingresa en app.startpoint.biz y se recomienda guardarlo en favoritos."
  },
  {
    id: "acceso-4",
    phase: "Acceso y Perfil",
    question: "¿Qué app móvil se descarga para gestionar el negocio desde el teléfono?",
    options: ["Slack", "LeadConnector (o la de marca blanca)", "Zoom", "Asana"],
    correctIndex: 1,
    explanation: "La app móvil es LeadConnector (o su versión de marca blanca), disponible en App Store y Google Play."
  },
  {
    id: "centro-comando-1",
    phase: "El Centro de Comando",
    question: "¿Cuál es el atajo de teclado del buscador universal del CRM?",
    options: ["Ctrl+F", "Ctrl+K", "Ctrl+S", "Ctrl+P"],
    correctIndex: 1,
    explanation: "Ctrl+K es el atajo más rápido de la plataforma para buscar contactos, campañas o páginas."
  },
  {
    id: "centro-comando-2",
    phase: "El Centro de Comando",
    question: "¿Cuál de estos NO forma parte de 'Gestión Diaria' (lo que usarás todos los días)?",
    options: ["Conversaciones", "Calendarios", "Reputación", "Contactos"],
    correctIndex: 2,
    explanation: "Reputación es parte de los 'Motores de Crecimiento', no de la Gestión Diaria (Launchpad, Tablero, Conversaciones, Calendarios, Contactos, Clientes Potenciales y Pagos)."
  },
  {
    id: "centro-comando-3",
    phase: "El Centro de Comando",
    question: "¿Dónde revisas el rendimiento de tus anuncios de Google y Facebook?",
    options: ["Informes (Análisis y Administración)", "Conversaciones", "Suscripciones", "Clientes Potenciales"],
    correctIndex: 0,
    explanation: "Informes, dentro de Análisis y Administración, muestra métricas de anuncios, llamadas y rendimiento."
  },
  {
    id: "dominios-1",
    phase: "Dominios e Integraciones",
    question: "¿Qué beneficios incluye conectar un dominio interno (comprar o transferir) desde la misma plataforma?",
    options: [
      "Solo cambia el color del sitio",
      "DNS sin problemas, SSL gratis, protección DDoS y privacidad WHOIS",
      "Nada, es solo estético",
      "Reduce el precio de la suscripción"
    ],
    correctIndex: 1,
    explanation: "Los dominios internos incluyen gestión de DNS, SSL gratis, protección DDoS y privacidad WHOIS."
  },
  {
    id: "dominios-2",
    phase: "Dominios e Integraciones",
    question: "¿Desde dónde se conecta Google Calendar, a diferencia del resto de integraciones?",
    options: ["Desde Mi Perfil", "Desde Configuración > Integraciones", "Desde Marketing", "No se puede conectar"],
    correctIndex: 0,
    explanation: "A diferencia de las demás integraciones, Google Calendar se conecta desde Mi Perfil."
  },
  {
    id: "dominios-3",
    phase: "Dominios e Integraciones",
    question: "¿Cuáles de estas son plataformas de pago/contabilidad que se pueden integrar?",
    options: ["Stripe, PayPal, Square, QuickBooks y Xero", "Solo Venmo", "Solo criptomonedas", "No se pueden integrar pagos"],
    correctIndex: 0,
    explanation: "Pagos: Stripe, PayPal, Square y más. Contabilidad: QuickBooks y Xero."
  },
  {
    id: "equipo-1",
    phase: "Gestión del Equipo",
    question: "Al agregar un nuevo usuario, ¿qué dos tipos de usuario existen?",
    options: ["Admin y Super Admin", "Agency (equipo interno) o Account (cuentas específicas)", "Gratis y Pago", "Broker y Cliente"],
    correctIndex: 1,
    explanation: "El Tipo de Usuario puede ser Agency (equipo interno) o Account (cuentas específicas)."
  },
  {
    id: "equipo-2",
    phase: "Gestión del Equipo",
    question: "Si borras o desactivas a un usuario, ¿qué pasa con sus registros?",
    options: [
      "Se borran por completo junto con el usuario",
      "Se quedan guardados y se pueden reasignar",
      "Se transfieren automáticamente a otro broker al azar",
      "Quedan bloqueados para siempre"
    ],
    correctIndex: 1,
    explanation: "El usuario pierde el acceso, pero sus registros se quedan para poder reasignarlos."
  },
  {
    id: "equipo-3",
    phase: "Gestión del Equipo",
    question: "¿Cuáles son las dos formas de restablecer la contraseña de un usuario?",
    options: [
      "Solo llamando a soporte de GHL",
      "Auto-servicio ('¿Olvidaste tu contraseña?') o que el admin la edite directamente",
      "No se puede restablecer una contraseña",
      "Solo borrando y creando el usuario de nuevo"
    ],
    correctIndex: 1,
    explanation: "Opción A: el usuario usa '¿Olvidaste tu contraseña?'. Opción B: el admin edita al usuario y cambia la clave."
  },
  {
    id: "calendarios-1",
    phase: "Calendarios y Citas",
    question: "¿Qué tipo de calendario reparte las citas entre varios miembros del equipo según su disponibilidad?",
    options: ["Simple (Unassigned)", "Round Robin", "Clase / Evento grupal", "Ninguno de los anteriores"],
    correctIndex: 1,
    explanation: "Round Robin reparte las citas entre el equipo de ventas según disponibilidad."
  },
  {
    id: "calendarios-2",
    phase: "Calendarios y Citas",
    question: "¿Para qué sirve el 'Buffer Time' en la disponibilidad de un calendario?",
    options: [
      "Para cobrar más caro la cita",
      "Es el respiro (tiempo de preparación) antes o después de cada cita",
      "Para traducir el calendario a otro idioma",
      "Para eliminar citas automáticamente"
    ],
    correctIndex: 1,
    explanation: "El Buffer Time es el tiempo de amortiguación antes o después de cada cita para evitar sobrecarga."
  },
  {
    id: "calendarios-3",
    phase: "Calendarios y Citas",
    question: "¿Para qué conectas Google o Outlook como 'calendario de conflictos' en Mi Perfil?",
    options: [
      "Para cambiar el logo del calendario",
      "Para evitar dobles reservas con sincronización de dos vías",
      "Es obligatorio y no tiene ningún efecto",
      "Para desactivar las notificaciones"
    ],
    correctIndex: 1,
    explanation: "La sincronización de dos vías con Google/Outlook evita choques de horario (dobles reservas)."
  },
  {
    id: "landing-1",
    phase: "Landing Pages",
    question: "¿Cuál es la secuencia típica de un embudo (funnel)?",
    options: [
      "Página de gracias → Landing page → Registro",
      "Landing page → Página de registro → Página de gracias",
      "Registro → Gracias → Landing page",
      "No hay una secuencia fija"
    ],
    correctIndex: 1,
    explanation: "Un embudo es una secuencia de pasos: Landing page, Página de registro y Página de gracias."
  },
  {
    id: "landing-2",
    phase: "Landing Pages",
    question: "En el editor visual, ¿cuáles son las tres capas de un embudo, de más grande a más chica?",
    options: [
      "Botones, textos e imágenes",
      "Secciones, filas y columnas, y elementos",
      "Dominio, SSL y DNS",
      "Formulario, pago y confirmación"
    ],
    correctIndex: 1,
    explanation: "Secciones (el contenedor más grande), filas y columnas (el esqueleto), y elementos (textos, imágenes, formularios, botones)."
  },
  {
    id: "landing-3",
    phase: "Landing Pages",
    question: "Si no estás seguro de si debes borrar una sección de tu landing page, ¿qué recomienda la guía?",
    options: ["Borrarla de inmediato", "Ocultarla, no eliminarla", "Duplicar todo el sitio", "Contactar a soporte de GHL"],
    correctIndex: 1,
    explanation: "Uno de los 'tres hábitos para editar sin sustos' es: si no estás seguro de una sección, ocúltala temporalmente en vez de borrarla."
  },
  {
    id: "formularios-1",
    phase: "Formularios",
    question: "¿Dónde revisas los formularios que un cliente ya llenó?",
    options: ["Forms > Submissions", "Marketing > Reputación", "Pagos > Facturas", "Calendarios > Disponibilidad"],
    correctIndex: 0,
    explanation: "En Sitios > Forms > Submissions se ven los envíos de los formularios."
  },
  {
    id: "formularios-2",
    phase: "Formularios",
    question: "¿Cuáles son las dos formas de compartir un formulario ya terminado?",
    options: [
      "Solo por correo manual",
      "Link (URL corta) o Embed (código HTML)",
      "No se pueden compartir, solo usar dentro del CRM",
      "Solo mediante una llamada telefónica"
    ],
    correctIndex: 1,
    explanation: "Se comparte con 'Integrate': Link para WhatsApp/redes/correo, o Embed para insertarlo en un sitio externo."
  },
  {
    id: "checklist-1",
    phase: "Checklist Final",
    question: "Según el checklist final de la guía, ¿qué debe estar listo para que tu cuenta E360 'ya trabaje para ti'?",
    options: [
      "Solo la contraseña",
      "Solo el dominio conectado",
      "Contraseña/zona horaria/firma, app instalada, dominio e integraciones, equipo, calendario, landing page y formulario",
      "Nada en particular, basta con iniciar sesión"
    ],
    correctIndex: 2,
    explanation: "El checklist final cubre los 7 puntos: desde contraseña y zona horaria hasta el formulario creado e integrado."
  }
];
