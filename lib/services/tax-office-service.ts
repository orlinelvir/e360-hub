import { randomBytes } from "crypto";
import { adminDb } from "@/lib/firebase-admin";
import { sendTaxAutomationEmail } from "@/lib/email/send";
import { createNotification } from "@/lib/services/notification-service";
import { computeTaxCommission } from "@/lib/services/tax-commission-calc";
import {
  TaxCase,
  TaxCaseStage,
  TaxInvoice,
  TaxCommissionItem,
  TaxClient,
  TaxPipeline,
  TaxLead,
  TaxTask,
  TaxAppointment,
  TaxFormTemplate,
  TaxFormSubmission,
  TaxAutomation,
  NewTaxCaseInput,
  NewTaxInvoiceInput,
  NewTaxCommissionInput,
  NewTaxClientInput,
  NewTaxPipelineInput,
  NewTaxLeadInput,
  NewTaxTaskInput,
  NewTaxAppointmentInput,
  NewTaxFormTemplateInput,
  NewTaxFormSubmissionInput,
  NewTaxAutomationInput
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

// El Admin SDK de Firestore rechaza cualquier campo con valor `undefined`
// explícito (lanza "Cannot use 'undefined' as a Firestore value"), y varios
// inputs opcionales de este módulo (clientId, deadline, dueDate, relatedClientId,
// etc.) llegan como propiedades propias puestas a `undefined` — no ausentes —
// desde los modales (`campo || undefined`). Se limpia el payload final antes
// de cada escritura en vez de parchear cada campo opcional uno por uno.
function stripUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
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
  const ref = await brokerDoc(uid).collection("taxCases").add(stripUndefined(payload));
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
    clientId: input.clientId,
    clientName: input.clientName,
    clientEmail: input.clientEmail,
    description: input.description || "",
    amount: input.amount,
    status: input.status || ("sent" as const),
    paymentMethod: input.paymentMethod,
    taxYear: input.taxYear,
    dueDate: input.dueDate || new Date(now.getTime() + 7 * 86400000).toISOString().split("T")[0],
    createdAt: now.toISOString().split("T")[0]
  };
  const ref = await brokerDoc(uid).collection("taxInvoices").add(stripUndefined(payload));
  return { id: ref.id, ...payload };
}

// Espejo server-side de NEXT_STATUS_OPTIONS en TaxOfficeInvoicesTab.tsx — la UI
// es solo una guía visual, no una garantía; sin esta validación aquí, cualquier
// request directo al PATCH podía saltar de "draft" a "refunded" o de vuelta de
// "paid" a "draft", rompiendo el invariante de la máquina de estados.
const INVOICE_STATUS_TRANSITIONS: Record<string, TaxInvoice["status"][]> = {
  draft: ["sent", "cancelled"],
  sent: ["paid", "failed", "cancelled"],
  paid: ["refunded"],
  failed: ["sent", "cancelled"],
  refunded: [],
  cancelled: []
};

