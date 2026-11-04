export type ActiveTab = "inicio" | "clientes" | "oficina-virtual" | "taxes" | "revisor-credito" | "soporte" | "perfil" | "admin" | "recursos";

export type PipelineStage =
  | "lead"
  | "qualification"
  | "docs_pending"
  | "submitted"
  | "approved"
  | "paid"
  | "rejected";

export interface ClientLead {
  id: string;
  // Ver nota en lib/services/broker-service.ts ClientLeadData — denormalizado
  // para que un caso creado por "Referir Cliente" no quede en desventaja
  // frente a los otros 2 caminos de creación de casos.
  brokerId?: string;
  brokerName?: string;
  brokerEmail?: string;
  name: string;
  email: string;
  phone: string;
  serviceId: string;
  serviceName: string;
  amount: number;
  estimatedCommission: number;
  stage: PipelineStage;
  createdAt: string;
  lastActivity: string;
  ghlContactId: string;
  ghlOpportunityId?: string;
  notes: string;
  // Denormalizado desde la subcolección feeRounds (solo aplica a Reparación de Crédito)
  // para poder mostrar el estado del fee sin una lectura extra por cliente.
  feeRoundStatus?: "pending_review" | "paid";
  feeRoundNumber?: number;
  // Estado real de la solicitud (pending_docs/in_review/approved/rejected/funded
  // — ver lib/services/case-status.ts), actualizado por Admin/Underwriting o por
  // GHL (distinto de `stage`, que es el seguimiento propio del broker). Solo
  // lectura para el broker.
  status?: string;
  // Resultado de la sincronización con GHL (pending/synced/failed), separado a
  // propósito de `status` — antes ambos vivían mezclados en el mismo campo.
  syncStatus?: string;
  // Último umbral de horas hábiles (24/48/72) ya notificado por el cron de
  // alertas — evita repetir el mismo aviso cada día que el caso sigue pendiente.
  lastPendingAlertHours?: number;
  adminNotes?: string;
  // "ghl_sync": contacto crudo importado de la subcuenta GHL del broker, no
  // una solicitud de servicio real — ver lib/services/broker-service.ts.
  source?: "ghl_sync";
  // Solo Reparación de Crédito — el broker confirma que el cliente llenó el
  // formulario oficial de E360 (GHL) al admitirlo. No bloquea la admisión
  // (a diferencia de officialFormConfirmed en el flujo genérico de
  // financiamiento, que sí es un gate pero nunca se guarda) — aquí sí se
  // persiste, para que el checklist del admin refleje estado real.
  officialFormConfirmed?: boolean;
}

// Secuencia de citas de onboarding de un broker nuevo (Ventas -> Onboarding Básico
// -> Onboarding CRM -> Redes Sociales, solo si pagó el 100% del paquete de $750).
// El staff la avanza manualmente desde el Roster de Brokers, ya que los enlaces de
// agenda de GHL cambian cada vez y no se pueden pre-cablear por etapa.
export type OnboardingStage = "ventas" | "onboarding_basico" | "onboarding_crm" | "redes_sociales" | "completado";

