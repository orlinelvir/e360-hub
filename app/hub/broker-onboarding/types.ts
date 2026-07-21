import { ComponentType } from "react";

export type ActiveTab = "inicio" | "clientes" | "soporte" | "perfil";

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
  notes: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: "ghl_crm" | "commission" | "underwriting" | "general";
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
  description: string;
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