export async function updateTaxInvoiceStatus(uid: string, invoiceId: string, status: TaxInvoice["status"]): Promise<void> {
  const ref = brokerDoc(uid).collection("taxInvoices").doc(invoiceId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Factura no encontrada");
  const currentStatus = (snap.data() as TaxInvoice).status;
  // Facturas con un status legacy (de antes de este esquema, ej. "pending") no
  // tienen entrada en el mapa — se les da la misma salida razonable que la UI.
  const allowedNext = INVOICE_STATUS_TRANSITIONS[currentStatus] ?? (["sent", "paid", "cancelled"] as TaxInvoice["status"][]);
  if (!allowedNext.includes(status)) {
    throw new Error(`No se puede cambiar una factura de "${currentStatus}" a "${status}"`);
  }
  const patch: Record<string, unknown> = { status };
  if (status === "paid") patch.paidAt = new Date().toISOString().split("T")[0];
  await ref.update(patch);
}

// --- Comisiones ---

export async function getTaxCommissions(uid: string): Promise<TaxCommissionItem[]> {
  const snap = await brokerDoc(uid).collection("taxCommissions").orderBy("preparerName", "asc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TaxCommissionItem);
}

export async function addTaxCommission(uid: string, input: NewTaxCommissionInput): Promise<TaxCommissionItem> {
  const { e360FeeDeduction, netCommission } = computeTaxCommission(input.totalReturns, input.grossVolume, input.splitPercentage, input.underMentorship);
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

// --- Clientes ---

export async function getTaxClients(uid: string): Promise<TaxClient[]> {
  const snap = await brokerDoc(uid).collection("taxClients").orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TaxClient);
}

export async function addTaxClient(uid: string, input: NewTaxClientInput): Promise<TaxClient> {
  const now = new Date().toISOString();
  const payload = { ...input, brokerId: uid, createdAt: now, updatedAt: now };
  const ref = await brokerDoc(uid).collection("taxClients").add(stripUndefined(payload));
  return { id: ref.id, ...payload };
}

export async function updateTaxClientStatus(uid: string, clientId: string, status: TaxClient["status"]): Promise<void> {
  const ref = brokerDoc(uid).collection("taxClients").doc(clientId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Cliente no encontrado");
  await ref.update({ status, updatedAt: new Date().toISOString() });
}

// --- Workflow: pipelines + leads ---
// Toda cuenta necesita al menos un pipeline para poder usar la pestaña
// Workflow — se crea uno "Main pipeline" con las 5 etapas de venta estándar
// la primera vez que se pide la lista y no existe ninguno todavía.

const DEFAULT_PIPELINE_STAGE_NAMES = ["New Lead", "Contacted", "Consultation", "Proposal", "Client"];

export async function getTaxPipelines(uid: string): Promise<TaxPipeline[]> {
  if (!adminDb) return [];
  const colRef = brokerDoc(uid).collection("taxPipelines");
  // "Leer vacío, entonces crear" en una transacción — sin esto, dos pestañas
  // cargando Workflow al mismo tiempo en una cuenta nueva pueden ambas ver la
  // colección vacía y crear dos "Main pipeline" distintos, los dos marcados
  // isDefault:true, y la UI quedaría eligiendo uno al azar.
  return adminDb.runTransaction(async (t) => {
    const snap = await t.get(colRef.orderBy("createdAt", "asc"));
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TaxPipeline);
    }
    const now = new Date().toISOString();
    const payload = {
      brokerId: uid,
      name: "Main pipeline",
      stages: DEFAULT_PIPELINE_STAGE_NAMES.map((name, index) => ({ id: `stage-${index}-default`, name, order: index })),
      isDefault: true,
      createdAt: now
    };
    const newRef = colRef.doc();
    t.set(newRef, payload);
    return [{ id: newRef.id, ...payload }];
  });
}

export async function addTaxPipeline(uid: string, input: NewTaxPipelineInput, isDefault = false): Promise<TaxPipeline> {
  const now = new Date().toISOString();
  const payload = {
    brokerId: uid,
    name: input.name,
    stages: input.stageNames.map((name, index) => ({ id: `stage-${index}-${Date.now()}`, name, order: index })),
    isDefault,
    createdAt: now
  };
  const ref = await brokerDoc(uid).collection("taxPipelines").add(payload);
  return { id: ref.id, ...payload };
}

export async function updateTaxPipelineStages(uid: string, pipelineId: string, stages: TaxPipeline["stages"]): Promise<void> {
  const ref = brokerDoc(uid).collection("taxPipelines").doc(pipelineId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Pipeline no encontrado");
  await ref.update({ stages });
}

export async function getTaxLeads(uid: string): Promise<TaxLead[]> {
  const snap = await brokerDoc(uid).collection("taxLeads").orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TaxLead);
}

export async function addTaxLead(uid: string, input: NewTaxLeadInput): Promise<TaxLead> {
  const now = new Date().toISOString();
  const payload = { ...input, brokerId: uid, createdAt: now, updatedAt: now };
  const ref = await brokerDoc(uid).collection("taxLeads").add(stripUndefined(payload));
  return { id: ref.id, ...payload };
}

export async function updateTaxLeadStage(uid: string, leadId: string, stageId: string): Promise<void> {
  const ref = brokerDoc(uid).collection("taxLeads").doc(leadId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Lead no encontrado");
  await ref.update({ stageId, updatedAt: new Date().toISOString() });
}

// --- Tareas ---

export async function getTaxTasks(uid: string): Promise<TaxTask[]> {
  const snap = await brokerDoc(uid).collection("taxTasks").orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TaxTask);
}

export async function addTaxTask(uid: string, input: NewTaxTaskInput): Promise<TaxTask> {
  const now = new Date().toISOString();
  const payload = {
    title: input.title,
    description: input.description || "",
    dueDate: input.dueDate,
    priority: input.priority,
    status: "to_do" as const,
    relatedClientId: input.relatedClientId,
    brokerId: uid,
    createdAt: now,
    updatedAt: now
  };
  const ref = await brokerDoc(uid).collection("taxTasks").add(stripUndefined(payload));
  return { id: ref.id, ...payload };
}

export async function updateTaxTaskStatus(uid: string, taskId: string, status: TaxTask["status"]): Promise<void> {
  const ref = brokerDoc(uid).collection("taxTasks").doc(taskId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Tarea no encontrada");
  await ref.update({ status, updatedAt: new Date().toISOString() });
}

// --- Citas ---

export async function getTaxAppointments(uid: string): Promise<TaxAppointment[]> {
  const snap = await brokerDoc(uid).collection("taxAppointments").orderBy("dateTime", "asc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TaxAppointment);
}

export async function addTaxAppointment(uid: string, input: NewTaxAppointmentInput): Promise<TaxAppointment> {
  const now = new Date().toISOString();
  const payload = { ...input, brokerId: uid, createdAt: now };
  const ref = await brokerDoc(uid).collection("taxAppointments").add(stripUndefined(payload));
  return { id: ref.id, ...payload };
}

// --- Formularios y Contratos ---

function generateSecureToken(): string {
  return randomBytes(16).toString("hex");
}

export async function getTaxFormTemplates(uid: string): Promise<TaxFormTemplate[]> {
  const snap = await brokerDoc(uid).collection("taxFormTemplates").orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TaxFormTemplate);
}

export async function addTaxFormTemplate(uid: string, input: NewTaxFormTemplateInput): Promise<TaxFormTemplate> {
  const now = new Date().toISOString();
  const payload: Omit<TaxFormTemplate, "id"> = {
    brokerId: uid,
    name: input.name,
    serviceType: input.serviceType,
    status: "draft",
    version: 1,
    logoSize: "md",
    logoAlignment: "center",
    pages: [{ id: `page-${Date.now()}`, name: "Página 1", sections: [{ id: `section-${Date.now()}`, name: "Sección", fields: [] }] }],
    secureToken: generateSecureToken(),
    createdAt: now,
    updatedAt: now
  };
  const ref = await brokerDoc(uid).collection("taxFormTemplates").add(payload);
  return { id: ref.id, ...payload };
}

export async function updateTaxFormTemplate(
  uid: string,
  formId: string,
  patch: Partial<Pick<TaxFormTemplate, "name" | "headerText" | "logoUrl" | "logoSize" | "logoAlignment" | "pages" | "attachmentStoragePath" | "attachmentName">>
): Promise<void> {
  const ref = brokerDoc(uid).collection("taxFormTemplates").doc(formId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Formulario no encontrado");
  await ref.update(stripUndefined({ ...patch, updatedAt: new Date().toISOString() }));
}

export async function publishTaxFormTemplate(uid: string, formId: string): Promise<TaxFormTemplate> {
  const ref = brokerDoc(uid).collection("taxFormTemplates").doc(formId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Formulario no encontrado");
  const current = snap.data() as Omit<TaxFormTemplate, "id">;
  const patch = { status: "published" as const, version: current.version + 1, publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await ref.update(patch);
  return { id: formId, ...current, ...patch };
}

// Lookup público (sin uid autenticado) por secureToken — usado por el link que
// el cliente recibe para llenar el formulario, nunca requiere login. Recorre
// todos los brokers porque el token es globalmente único (128 bits de
// aleatoriedad), así que una collectionGroup query es segura y barata.
export async function getPublishedTaxFormByToken(token: string): Promise<{ brokerId: string; form: TaxFormTemplate } | null> {
  if (!adminDb) return null;
  const snap = await adminDb.collectionGroup("taxFormTemplates").where("secureToken", "==", token).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const form = { id: doc.id, ...doc.data() } as TaxFormTemplate;
  if (form.status !== "published") return null;
  return { brokerId: form.brokerId, form };
}

export async function submitTaxForm(brokerId: string, formId: string, formVersion: number, input: NewTaxFormSubmissionInput): Promise<TaxFormSubmission> {
  const now = new Date().toISOString();
  const payload = { brokerId, formTemplateId: formId, formVersion, clientName: input.clientName, clientEmail: input.clientEmail, answers: input.answers, submittedAt: now };
  const ref = await brokerDoc(brokerId).collection("taxFormSubmissions").add(stripUndefined(payload));
  return { id: ref.id, ...payload };
}

export async function getTaxFormSubmissions(uid: string): Promise<TaxFormSubmission[]> {
  const snap = await brokerDoc(uid).collection("taxFormSubmissions").orderBy("submittedAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TaxFormSubmission);
}

// --- Automatizaciones y Recordatorios ---

export async function getTaxAutomations(uid: string): Promise<TaxAutomation[]> {
  const snap = await brokerDoc(uid).collection("taxAutomations").orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TaxAutomation);
}

export async function addTaxAutomation(uid: string, input: NewTaxAutomationInput): Promise<TaxAutomation> {
  const now = new Date().toISOString();
  const payload = { ...input, brokerId: uid, createdAt: now };
  const ref = await brokerDoc(uid).collection("taxAutomations").add(stripUndefined(payload));
  return { id: ref.id, ...payload };
}

export async function updateTaxAutomationStatus(uid: string, automationId: string, status: TaxAutomation["status"]): Promise<void> {
  const ref = brokerDoc(uid).collection("taxAutomations").doc(automationId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Automatización no encontrada");
  await ref.update({ status });
}

// Todas las cuentas con acceso a Tax Office, para que el cron de
// automatizaciones (ver app/api/cron/tax-office-automations/route.ts) sepa
// sobre quién iterar sin tener que escanear la colección entera de brokers.
export async function getTaxOfficeAccountUids(): Promise<string[]> {
  if (!adminDb) return [];
  const snap = await adminDb.collection("brokers").where("taxOfficeAccess", "==", true).get();
  return snap.docs.map((d) => d.id);
}

// --- Motor de Automatizaciones y Recordatorios ---
// Corre una vez al día por cuenta (ver cron). Cada automatización activa
// corre como máximo una vez por día (se guarda en lastRunAt) y, cuando
// corre, evalúa TODAS las entidades que cumplen la condición en ese momento
// — no hay un registro por-entidad de "ya se avisó de este caso puntual",
// así que si el caso se queda en el mismo estado varios días, el recordatorio
// se repite cada día. Para un sistema de un solo broker esto es aceptable:
// el broker recibe el recordatorio hasta que resuelve la situación, que es
// justamente el comportamiento que se busca.
function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

async function runSingleAutomation(uid: string, automation: TaxAutomation, brokerEmail: string, brokerName: string): Promise<number> {
  let firedCount = 0;

  const fire = async (opts: { recipientEmail?: string; recipientName: string; relatedClientId?: string; audience?: "broker" | "client" }) => {
    if (automation.actionType === "send_email") {
      const to = opts.recipientEmail || brokerEmail;
      if (!to) return;
      await sendTaxAutomationEmail({
        to,
        recipientName: opts.recipientName,
        subject: automation.actionConfig.subject || automation.name,
        message: automation.actionConfig.message || automation.name,
        // El trigger decide si esto va al contribuyente o al broker — una
        // etiqueta de "notificación interna, no respondas" no tiene sentido
        // en un correo que recibe el cliente final, así que el audience debe
        // reflejar al destinatario real, no asumir siempre que es el broker.
        audience: opts.audience || "broker"
      });
    } else if (automation.actionType === "send_sms") {
      // No hay proveedor de SMS integrado en el Hub todavía (los textos de
      // esta temporada se mandan desde GHL) — en vez de fingir que se envió
      // un mensaje de texto, se deja una notificación interna honesta.
      await createNotification(uid, {
        title: `Automatización "${automation.name}" — SMS pendiente de enviar manualmente`,
        message: `${automation.actionConfig.message || automation.name} (para ${opts.recipientName})`
      });
    } else if (automation.actionType === "create_task") {
      await addTaxTask(uid, {
        title: automation.actionConfig.taskTitle || automation.name,
        description: `Generada automáticamente por "${automation.name}"`,
        dueDate: undefined,
        priority: "medium",
        relatedClientId: opts.relatedClientId
      });
    }
    firedCount += 1;
  };

  const today = new Date();

  // Etapas que significan que el caso ya terminó su ciclo de e-file — seguir
  // mandando "tu fecha límite se acerca" a un caso ya transmitido/aceptado/
  // rechazado confunde al cliente en vez de ayudarlo.
  const FINISHED_STAGES: TaxCaseStage[] = ["transmitted", "accepted", "rejected"];

  if (automation.triggerType === "deadline_approaching") {
    const daysBefore = automation.triggerConfig.daysBefore ?? 3;
    const cases = await getTaxCases(uid);
    for (const c of cases) {
      if (!c.deadline || FINISHED_STAGES.includes(c.stage)) continue;
      const diff = daysBetween(new Date(c.deadline), today);
      if (diff >= 0 && diff <= daysBefore) {
        await fire({ recipientEmail: c.clientEmail, recipientName: c.clientName, relatedClientId: c.clientId, audience: "client" });
      }
    }
  } else if (automation.triggerType === "stage_changed") {
    const targetStage = automation.triggerConfig.toStageId;
    if (targetStage) {
      const cases = await getTaxCases(uid);
      for (const c of cases) {
        if (c.stage !== targetStage) continue;
        // Aproximación: "cambió recientemente" = se actualizó dentro de la
        // última ventana de 36 horas, para cubrir el intervalo entre
        // corridas diarias del cron sin necesitar un historial de cambios.
        const hoursSinceUpdate = (today.getTime() - new Date(c.updatedAt).getTime()) / 3_600_000;
        if (hoursSinceUpdate <= 36) {
          await fire({ recipientEmail: c.clientEmail, recipientName: c.clientName, relatedClientId: c.clientId, audience: "client" });
        }
      }
    }
  } else if (automation.triggerType === "task_overdue") {
    const tasks = await getTaxTasks(uid);
    for (const t of tasks) {
      if (t.status === "completed" || !t.dueDate) continue;
      if (new Date(t.dueDate) < today) {
        await fire({ recipientEmail: brokerEmail, recipientName: brokerName, relatedClientId: t.relatedClientId, audience: "broker" });
      }
    }
  } else if (automation.triggerType === "invoice_overdue") {
    const invoices = await getTaxInvoices(uid);
    for (const inv of invoices) {
      if (inv.status !== "sent") continue;
      if (new Date(inv.dueDate) < today) {
        await fire({ recipientEmail: inv.clientEmail, recipientName: inv.clientName, relatedClientId: inv.clientId, audience: "client" });
      }
    }
  }

  await brokerDoc(uid).collection("taxAutomations").doc(automation.id).update({ lastRunAt: today.toISOString() });
  return firedCount;
}

export async function runTaxAutomationsForBroker(uid: string): Promise<{ automationsRun: number; actionsFired: number }> {
  if (!adminDb) return { automationsRun: 0, actionsFired: 0 };

  const brokerSnap = await brokerDoc(uid).get();
  const brokerData = brokerSnap.data() || {};
  const brokerEmail = brokerData.email || "";
  const brokerName = brokerData.displayName || brokerData.name || "Broker";

  const automations = await getTaxAutomations(uid);
  const today = new Date().toISOString().split("T")[0];

  let automationsRun = 0;
  let actionsFired = 0;

  for (const automation of automations) {
    if (automation.status !== "active") continue;
    if (automation.lastRunAt && automation.lastRunAt.split("T")[0] === today) continue; // ya corrió hoy
    const fired = await runSingleAutomation(uid, automation, brokerEmail, brokerName);
    automationsRun += 1;
    actionsFired += fired;
  }

  return { automationsRun, actionsFired };
}