export interface BrokerProfileData {
  uid: string;
  displayName: string;
  email: string;
  name?: string;
  brokerId?: string;
  // Entero crudo detrás de brokerId (ej. 123 para "E360-000123") — se guarda
  // junto a brokerId en la misma transacción (ver
  // lib/services/broker-registration.ts) para no tener que parsear el string.
  brokerSequence?: number;
  phone?: string;
  tier?: "Junior Broker" | "Senior Broker VIP" | "Master Broker" | string;
  onboardingStage?: OnboardingStage;
  // Reflejo del tag "payment completed (spanish)" en la subcuenta GHL de Emprende 360,
  // verificado manualmente por el staff (botón "Verificar Pago"), no sincronizado en vivo.
  packagePaid?: boolean;
  taxOfficeAccess?: boolean;
  ghlLocationId?: string;
  ghlApiKey?: string;
  ghlSubaccountEmail?: string;
  ghlConnected?: boolean;
  nmlsId?: string;
  licenseNumber?: string;
  businessName?: string;
  whatsapp?: string;
  city?: string;
  state?: string;
  bio?: string;
  role?: string;
  payoutMethod?: "ach" | "zelle" | "wire";
  payoutDetails?: {
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    zellePhoneOrEmail?: string;
  };
  referralSlug?: string;
  // uid del broker que lo refirió (resuelto por servidor a partir del ?ref=slug
  // capturado al registrarse). $100 de comisión se acredita a ESE broker cuando
  // este perfil confirma el pago del paquete de $750 (ver packagePaid arriba).
  referredByUid?: string;
  // Acumulado de comisiones de $100 por cada broker referido que confirmó su
  // pago — solo un contador visible, el pago real se hace por fuera (ACH/Zelle)
  // igual que el resto de comisiones.
  referralEarnings?: number;
  totalVolumeProcessed?: number;
  totalCommissionsPaid?: number;
  documentsStatus?: {
    brokerAgreement?: boolean;
    w9Form?: boolean;
    directDepositAuth?: boolean;
  };
  // Contrato de Servicios de E360 (el que incluye la garantía de devolución
  // de 90 días / $750) — firmado vía un formulario externo de GHL embebido
  // en "Mi Contrato". `contractSignedAt`/`contractSignedMethod` son
  // autoritativos (solo el backend los escribe: el webhook de GHL si está
  // configurado, o un admin confirmando manualmente desde el Roster).
  // `contractSignedSelfReported` es lo que el propio broker puede marcar
  // ("Ya firmé") mientras no hay confirmación real — solo informativo para
  // staff, nunca se trata como la firma confirmada.
  contractSignedAt?: string;
  contractSignedMethod?: "manual" | "webhook";
  contractSignedSelfReported?: boolean;
  contractSignedSelfReportedAt?: string;
  createdAt?: string;
  // Último inicio de sesión — ubicación aproximada por IP (la que provee
  // automáticamente la red de Vercel, sin servicio externo ni costo). Nunca
  // ubicación precisa/GPS: el navegador no lo permite sin pedir permiso
  // explícito cada vez, así que esto es lo único que se puede capturar sin
  // que el usuario tenga que aceptar nada en cada acceso.
  lastLogin?: {
    at: string;
    ip?: string;
    city?: string;
    region?: string;
    country?: string;
    userAgent?: string;
  };
}

// Un registro histórico por cada inicio de sesión — vive en la subcolección
// brokers/{uid}/loginHistory, separado de `lastLogin` (que solo guarda el más
// reciente) para poder ver un historial, no solo el último acceso.
export interface LoginHistoryEntry {
  id?: string;
  at: string;
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  userAgent?: string;
}

// Nuevos tipos para soporte
export interface SupportConversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: "active" | "escalated" | "closed";
  escalatedTo?: string;
}

export interface ChatMessage {
  id?: string;
  role: "user" | "model";
  content: string;
  createdAt: string;
}

// Categorías de ticket alineadas 1:1 con los departamentos reales de Contacto Directo,
// así cada ticket tiene un dueño claro en vez de caer todo en una bandeja genérica.
export type TicketCategory =
  | "general"
  | "ghl_crm"
  | "commission"
  | "underwriting"
  | "credit_repair"
  | "onboarding"
  | "marketing"
  | "corporate_tax";

