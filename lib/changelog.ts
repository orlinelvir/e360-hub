// Catálogo de "Novedades del Hub" — un popup le muestra a cada persona, al
// iniciar sesión, solo lo que todavía no ha visto (ver
// app/api/changelog/route.ts y WhatsNewModal.tsx). Mismo patrón que
// lib/ai/guides.ts: un archivo de datos simple, editado a mano cada vez que
// se construye algo visible — no hay panel de administración para esto.
//
// Esta primera versión (noviembre 2026) se armó con un barrido completo del
// historial real de octubre-noviembre (git log), no solo de memoria — para
// que el primer rollout le muestre a todos, de una vez, todo lo que se
// perdieron, con fecha real de cuándo se publicó cada cosa. De aquí en
// adelante, agregar una entrada nueva cada vez que se construya algo visible
// debe ser parte normal del trabajo, no una tarea aparte.
//
// REGLAS AL AGREGAR UNA ENTRADA NUEVA:
// - "id" siempre sube en +1 desde la última entrada — nunca se reutiliza ni
//   se reordena uno ya publicado (es lo que determina qué es "nuevo" para
//   cada persona).
// - Nada de jerga técnica en el título ni la descripción — qué puede hacer
//   ahora la persona y en qué pestaña lo encuentra, nunca cómo está hecho.
// - "audience": "broker" (solo brokers), "staff" (solo empleados/admin,
//   nunca se le muestra a un broker), o "all" (ambos).
// - Se deja afuera a propósito lo que es pura corrección interna invisible
//   (nombres de parámetros de una API externa, reglas de seguridad del
//   lado del servidor, limpieza de código) — si la persona no nota ningún
//   cambio real al usar el Hub, no amerita una tarjeta aquí.

export type ChangelogAudience = "broker" | "staff" | "all";

