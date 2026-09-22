export type ActiveTab = "inicio" | "clientes" | "soporte" | "perfil" | "admin";

export type PipelineStage = 
  | "lead"
  | "qualification"
  | "docs_pending"
  | "submitted"
  | "approved"
  | "paid";

export interface ClientLead {
  id: string;
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
  phone?: string;
  tier?: "Junior Broker" | "Senior Broker VIP" | "Master Broker" | string;
  onboardingStage?: OnboardingStage;
  // Reflejo del tag "payment completed (spanish)" en la subcuenta GHL de Emprende 360,
  // verificado manualmente por el staff (botón "Verificar Pago"), no sincronizado en vivo.
  packagePaid?: boolean;
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
  createdAt?: string;
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
}

export interface TicketMessage {
  id?: string;
  sender: "broker" | "agent";
  senderName: string;
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
}

