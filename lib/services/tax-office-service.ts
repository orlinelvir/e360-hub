import { adminDb } from "@/lib/firebase-admin";
import {
  TaxCase,
  TaxCaseStage,
  TaxInvoice,
  TaxCommissionItem,
  NewTaxCaseInput,
  NewTaxInvoiceInput,
  NewTaxCommissionInput
} from "@/app/hub/broker-onboarding/types";

/**
 * CRUD de la Oficina Virtual E360 (Tax Office), con Admin SDK únicamente —
 * firestore.rules bloquea toda lectura/escritura directa del cliente a estas
 * 3 subcolecciones (mismo patrón que caseNotes/caseDocuments), así que este
 * es el único camino de acceso, y el único lugar donde se valida
 * taxOfficeAccess (ver hasTaxOfficeAccess, usada por las rutas API).
 */

function brokerDoc(uid: string) {
  if (!adminDb) throw new Error("Servidor no configurado");
  return adminDb.collection("brokers").doc(uid);
}

export async function hasTaxOfficeAccess(uid: string, role: string): Promise<boolean> {
  if (role === "admin") return true;
  if (!adminDb) return false;
  const snap = await brokerDoc(uid).get();
  return Boolean(snap.data()?.taxOfficeAccess);
}

// --- Casos Fiscales ---

export async function getTaxCases(uid: string): Promise<TaxCase[]> {
  const snap = await brokerDoc(uid).collection("taxCases").orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TaxCase);
}

export async function addTaxCase(uid: string, input: NewTaxCaseInput): Promise<TaxCase> {
  const now = new Date().toISOString();
  const payload = {
    ...input,
    brokerId: uid,
    stage: "new" as TaxCaseStage,
    documentsCount: 0,
    createdAt: now,
    updatedAt: now
  };
  const ref = await brokerDoc(uid).collection("taxCases").add(payload);
  return { id: ref.id, ...payload };
}

export async function updateTaxCaseStage(uid: string, caseId: string, stage: TaxCaseStage): Promise<void> {
  const ref = brokerDoc(uid).collection("taxCases").doc(caseId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Expediente no encontrado");
  await ref.update({ stage, updatedAt: new Date().toISOString() });
}

// --- Facturación ---

export async function getTaxInvoices(uid: string): Promise<TaxInvoice[]> {
  const snap = await brokerDoc(uid).collection("taxInvoices").orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TaxInvoice);
}

export async function addTaxInvoice(uid: string, input: NewTaxInvoiceInput): Promise<TaxInvoice> {
  const now = new Date();
  const payload = {
    invoiceNumber: `INV-${Math.floor(8000 + Math.random() * 1999)}`,
    caseId: input.caseId,
    clientName: input.clientName,
    clientEmail: input.clientEmail,
    amount: input.amount,
    status: "pending" as const,
    paymentMethod: input.paymentMethod,
    taxYear: input.taxYear,
    dueDate: new Date(now.getTime() + 7 * 86400000).toISOString().split("T")[0],
    createdAt: now.toISOString().split("T")[0]
  };
  const ref = await brokerDoc(uid).collection("taxInvoices").add(payload);
  return { id: ref.id, ...payload };
}

// --- Comisiones ---

export async function getTaxCommissions(uid: string): Promise<TaxCommissionItem[]> {
  const snap = await brokerDoc(uid).collection("taxCommissions").orderBy("preparerName", "asc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TaxCommissionItem);
}

export async function addTaxCommission(uid: string, input: NewTaxCommissionInput): Promise<TaxCommissionItem> {
  const e360FeeDeduction = input.underMentorship ? input.totalReturns * 60 : 0;
  const netCommission = Math.round(input.grossVolume * (input.splitPercentage / 100)) - e360FeeDeduction;
  const payload = {
    preparerName: input.preparerName,
    preparerEmail: input.preparerEmail,
    totalReturns: input.totalReturns,
    grossVolume: input.grossVolume,
    splitPercentage: input.splitPercentage,
    e360FeeDeduction,
    netCommission,
    status: "pending" as const
  };
  const ref = await brokerDoc(uid).collection("taxCommissions").add(payload);
  return { id: ref.id, ...payload };
}