export interface SupportTicketV2 {
  id: string;
  subject: string;
  category: TicketCategory;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
  updatedAt: string;
  description: string;
  conversationId?: string;
  // Caso propio del broker vinculado al ticket (opcional), para que el empleado
  // salte directo al Expediente de Caso en vez de buscar al cliente por nombre.
  relatedClientId?: string;
  relatedClientName?: string;
  // Campo adicional específico de la categoría (ej. "disputedAmount" en Comisiones,
  // "errorMessage" en CRM Técnico) — ver lib/support/ticket-categories.ts.
  categoryFields?: Record<string, string>;
  attachmentPath?: string;
  attachmentFileName?: string;
  attachmentContentType?: string;
  // Resuelto en el servidor al leer el ticket (URL firmada, 15 min) — nunca se guarda.
  attachmentUrl?: string;
  // ---- Seguimiento de SLA / métricas de soporte (lib/support/ticket-sla.ts) ----
  // Primera respuesta de un agente (se fija al responder; mide el SLA de respuesta).
  firstResponseAt?: string;
  // Cuándo se resolvió (se fija al pasar a "resolved"; mide tiempo de resolución).
  resolvedAt?: string;
  // Escalación automática por vencimiento de SLA (cron ticket-escalations).
  // `escalated` es el estado actual (se limpia cuando el agente responde);
  // `escalatedAt`/`escalationReason` quedan como histórico.
  escalated?: boolean;
  escalatedAt?: string;
  escalationReason?: string;
  // Encuesta de satisfacción del broker al cerrar el ticket (1-5).
  rating?: number;
  ratingComment?: string;
  ratedAt?: string;
}

export interface TicketMessage {
  id?: string;
  sender: "broker" | "agent";
  senderName: string;
  // uid real de quien respondió (solo "agent") — permite medir actividad de
  // staff por persona en vez de solo por nombre (que puede repetirse/cambiar).
  senderId?: string;
  content: string;
  createdAt: string;
}

// Expediente de Caso (Financiamiento/Seguros): notas segmentadas por audiencia.
// "observation" y "case" son internas (admin/especialista de la vertical, nunca el
// broker); "broker" es la única categoría visible para el broker dueño del cliente.
export type CaseNoteCategory = "observation" | "case" | "broker";

export interface CaseNote {
  id: string;
  category: CaseNoteCategory;
  content: string;
  authorName: string;
  authorId: string;
  createdAt: string;
}

export interface CaseDocument {
  id: string;
  fileName: string;
  storagePath: string;
  contentType: string;
  size: number;
  uploadedByName: string;
  uploadedById: string;
  createdAt: string;
  // Sin categoría, la mayoría de documentos quedan sin distinguir de nada más
  // ("Documentos" los mezcla todos). Por ahora solo distingue el PDF firmado
  // de Reparación de Crédito (ver CreditRepairIntakeModal.tsx) del resto.
  documentType?: "signed_agreement";
}

export interface CaseTask {
  id: string;
  clientId: string;
  title: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
  createdAt: string;
}

// ==========================================
// OFICINA VIRTUAL E360 (TAX OFFICE SYSTEM)
// ==========================================

export type TaxCaseStage =
  | "new"              // Nuevo Lead / Expediente Creado
  | "docs_pending"     // Esperando W-2s, 1099, IDs
  | "in_review"        // En revisión / preparación
  | "ready_to_file"    // Listo para e-file / firmado
  | "transmitted"      // Transmitido al IRS
  | "accepted"         // Aprobado por el IRS
  | "rejected";        // Rechazado (requiere corrección)

export type TaxServiceType =
  | "1040_personal"    // Declaración Personal (W-2, 1099)
  | "schedule_c"       // 1040 con Anexo C (Trabajador Independiente / Sole Prop)
  | "1120_corp"        // Corporación C (Form 1120)
  | "1120s_scorp"      // Corporación S (Form 1120-S)
  | "1065_partnership" // Sociedad Comercial (Form 1065)
  | "amendment_1040x"  // Enmienda de Año Anterior (1040-X)
  | "itin_application"; // Solicitud o Renovación W-7 / ITIN