export interface ChangelogEntry {
  id: number;
  date: string; // AAAA-MM-DD, solo para mostrar
  audience: ChangelogAudience;
  icon: string; // nombre de ícono de lucide-react, ver ICON_MAP en WhatsNewModal.tsx
  title: string;
  description: string;
  tabHint?: string; // "Pestaña X", o "Mi Perfil", etc.
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    id: 1,
    date: "2026-10-01",
    audience: "broker",
    icon: "Building2",
    title: "Contacto Directo actualizado",
    description: "El trámite de registro de empresas ya no se maneja aquí — ahora se hace directo con nuestro aliado RL Multisourcing.",
    tabHint: "Soporte VIP → Contacto Directo"
  },
  {
    id: 2,
    date: "2026-10-01",
    audience: "staff",
    icon: "Activity",
    title: "Actividad del equipo, visible",
    description: "Ahora puedes ver el último inicio de sesión y la ubicación aproximada de cada broker.",
    tabHint: "Panel de Admin"
  },
  {
    id: 3,
    date: "2026-10-08",
    audience: "broker",
    icon: "Building2",
    title: "Nuevo contacto para dudas de LLC, EIN e ITIN",
    description: "Línea directa con nuestro aliado RL Multisourcing, disponible de 10am a 6pm.",
    tabHint: "Soporte VIP → Contacto Directo"
  },
  {
    id: 4,
    date: "2026-10-20",
    audience: "broker",
    icon: "HandCoins",
    title: "Nuevo servicio: Negociación de Deudas (AdiosDeudas)",
    description: "Un nuevo producto para ayudar a tus clientes a negociar sus deudas, con su propio formulario y comisión.",
    tabHint: "Inicio / Servicios"
  },
  {
    id: 5,
    date: "2026-10-20",
    audience: "broker",
    icon: "Calculator",
    title: "Calculadora Hipotecaria",
    description: "Estima pagos y elegibilidad en FHA, Convencional, DSCR, Fix & Flip y más, con un directorio de ayuda de enganche por estado.",
    tabHint: "Soporte VIP → Formularios y Recursos"
  },
  {
    id: 6,
    date: "2026-10-20",
    audience: "broker",
    icon: "RefreshCcw",
    title: "Reparación de Crédito se ve distinto en tu tablero",
    description: "En vez de un monto y comisión genéricos, ahora ves tu ronda de seguimiento mensual de $10, que es lo que de verdad aplica a este servicio.",
    tabHint: "Mis Clientes (CRM)"
  },
  {
    id: 7,
    date: "2026-10-20",
    audience: "broker",
    icon: "Edit3",
    title: "Puedes corregir tu propia aplicación",
    description: "Si tu caso sigue pendiente de documentos o en revisión, ya puedes editarlo tú mismo sin pedirle el cambio a soporte.",
    tabHint: "Mis Clientes (CRM)"
  },
  {
    id: 8,
    date: "2026-10-20",
    audience: "staff",
    icon: "ArrowUpDown",
    title: "Master Feed: ordenar y agrupar",
    description: "Ahora puedes ordenar los casos por columna y agruparlos de forma colapsable por Estado, Prioridad o Categoría.",
    tabHint: "Panel de Admin → Master Feed de Casos"
  },
  {
    id: 9,
    date: "2026-10-20",
    audience: "broker",
    icon: "Megaphone",
    title: "Centro de Marketing",
    description: "Textos de anuncios y guiones de venta listos para usar, filtrados por servicio y por red social.",
    tabHint: "Soporte VIP → Formularios y Recursos"
  },
  {
    id: 10,
    date: "2026-10-20",
    audience: "staff",
    icon: "Rows3",
    title: "Encabezados que ya no estorban",
    description: "Se corrigieron los encabezados del Master Feed que a veces se quedaban pegados y tapaban información al desplazarte.",
    tabHint: "Panel de Admin → Master Feed de Casos"
  },
  {
    id: 11,
    date: "2026-10-20",
    audience: "staff",
    icon: "LayoutDashboard",
    title: "Torre de Control rediseñada",
    description: "Nueva pestaña \"Resumen\" con lo más urgente apenas entras, y el menú organizado por categoría en vez de una sola fila de botones.",
    tabHint: "Panel de Admin"
  },
  {
    id: 12,
    date: "2026-10-21",
    audience: "staff",
    icon: "KeyRound",
    title: "Credenciales del cliente, directo en el caso",
    description: "En Reparación de Crédito ya no hay que volver a pedirle la contraseña de su plataforma al cliente — se revela bajo demanda desde el mismo caso.",
    tabHint: "Panel de Admin → Master Feed de Casos"
  },
  {
    id: 13,
    date: "2026-10-21",
    audience: "staff",
    icon: "Mail",
    title: "Aviso por correo de casos nuevos",
    description: "Se puede activar para que soporte reciba un correo cada vez que entra un caso nuevo, de cualquier servicio.",
    tabHint: "Panel de Admin → Equipo & Roles"
  },
  {
    id: 14,
    date: "2026-10-23",
    audience: "broker",
    icon: "Umbrella",
    title: "Seguros con un nuevo aliado: Zein Insurance Services",
    description: "Auto, casa, negocio y compensación laboral se cotizan ahora con ZIS, nuestro nuevo aliado de seguros.",
    tabHint: "Inicio / Servicios → Seguros"
  },
  {
    id: 15,
    date: "2026-10-26",
    audience: "broker",
    icon: "ClipboardCheck",
    title: "Calificador de Clientes",
    description: "Evalúa el perfil de tu cliente contra 10 productos de financiamiento distintos y ve su probabilidad de calificar en cada uno.",
    tabHint: "Soporte VIP → Formularios y Recursos"
  },
  {
    id: 16,
    date: "2026-10-28",
    audience: "staff",
    icon: "BarChart3",
    title: "Métricas más precisas en el Master Feed",
    description: "Los contactos que nunca llegaron a pedir un servicio real ya no se cuentan en los números ni se mezclan con los casos de verdad.",
    tabHint: "Panel de Admin → Master Feed de Casos"
  },
  {
    id: 17,
    date: "2026-10-29",
    audience: "broker",
    icon: "IdCard",
    title: "Tu credencial oficial de broker",
    description: "Ya tienes un número de identificación oficial de E360, único para ti.",
    tabHint: "Mi Perfil"
  },
  {
    id: 18,
    date: "2026-10-29",
    audience: "broker",
    icon: "FileSignature",
    title: "Firma tu contrato directamente desde el Hub",
    description: "Ya no necesitas buscar el contrato en otro lado. Fírmalo ahí mismo, con la garantía de devolución de 90 días explicada en español sencillo.",
    tabHint: "Mi Perfil → Mi Contrato"
  },
  {
    id: 19,
    date: "2026-10-29",
    audience: "broker",
    icon: "RefreshCcw",
    title: "Reparación de Crédito con estados propios",
    description: "Activo, Pausado, Cancelado o Declinado, en vez de los estados genéricos de un préstamo que no aplicaban a este servicio.",
    tabHint: "Mis Clientes (CRM)"
  },
  {
    id: 20,
    date: "2026-11-01",
    audience: "broker",
    icon: "Landmark",
    title: "Software de Taxes E360",
    description: "Nueva sección explicando nuestro producto de preparación de impuestos, para que lo conozcas y se lo puedas ofrecer a tus clientes.",
    tabHint: "Software Taxes"
  },
  {
    id: 21,
    date: "2026-11-01",
    audience: "broker",
    icon: "Landmark",
    title: "Oficina Virtual E360 para Taxes",
    description: "Un espacio nuevo para gestionar tus casos, facturas y comisiones de la temporada de impuestos.",
    tabHint: "Oficina Virtual"
  },
  {
    id: 22,
    date: "2026-11-02",
    audience: "broker",
    icon: "KanbanSquare",
    title: "Tablero visual para tus clientes",
    description: "Ahora puedes ver todos tus casos organizados en columnas por su estado y moverlos simplemente arrastrándolos con el mouse.",
    tabHint: "Mis Clientes (CRM)"
  },
  {
    id: 23,
    date: "2026-11-02",
    audience: "broker",
    icon: "ListChecks",
    title: "Tareas y documentos por cliente",
    description: "Cada cliente ahora tiene su propio espacio para anotar tareas pendientes y guardar los documentos que te ha compartido.",
    tabHint: "Mis Clientes (CRM) → abre un cliente"
  },
  {
    id: 24,
    date: "2026-11-02",
    audience: "broker",
    icon: "MessageCircle",
    title: "Mensajes de WhatsApp listos para enviar",
    description: "Textos ya redactados para avisarle a tu cliente sobre su caso — solo los copias y los pegas en WhatsApp.",
    tabHint: "Mis Clientes (CRM) → abre un cliente"
  },
  {
    id: 25,
    date: "2026-11-03",
    audience: "broker",
    icon: "Landmark",
    title: "La Oficina Virtual de Taxes ya guarda todo de verdad",
    description: "Tus casos, facturas y comisiones de impuestos ahora se quedan guardados permanentemente — ya no desaparecen al recargar la página.",
    tabHint: "Oficina Virtual"
  },
  {
    id: 26,
    date: "2026-11-04",
    audience: "broker",
    icon: "ScanSearch",
    title: "Revisor de Reporte de Crédito con Inteligencia Artificial",
    description: "Sube el reporte de crédito de tu cliente (una foto, un PDF o el texto) y en minutos obtienes qué le está afectando el puntaje y un plan claro para mejorarlo — listo para explicárselo.",
    tabHint: "Revisor de Crédito"
  },
  {
    id: 27,
    date: "2026-11-05",
    audience: "broker",
    icon: "BookOpen",
    title: "Todas las guías oficiales, descargables en un solo lugar",
    description: "Las guías de cada servicio (MCA, SBA, Reparación de Crédito, Onboarding, Servicios Adicionales y más) ya se pueden descargar directamente, sin tener que pedirlas.",
    tabHint: "Recursos → Biblioteca de Guías"
  },
  {
    id: 28,
    date: "2026-11-05",
    audience: "broker",
    icon: "Award",
    title: "Examen de Conocimiento del CRM",
    description: "Un examen corto para repasar lo que aprendiste en tu capacitación del CRM — a tu propio ritmo, las veces que quieras.",
    tabHint: "Recursos"
  },
  {
    id: 29,
    date: "2026-11-05",
    audience: "staff",
    icon: "ShieldCheck",
    title: "Guía de Inducción descargable para el equipo",
    description: "El guion de la llamada de onboarding con el cliente, con lo que hay que decir en cada paso, ahora se descarga con un clic.",
    tabHint: "Panel de Admin (botón arriba)"
  },
  {
    id: 30,
    date: "2026-11-05",
    audience: "staff",
    icon: "Trash2",
    title: "Eliminar admisiones duplicadas",
    description: "Si un cliente quedó registrado por error más de una vez, ya se puede borrar el duplicado directamente, sin pedir ayuda técnica.",
    tabHint: "Panel de Admin → Master Feed de Casos"
  },
  {
    id: 31,
    date: "2026-11-05",
    audience: "staff",
    icon: "UserCheck",
    title: "Estado del examen y del contrato, de un vistazo",
    description: "En la ficha de cada broker ahora se ve de inmediato si aprobó su examen del CRM y si ya firmó su contrato — útil para revisar solicitudes de reembolso.",
    tabHint: "Panel de Admin → Brokers"
  },
  {
    id: 32,
    date: "2026-11-08",
    audience: "broker",
    icon: "Users",
    title: "Módulo de Clientes en Oficina Virtual",
    description: "Lleva un registro de los clientes de tus servicios de impuestos, separado de tus clientes de financiamiento y seguros.",
    tabHint: "Oficina Virtual → Clientes"
  },
  {
    id: 33,
    date: "2026-11-08",
    audience: "broker",
    icon: "KanbanSquare",
    title: "Workflow de impuestos con tablero de leads",
    description: "Organiza tus prospectos de temporada de taxes en un tablero que puedes mover con el mouse, con tus propias etapas.",
    tabHint: "Oficina Virtual → Workflow"
  },
  {
    id: 34,
    date: "2026-11-08",
    audience: "broker",
    icon: "ListChecks",
    title: "Tareas dentro de Oficina Virtual",
    description: "Anota pendientes de tu temporada de impuestos y márcalos como completados, igual que ya puedes hacerlo con tus otros clientes.",
    tabHint: "Oficina Virtual → Tasks"
  },
  {
    id: 35,
    date: "2026-11-08",
    audience: "broker",
    icon: "CalendarClock",
    title: "Citas y calendario en Oficina Virtual",
    description: "Agenda y consulta tus citas de impuestos en lista, por día o en un calendario del mes completo.",
    tabHint: "Oficina Virtual → Appointments"
  },
  {
    id: 36,
    date: "2026-11-08",
    audience: "broker",
    icon: "FileSignature",
    title: "Formularios con link para tu cliente",
    description: "Arma un formulario de intake de impuestos y mándale a tu cliente un link para que lo llene él mismo, sin necesitar cuenta ni contraseña.",
    tabHint: "Oficina Virtual → Forms & Contracts"
  },
  {
    id: 37,
    date: "2026-11-08",
    audience: "broker",
    icon: "Zap",
    title: "Automatizaciones y recordatorios",
    description: "Configura avisos automáticos para fechas límite próximas, facturas vencidas o tareas atrasadas de tus casos de impuestos.",
    tabHint: "Oficina Virtual → Automations"
  },
  {
    id: 38,
    date: "2026-11-08",
    audience: "broker",
    icon: "LayoutDashboard",
    title: "Dashboard de Oficina Virtual con filtro de fechas real",
    description: "Los números principales ahora sí cambian según el rango de fechas que elijas, incluyendo un rango personalizado.",
    tabHint: "Oficina Virtual → Dashboard"
  },
  {
    id: 39,
    date: "2026-11-08",
    audience: "broker",
    icon: "Receipt",
    title: "Facturación de impuestos más completa",
    description: "Marca tus facturas como borrador, enviada, pagada o vencida, y cambia la fecha de vencimiento cuando haga falta.",
    tabHint: "Oficina Virtual → Facturación"
  },
  {
    id: 40,
    date: "2026-11-08",
    audience: "broker",
    icon: "Percent",
    title: "Reporte de comisiones de impuestos exportable",
    description: "Filtra tus comisiones por preparador o por fecha y descarga el reporte en PDF o Excel.",
    tabHint: "Oficina Virtual → Comisiones"
  },
  {
    id: 41,
    date: "2026-11-09",
    audience: "broker",
    icon: "ScanSearch",
    title: "El Revisor de Reporte de Crédito ya no falla",
    description: "Se corrigió un problema que hacía fallar el análisis en reportes grandes — ahora reintenta con otro modelo de IA automáticamente en vez de rendirse.",
    tabHint: "Revisor de Crédito"
  },
  {
    id: 42,
    date: "2026-11-09",
    audience: "broker",
    icon: "ScanSearch",
    title: "Puntajes exactos en el Revisor de Crédito",
    description: "La barra de cada buró (Equifax, Experian, TransUnion) ahora siempre muestra el número exacto del puntaje, en vez de quedarse en blanco.",
    tabHint: "Revisor de Crédito"
  },
  {
    id: 43,
    date: "2026-11-10",
    audience: "all",
    icon: "Rows3",
    title: "Se corrigió un scroll horizontal que aparecía de más",
    description: "Algunas pantallas mostraban una barra de desplazamiento lateral innecesaria. Ya no debería aparecer en ninguna página.",
    tabHint: "Todo el sitio"
  },
  {
    id: 44,
    date: "2026-11-10",
    audience: "broker",
    icon: "Building2",
    title: "Nuevo: formulario de Business Credit Program",
    description: "Mándale a tu cliente un link para que te dé los datos que necesitas para tramitar su número D-U-N-S y sus vendor accounts — sin límite de clientes.",
    tabHint: "Mis Clientes (CRM)"
  },
  {
    id: 45,
    date: "2026-11-10",
    audience: "broker",
    icon: "Edit3",
    title: "Corrige una captura del Business Credit Program sin reenviarla",
    description: "Si tu cliente anotó mal un dato, ya lo puedes corregir tú mismo desde la lista de capturas recibidas.",
    tabHint: "Mis Clientes (CRM) → Business Credit Program"
  },
  {
    id: 46,
    date: "2026-11-10",
    audience: "broker",
    icon: "ImageIcon",
    title: "Tu logo en el formulario de Business Credit Program",
    description: "Sube tu logo desde tu perfil y tus clientes lo verán a ellos en vez del logo de Emprende 360 al llenar ese formulario.",
    tabHint: "Mi Perfil"
  },
  {
    id: 47,
    date: "2026-11-10",
    audience: "broker",
    icon: "Sparkles",
    title: "Mis Clientes, más despejado",
    description: "Se reorganizaron los botones de la parte de arriba para que no se amontonen entre sí.",
    tabHint: "Mis Clientes (CRM)"
  }
];

export function getLatestChangelogId(): number {
  return CHANGELOG.reduce((max, e) => Math.max(max, e.id), 0);
}
