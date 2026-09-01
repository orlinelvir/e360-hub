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
  // Estado real de la solicitud, actualizado manualmente por Admin/Underwriting
  // (distinto de `stage`, que es el seguimiento propio del broker). Solo lectura para el broker.
  status?: string;
  adminNotes?: string;
}

export interface BrokerProfileData {
  uid: string;
  displayName: string;
  email: string;
  name?: string;
  brokerId?: string;
  phone?: string;
  tier?: "Junior Broker" | "Senior Broker VIP" | "Master Broker" | string;
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

export interface SupportTicketV2 {
  id: string;
  subject: string;
  category: "ghl_crm" | "commission" | "underwriting" | "general";
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
  updatedAt: string;
  description: string;
  conversationId?: string;
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