export interface TaxCase {
  id: string;
  brokerId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  taxYear: number;
  serviceType: TaxServiceType;
  stage: TaxCaseStage;
  filingStatus?: "single" | "married_joint" | "married_separate" | "head_of_household" | "qualifying_widow";
  agreedFee: number;
  bankProduct: boolean;
  bankPartner?: "sbtpg" | "refund_advantage" | "republic" | "eps" | "none";
  refundAdvanceRequested?: boolean;
  estimatedRefund?: number;
  assignedPreparer?: string;
  documentsCount: number;
  notes?: string;
  irsAckCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaxInvoice {
  id: string;
  invoiceNumber: string;
  caseId?: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  status: "paid" | "pending" | "overdue" | "cancelled";
  paymentMethod: "refund_deduction" | "card" | "zelle" | "cash";
  taxYear: number;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
}

export interface TaxCommissionItem {
  id: string;
  preparerName: string;
  preparerEmail: string;
  totalReturns: number;
  grossVolume: number;
  splitPercentage: number;
  e360FeeDeduction: number; // $60 si está bajo mentoría / EFIN E360
  netCommission: number;
  status: "pending" | "paid";
  lastPayoutDate?: string;
}

// Datos de entrada que el broker llena en los formularios de creación — el
// servidor asigna id/brokerId/stage/documentsCount/timestamps (TaxCase) o
// invoiceNumber/dueDate/createdAt (TaxInvoice), y calcula e360FeeDeduction/
// netCommission a partir de los campos crudos (TaxCommissionItem).
export type NewTaxCaseInput = Omit<TaxCase, "id" | "brokerId" | "stage" | "documentsCount" | "createdAt" | "updatedAt">;

export type NewTaxInvoiceInput = Pick<TaxInvoice, "clientName" | "clientEmail" | "amount" | "paymentMethod" | "taxYear"> & {
  caseId?: string;
};

export interface NewTaxCommissionInput {
  preparerName: string;
  preparerEmail: string;
  totalReturns: number;
  grossVolume: number;
  splitPercentage: number;
  underMentorship: boolean;
}

// ==========================================
// REVISOR DE REPORTE DE CRÉDITO (IA)
// ==========================================
// Forma exacta del JSON que Gemini debe devolver — ver
// lib/ai/credit-report-prompt.ts, que es la fuente de verdad real del schema
// que se le pide al modelo. Los nombres de campo están en español a propósito:
// son literalmente las claves del JSON que el modelo devuelve.

export type CreditReportDisputable = "si" | "posible" | "no";
export type CreditReportImpact = "alto" | "medio" | "bajo";
export type CreditReportIssueType =
  | "pago_tardio"
  | "coleccion"
  | "charge_off"
  | "consulta_dura"
  | "utilizacion_alta"
  | "error_de_datos"
  | "cuenta_duplicada"
  | "cuenta_no_reconocida"
  | "bancarrota_o_registro_publico"
  | "historial_corto"
  | "otro";

export interface CreditReportScore {
  buro: string;
  score: number | null;
}

export interface CreditReportIssue {
  prioridad: number;
  tipo: CreditReportIssueType;
  es_negativo: boolean;
  acreedor: string | null;
  cuenta_ultimos4: string | null;
  buros: string[];
  detalle: string | null;
  impacto: CreditReportImpact;
  disputable: CreditReportDisputable;
  motivo: string | null;
  accion: string | null;
  explicacion_cliente: string | null;
  verificar_con_cliente: string | null;
}

export interface CreditReportCard {
  acreedor: string;
  limite: number | null;
  balance: number | null;
  porcentaje: number | null;
  pagar_para_llegar_a_30: number | null;
  pagar_para_llegar_a_10: number | null;
}

export interface CreditReportUtilization {
  porcentaje_global: number | null;
  tarjetas: CreditReportCard[];
  recomendacion: string | null;
  explicacion_cliente: string | null;
}

export interface CreditReportPlanPhase {
  fase: string;
  titulo: string | null;
  pasos: string[];
  tiempo: string | null;
}

export interface CreditReportTradelines {
  conviene: boolean;
  motivo: string | null;
  precaucion: string | null;
}

export interface CreditReportAnalysis {
  scores: CreditReportScore[];
  nivel_general: "Pobre" | "Regular" | "Bueno" | "Muy bueno" | "Excepcional" | "Desconocido";
  conteos: {
    elementos_negativos: number;
    colecciones: number;
    historial_insuficiente: boolean;
  };
  resumen_para_el_broker: string;
  explicacion_para_el_cliente: string;
  problemas: CreditReportIssue[];
  utilizacion: CreditReportUtilization;
  diferencias_entre_buros: string[];
  cosas_positivas: string[];
  plan: CreditReportPlanPhase[];
  tradelines: CreditReportTradelines;
  no_prometer: string[];
  expectativa_realista: string;
}

