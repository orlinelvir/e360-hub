"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { LayoutDashboard, FolderKanban, Receipt, Users, FileText, Sparkles, Plus, Eye, Percent, Workflow, ListChecks, CalendarClock, Zap } from "lucide-react";
import TaxOfficePaywall from "./tax-office/TaxOfficePaywall";
import TaxOfficeDashboard from "./tax-office/TaxOfficeDashboard";
import TaxOfficeCasesTab from "./tax-office/TaxOfficeCasesTab";
import TaxOfficeClientsTab from "./tax-office/TaxOfficeClientsTab";
import TaxOfficeWorkflowTab from "./tax-office/TaxOfficeWorkflowTab";
import TaxOfficeTasksTab from "./tax-office/TaxOfficeTasksTab";
import TaxOfficeAppointmentsTab from "./tax-office/TaxOfficeAppointmentsTab";
import TaxOfficeInvoicesTab from "./tax-office/TaxOfficeInvoicesTab";
import TaxOfficeCommissionsTab from "./tax-office/TaxOfficeCommissionsTab";
import TaxOfficeFormsTab from "./tax-office/TaxOfficeFormsTab";
import TaxOfficeAutomationsTab from "./tax-office/TaxOfficeAutomationsTab";
import NewTaxCaseModal from "./tax-office/NewTaxCaseModal";
import { computeTaxCommission } from "@/lib/services/tax-commission-calc";
import {
  INITIAL_TAX_CASES,
  INITIAL_TAX_INVOICES,
  INITIAL_TAX_COMMISSIONS,
  INITIAL_TAX_CLIENTS,
  INITIAL_TAX_PIPELINES,
  INITIAL_TAX_LEADS,
  INITIAL_TAX_TASKS,
  INITIAL_TAX_APPOINTMENTS,
  INITIAL_TAX_FORMS,
  INITIAL_TAX_AUTOMATIONS,
  INITIAL_TAX_STATS,
  TaxOfficeStats
} from "./tax-office/mock-tax-data";
import {
  TaxCase,
  TaxCaseStage,
  TaxInvoice,
  TaxCommissionItem,
  TaxClient,
  TaxClientStatus,
  TaxPipeline,
  TaxLead,
  TaxTask,
  TaxTaskStatus,
  TaxAppointment,
  TaxFormTemplate,
  TaxFormField,
  TaxFormSubmission,
  TaxAutomation,
  TaxAutomationStatus,
  NewTaxCaseInput,
  NewTaxInvoiceInput,
  NewTaxCommissionInput,
  NewTaxClientInput,
  NewTaxLeadInput,
  NewTaxPipelineInput,
  NewTaxTaskInput,
  NewTaxAppointmentInput,
  NewTaxFormTemplateInput,
  NewTaxAutomationInput
} from "../types";

type SubTab = "dashboard" | "cases" | "clients" | "workflow" | "tasks" | "appointments" | "invoices" | "commissions" | "templates" | "automations";

interface TaxOfficeSectionProps {
  brokerName: string;
}

export default function TaxOfficeSection({ brokerName }: TaxOfficeSectionProps) {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const hasAccess = Boolean(profile?.taxOfficeAccess || isAdmin);

  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showSampleData, setShowSampleData] = useState(false);
  const isViewingSample = isDemoMode || showSampleData;

  const [activeSubTab, setActiveSubTab] = useState<SubTab>("dashboard");

  // Casos reales del broker (persistidos vía API) vs datos de demostración
  const [realCases, setRealCases] = useState<TaxCase[]>([]);
  const [realInvoices, setRealInvoices] = useState<TaxInvoice[]>([]);
  const [realCommissions, setRealCommissions] = useState<TaxCommissionItem[]>([]);
  const [realClients, setRealClients] = useState<TaxClient[]>([]);
  const [realPipelines, setRealPipelines] = useState<TaxPipeline[]>([]);
  const [realLeads, setRealLeads] = useState<TaxLead[]>([]);
  const [realTasks, setRealTasks] = useState<TaxTask[]>([]);
  const [realAppointments, setRealAppointments] = useState<TaxAppointment[]>([]);
  const [realForms, setRealForms] = useState<TaxFormTemplate[]>([]);
  const [realAutomations, setRealAutomations] = useState<TaxAutomation[]>([]);
  const [demoCases, setDemoCases] = useState<TaxCase[]>(INITIAL_TAX_CASES);
  const [demoInvoices, setDemoInvoices] = useState<TaxInvoice[]>(INITIAL_TAX_INVOICES);
  const [demoCommissions, setDemoCommissions] = useState<TaxCommissionItem[]>(INITIAL_TAX_COMMISSIONS);
  const [demoClients, setDemoClients] = useState<TaxClient[]>(INITIAL_TAX_CLIENTS);
  const [demoPipelines, setDemoPipelines] = useState<TaxPipeline[]>(INITIAL_TAX_PIPELINES);
  const [demoLeads, setDemoLeads] = useState<TaxLead[]>(INITIAL_TAX_LEADS);
  const [demoTasks, setDemoTasks] = useState<TaxTask[]>(INITIAL_TAX_TASKS);
  const [demoAppointments, setDemoAppointments] = useState<TaxAppointment[]>(INITIAL_TAX_APPOINTMENTS);
  const [demoForms, setDemoForms] = useState<TaxFormTemplate[]>(INITIAL_TAX_FORMS);
  const [demoAutomations, setDemoAutomations] = useState<TaxAutomation[]>(INITIAL_TAX_AUTOMATIONS);

  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<TaxCase | null>(null);

  const activeCases = isViewingSample ? demoCases : realCases;
  const activeInvoices = isViewingSample ? demoInvoices : realInvoices;
  const activeCommissions = isViewingSample ? demoCommissions : realCommissions;
  const activeClients = isViewingSample ? demoClients : realClients;
  const activePipelines = isViewingSample ? demoPipelines : realPipelines;
  const activeLeads = isViewingSample ? demoLeads : realLeads;
  const activeTasks = isViewingSample ? demoTasks : realTasks;
  const activeAppointments = isViewingSample ? demoAppointments : realAppointments;
  const activeForms = isViewingSample ? demoForms : realForms;
  const activeAutomations = isViewingSample ? demoAutomations : realAutomations;

  // Carga los datos reales una sola vez cuando la cuenta tiene acceso pagado —
  // independiente de si en ese momento se está viendo la muestra de demo.
  useEffect(() => {
    if (!hasAccess || !user) return;
    let cancelled = false;

    (async () => {
      try {
        const token = await user.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };
        const [casesRes, invoicesRes, commissionsRes, clientsRes, pipelinesRes, leadsRes, tasksRes, appointmentsRes, formsRes, automationsRes] = await Promise.all([
          fetch("/api/tax-office/cases", { headers }),
          fetch("/api/tax-office/invoices", { headers }),
          fetch("/api/tax-office/commissions", { headers }),
          fetch("/api/tax-office/clients", { headers }),
          fetch("/api/tax-office/pipelines", { headers }),
          fetch("/api/tax-office/leads", { headers }),
          fetch("/api/tax-office/tasks", { headers }),
          fetch("/api/tax-office/appointments", { headers }),
          fetch("/api/tax-office/forms", { headers }),
          fetch("/api/tax-office/automations", { headers })
        ]);
        if (cancelled) return;
        if (casesRes.ok) setRealCases((await casesRes.json()).cases);
        if (invoicesRes.ok) setRealInvoices((await invoicesRes.json()).invoices);
        if (commissionsRes.ok) setRealCommissions((await commissionsRes.json()).commissions);
        if (clientsRes.ok) setRealClients((await clientsRes.json()).clients);
        if (pipelinesRes.ok) setRealPipelines((await pipelinesRes.json()).pipelines);
        if (leadsRes.ok) setRealLeads((await leadsRes.json()).leads);
        if (tasksRes.ok) setRealTasks((await tasksRes.json()).tasks);
        if (appointmentsRes.ok) setRealAppointments((await appointmentsRes.json()).appointments);
        if (formsRes.ok) setRealForms((await formsRes.json()).forms);
        if (automationsRes.ok) setRealAutomations((await automationsRes.json()).automations);
      } catch (error) {
        console.error("Error cargando datos de Oficina Virtual E360:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasAccess, user]);

  // Cálculo dinámico de métricas para datos reales
  const activeStats: TaxOfficeStats = useMemo(() => {
    if (isViewingSample) return INITIAL_TAX_STATS;

    const totalCollected = activeInvoices
      .filter((i) => i.status === "paid")
      .reduce((acc, curr) => acc + curr.amount, 0);

    // Incluye el valor legacy "pending" (de antes de este cambio de esquema de
    // TaxInvoiceStatus) como pendiente de cobro, para no sub-reportar el saldo
    // por cobrar de facturas reales creadas con la versión anterior del backend.
    const outstandingBalance = activeInvoices
      .filter((i) => i.status === "sent" || (i.status as string) === "pending")
      .reduce((acc, curr) => acc + curr.amount, 0);

    const refundAdvances = activeCases
      .filter((c) => c.refundAdvanceRequested)
      .reduce((acc, curr) => acc + (curr.estimatedRefund || 0), 0);

    const paidInvoicesCount = activeInvoices.filter((i) => i.status === "paid").length;

    const totalFees = activeCases.reduce((acc, curr) => acc + curr.agreedFee, 0);
    const averageFee = activeCases.length > 0 ? Math.round(totalFees / activeCases.length) : 0;

    const stageCounts = {
      new: 0,
      docs_pending: 0,
      in_review: 0,
      ready_to_file: 0,
      transmitted: 0,
      accepted: 0,
      rejected: 0,
    };

    activeCases.forEach((c) => {
      if (stageCounts[c.stage] !== undefined) {
        stageCounts[c.stage] += 1;
      }
    });

    return {
      totalCollected,
      outstandingBalance,
      refundAdvances,
      paidInvoicesCount,
      averageFee,
      totalCasesCount: activeCases.length,
      stageCounts,
    };
  }, [isViewingSample, activeCases, activeInvoices]);

  const handleCaseCreated = useCallback(
    async (input: NewTaxCaseInput): Promise<boolean> => {
      if (isViewingSample) {
        const now = new Date().toISOString();
        const newCase: TaxCase = {
          ...input,
          id: `TC-DEMO-${Math.floor(100 + Math.random() * 900)}`,
          brokerId: "demo",
          stage: "new",
          documentsCount: 0,
          createdAt: now,
          updatedAt: now
        };
        setDemoCases((prev) => [newCase, ...prev]);
        return true;
      }

      if (!user) return false;
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/tax-office/cases", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(input)
        });
        if (!res.ok) return false;
        const { case: newCase } = (await res.json()) as { case: TaxCase };
        setRealCases((prev) => [newCase, ...prev]);
        return true;
      } catch (error) {
        console.error("Error creando caso fiscal:", error);
        return false;
      }
    },
    [isViewingSample, user]
  );

  const handleUpdateCaseStage = useCallback(
    (caseId: string, newStage: TaxCaseStage) => {
      const updater = (prev: TaxCase[]) =>
        prev.map((c) => (c.id === caseId ? { ...c, stage: newStage, updatedAt: new Date().toISOString() } : c));

      if (isViewingSample) {
        setDemoCases(updater);
      } else {
        setRealCases(updater);
        if (user) {
          user.getIdToken().then((token) => {
            fetch(`/api/tax-office/cases/${caseId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ stage: newStage })
            }).catch((error) => console.error("Error actualizando etapa del caso fiscal:", error));
          });
        }
      }

      if (selectedCase && selectedCase.id === caseId) {
        setSelectedCase((prev) => (prev ? { ...prev, stage: newStage } : null));
      }
    },
    [isViewingSample, user, selectedCase]
  );

  const handleAddInvoice = useCallback(
    async (input: NewTaxInvoiceInput): Promise<boolean> => {
      if (isViewingSample) {
        const now = new Date();
        const newInv: TaxInvoice = {
          id: `INV-DEMO-${Math.floor(8000 + Math.random() * 1999)}`,
          invoiceNumber: `INV-${Math.floor(8000 + Math.random() * 1999)}`,
          ...input,
          status: input.status || "sent",
          dueDate: input.dueDate || new Date(now.getTime() + 7 * 86400000).toISOString().split("T")[0],
          createdAt: now.toISOString().split("T")[0]
        };
        setDemoInvoices((prev) => [newInv, ...prev]);
        return true;
      }

      if (!user) return false;
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/tax-office/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(input)
        });
        if (!res.ok) return false;
        const { invoice: newInvoice } = (await res.json()) as { invoice: TaxInvoice };
        setRealInvoices((prev) => [newInvoice, ...prev]);
        return true;
      } catch (error) {
        console.error("Error creando factura fiscal:", error);
        return false;
      }
    },
    [isViewingSample, user]
  );

  const handleAddCommission = useCallback(
    async (input: NewTaxCommissionInput): Promise<boolean> => {
      if (isViewingSample) {
        const { e360FeeDeduction, netCommission } = computeTaxCommission(input.totalReturns, input.grossVolume, input.splitPercentage, input.underMentorship);
        const newCommission: TaxCommissionItem = {
          id: `COMM-DEMO-${Math.floor(100 + Math.random() * 900)}`,
          preparerName: input.preparerName,
          preparerEmail: input.preparerEmail,
          totalReturns: input.totalReturns,
          grossVolume: input.grossVolume,
          splitPercentage: input.splitPercentage,
          e360FeeDeduction,
          netCommission,
          status: "pending"
        };
        setDemoCommissions((prev) => [newCommission, ...prev]);
        return true;
      }

      if (!user) return false;
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/tax-office/commissions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(input)
        });
        if (!res.ok) return false;
        const { commission: newCommission } = (await res.json()) as { commission: TaxCommissionItem };
        setRealCommissions((prev) => [newCommission, ...prev]);
        return true;
      } catch (error) {
        console.error("Error creando comisión fiscal:", error);
        return false;
      }
    },
    [isViewingSample, user]
  );

  const handleUpdateInvoiceStatus = useCallback(
    (invoiceId: string, status: TaxInvoice["status"]) => {
      const updater = (prev: TaxInvoice[]) =>
        prev.map((inv) => (inv.id === invoiceId ? { ...inv, status, paidAt: status === "paid" ? new Date().toISOString().split("T")[0] : inv.paidAt } : inv));

      if (isViewingSample) {
        setDemoInvoices(updater);
      } else {
        setRealInvoices(updater);
        if (user) {
          user.getIdToken().then((token) => {
            fetch(`/api/tax-office/invoices/${invoiceId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ status })
            }).catch((error) => console.error("Error actualizando estado de la factura fiscal:", error));
          });
        }
      }
    },
    [isViewingSample, user]
  );

  const handleAddClient = useCallback(
    async (input: NewTaxClientInput): Promise<boolean> => {
      if (isViewingSample) {
        const now = new Date().toISOString();
        const newClient: TaxClient = { ...input, id: `TCL-DEMO-${Math.floor(100 + Math.random() * 900)}`, brokerId: "demo", createdAt: now, updatedAt: now };
        setDemoClients((prev) => [newClient, ...prev]);
        return true;
      }

      if (!user) return false;
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/tax-office/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(input)
        });
        if (!res.ok) return false;
        const { client: newClient } = (await res.json()) as { client: TaxClient };
        setRealClients((prev) => [newClient, ...prev]);
        return true;
      } catch (error) {
        console.error("Error creando cliente fiscal:", error);
        return false;
      }
    },
    [isViewingSample, user]
  );

  const handleUpdateClientStatus = useCallback(
    (clientId: string, status: TaxClientStatus) => {
      const updater = (prev: TaxClient[]) => prev.map((c) => (c.id === clientId ? { ...c, status, updatedAt: new Date().toISOString() } : c));
      if (isViewingSample) {
        setDemoClients(updater);
      } else {
        setRealClients(updater);
        if (user) {
          user.getIdToken().then((token) => {
            fetch(`/api/tax-office/clients/${clientId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ status })
            }).catch((error) => console.error("Error actualizando estado del cliente fiscal:", error));
          });
        }
      }
    },
    [isViewingSample, user]
  );

  const handleAddLead = useCallback(
    async (input: NewTaxLeadInput): Promise<boolean> => {
      if (isViewingSample) {
        const now = new Date().toISOString();
        const newLead: TaxLead = { ...input, id: `TLD-DEMO-${Math.floor(100 + Math.random() * 900)}`, brokerId: "demo", createdAt: now, updatedAt: now };
        setDemoLeads((prev) => [newLead, ...prev]);
        return true;
      }

      if (!user) return false;
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/tax-office/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(input)
        });
        if (!res.ok) return false;
        const { lead: newLead } = (await res.json()) as { lead: TaxLead };
        setRealLeads((prev) => [newLead, ...prev]);
        return true;
      } catch (error) {
        console.error("Error creando lead fiscal:", error);
        return false;
      }
    },
    [isViewingSample, user]
  );

  const handleMoveLead = useCallback(
    (leadId: string, stageId: string) => {
      const updater = (prev: TaxLead[]) => prev.map((l) => (l.id === leadId ? { ...l, stageId, updatedAt: new Date().toISOString() } : l));
      if (isViewingSample) {
        setDemoLeads(updater);
      } else {
        setRealLeads(updater);
        if (user) {
          user.getIdToken().then((token) => {
            fetch(`/api/tax-office/leads/${leadId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ stageId })
            }).catch((error) => console.error("Error moviendo lead fiscal:", error));
          });
        }
      }
    },
    [isViewingSample, user]
  );

  const handleAddPipeline = useCallback(
    async (input: NewTaxPipelineInput): Promise<boolean> => {
      if (isViewingSample) {
        const newPipeline: TaxPipeline = {
          id: `TPL-DEMO-${Math.floor(100 + Math.random() * 900)}`,
          brokerId: "demo",
          name: input.name,
          isDefault: false,
          stages: input.stageNames.map((name, index) => ({ id: `stage-${index}-${Date.now()}`, name, order: index })),
          createdAt: new Date().toISOString()
        };
        setDemoPipelines((prev) => [...prev, newPipeline]);
        return true;
      }

      if (!user) return false;
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/tax-office/pipelines", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(input)
        });
        if (!res.ok) return false;
        const { pipeline: newPipeline } = (await res.json()) as { pipeline: TaxPipeline };
        setRealPipelines((prev) => [...prev, newPipeline]);
        return true;
      } catch (error) {
        console.error("Error creando pipeline fiscal:", error);
        return false;
      }
    },
    [isViewingSample, user]
  );

  const handleUpdateStages = useCallback(
    async (pipelineId: string, editedStages: { id: string; name: string }[]): Promise<boolean> => {
      // Cada etapa ya trae su id correcto desde ManageStagesModal — nunca se
      // reconcilia por posición en el arreglo, porque borrar una etapa del
      // medio desplazaría los nombres sin desplazar sus ids, mezclando el
      // nombre de una etapa con el id de otra y dejando leads huérfanos.
      const stages = editedStages.map((s, index) => ({ id: s.id, name: s.name, order: index }));

      if (isViewingSample) {
        setDemoPipelines((prev) => prev.map((p) => (p.id === pipelineId ? { ...p, stages } : p)));
        return true;
      }

      if (!user) return false;
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/tax-office/pipelines/${pipelineId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ stages })
        });
        if (!res.ok) return false;
        setRealPipelines((prev) => prev.map((p) => (p.id === pipelineId ? { ...p, stages } : p)));
        return true;
      } catch (error) {
        console.error("Error actualizando etapas del pipeline fiscal:", error);
        return false;
      }
    },
    [isViewingSample, user]
  );

  const handleAddTask = useCallback(
    async (input: NewTaxTaskInput): Promise<boolean> => {
      if (isViewingSample) {
        const now = new Date().toISOString();
        const newTask: TaxTask = { ...input, id: `TTK-DEMO-${Math.floor(100 + Math.random() * 900)}`, brokerId: "demo", status: "to_do", createdAt: now, updatedAt: now };
        setDemoTasks((prev) => [newTask, ...prev]);
        return true;
      }

      if (!user) return false;
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/tax-office/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(input)
        });
        if (!res.ok) return false;
        const { task: newTask } = (await res.json()) as { task: TaxTask };
        setRealTasks((prev) => [newTask, ...prev]);
        return true;
      } catch (error) {
        console.error("Error creando tarea fiscal:", error);
        return false;
      }
    },
    [isViewingSample, user]
  );

  const handleUpdateTaskStatus = useCallback(
    (taskId: string, status: TaxTaskStatus) => {
      const updater = (prev: TaxTask[]) => prev.map((t) => (t.id === taskId ? { ...t, status, updatedAt: new Date().toISOString() } : t));
      if (isViewingSample) {
        setDemoTasks(updater);
      } else {
        setRealTasks(updater);
        if (user) {
          user.getIdToken().then((token) => {
            fetch(`/api/tax-office/tasks/${taskId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ status })
            }).catch((error) => console.error("Error actualizando estado de la tarea fiscal:", error));
          });
        }
      }
    },
    [isViewingSample, user]
  );

  const handleAddAppointment = useCallback(
    async (input: NewTaxAppointmentInput): Promise<boolean> => {
      if (isViewingSample) {
        const newAppointment: TaxAppointment = { ...input, id: `TAP-DEMO-${Math.floor(100 + Math.random() * 900)}`, brokerId: "demo", createdAt: new Date().toISOString() };
        setDemoAppointments((prev) => [newAppointment, ...prev]);
        return true;
      }

      if (!user) return false;
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/tax-office/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(input)
        });
        if (!res.ok) return false;
        const { appointment: newAppointment } = (await res.json()) as { appointment: TaxAppointment };
        setRealAppointments((prev) => [newAppointment, ...prev]);
        return true;
      } catch (error) {
        console.error("Error creando cita fiscal:", error);
        return false;
      }
    },
    [isViewingSample, user]
  );

  const handleAddForm = useCallback(
    async (input: NewTaxFormTemplateInput): Promise<TaxFormTemplate | null> => {
      if (isViewingSample) {
        const now = new Date().toISOString();
        const newForm: TaxFormTemplate = {
          id: `TFM-DEMO-${Math.floor(100 + Math.random() * 900)}`,
          brokerId: "demo",
          name: input.name,
          serviceType: input.serviceType,
          status: "draft",
          version: 1,
          logoSize: "md",
          logoAlignment: "center",
          pages: [{ id: `page-${Date.now()}`, name: "Página 1", sections: [{ id: `section-${Date.now()}`, name: "Sección", fields: [] }] }],
          secureToken: `demo-token-${Date.now()}`,
          createdAt: now,
          updatedAt: now
        };
        setDemoForms((prev) => [newForm, ...prev]);
        return newForm;
      }

      if (!user) return null;
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/tax-office/forms", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(input)
        });
        if (!res.ok) return null;
        const { form: newForm } = (await res.json()) as { form: TaxFormTemplate };
        setRealForms((prev) => [newForm, ...prev]);
        return newForm;
      } catch (error) {
        console.error("Error creando formulario fiscal:", error);
        return null;
      }
    },
    [isViewingSample, user]
  );

  const handleUpdateForm = useCallback(
    async (formId: string, patch: Partial<TaxFormTemplate>): Promise<boolean> => {
      const updater = (prev: TaxFormTemplate[]) => prev.map((f) => (f.id === formId ? { ...f, ...patch, updatedAt: new Date().toISOString() } : f));

      if (isViewingSample) {
        setDemoForms(updater);
        return true;
      }

      if (!user) return false;
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/tax-office/forms/${formId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(patch)
        });
        if (!res.ok) return false;
        setRealForms(updater);
        return true;
      } catch (error) {
        console.error("Error actualizando formulario fiscal:", error);
        return false;
      }
    },
    [isViewingSample, user]
  );

  const handlePublishForm = useCallback(
    async (formId: string): Promise<boolean> => {
      if (isViewingSample) {
        setDemoForms((prev) => prev.map((f) => (f.id === formId ? { ...f, status: "published", version: f.version + 1, publishedAt: new Date().toISOString() } : f)));
        return true;
      }

      if (!user) return false;
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/tax-office/forms/${formId}/publish`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return false;
        const { form: updated } = (await res.json()) as { form: TaxFormTemplate };
        setRealForms((prev) => prev.map((f) => (f.id === formId ? updated : f)));
        return true;
      } catch (error) {
        console.error("Error publicando formulario fiscal:", error);
        return false;
      }
    },
    [isViewingSample, user]
  );

  const handleAiAssistForm = useCallback(
    async (formId: string, description: string): Promise<TaxFormField[] | null> => {
      if (isViewingSample) {
        // En modo demo no llamamos a Gemini de verdad — devolvemos un par de
        // campos de ejemplo para que la experiencia siga siendo interactiva.
        const demoFields: TaxFormField[] = [
          { id: `field-demo-${Date.now()}-1`, type: "short_text", label: "Campo generado por IA (demo)", required: false },
          { id: `field-demo-${Date.now()}-2`, type: "yes_no", label: `¿${description.slice(0, 40)}?`, required: false }
        ];
        setDemoForms((prev) =>
          prev.map((f) =>
            f.id === formId
              ? { ...f, pages: f.pages.map((p, i) => (i === 0 ? { ...p, sections: p.sections.map((s, j) => (j === 0 ? { ...s, fields: [...s.fields, ...demoFields] } : s)) } : p)) }
              : f
          )
        );
        return demoFields;
      }

      if (!user) return null;
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/tax-office/forms/${formId}/ai-assist`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ description })
        });
        if (!res.ok) return null;
        const { fields, pages } = (await res.json()) as { fields: TaxFormField[]; pages: TaxFormTemplate["pages"] };
        setRealForms((prev) => prev.map((f) => (f.id === formId ? { ...f, pages } : f)));
        return fields;
      } catch (error) {
        console.error("Error generando campos con IA:", error);
        return null;
      }
    },
    [isViewingSample, user]
  );

  const handleUploadFormAttachment = useCallback(
    async (formId: string, file: File): Promise<boolean> => {
      if (isViewingSample) {
        setDemoForms((prev) => prev.map((f) => (f.id === formId ? { ...f, attachmentName: file.name } : f)));
        return true;
      }

      if (!user) return false;
      try {
        const token = await user.getIdToken();
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`/api/tax-office/forms/${formId}/attachment`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        if (!res.ok) return false;
        setRealForms((prev) => prev.map((f) => (f.id === formId ? { ...f, attachmentName: file.name } : f)));
        return true;
      } catch (error) {
        console.error("Error subiendo adjunto del formulario fiscal:", error);
        return false;
      }
    },
    [isViewingSample, user]
  );

  const handleFetchFormSubmissions = useCallback(
    async (formId: string): Promise<TaxFormSubmission[]> => {
      // En modo demo no existe ningún mecanismo real para generar envíos —
      // el formulario público solo escribe contra una cuenta real vía su
      // secureToken real — así que la lista siempre sale vacía ahí.
      if (isViewingSample || !user) return [];
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/tax-office/forms/${formId}/submissions`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return [];
        const data = await res.json();
        return data.submissions || [];
      } catch (error) {
        console.error("Error obteniendo envíos del formulario fiscal:", error);
        return [];
      }
    },
    [isViewingSample, user]
  );

  const handleAddAutomation = useCallback(
    async (input: NewTaxAutomationInput): Promise<boolean> => {
      if (isViewingSample) {
        const newAutomation: TaxAutomation = { ...input, id: `TAU-DEMO-${Math.floor(100 + Math.random() * 900)}`, brokerId: "demo", createdAt: new Date().toISOString() };
        setDemoAutomations((prev) => [newAutomation, ...prev]);
        return true;
      }

      if (!user) return false;
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/tax-office/automations", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(input)
        });
        if (!res.ok) return false;
        const { automation: newAutomation } = (await res.json()) as { automation: TaxAutomation };
        setRealAutomations((prev) => [newAutomation, ...prev]);
        return true;
      } catch (error) {
        console.error("Error creando automatización fiscal:", error);
        return false;
      }
    },
    [isViewingSample, user]
  );

  const handleUpdateAutomationStatus = useCallback(
    (automationId: string, status: TaxAutomationStatus) => {
      const updater = (prev: TaxAutomation[]) => prev.map((a) => (a.id === automationId ? { ...a, status } : a));
      if (isViewingSample) {
        setDemoAutomations(updater);
      } else {
        setRealAutomations(updater);
        if (user) {
          user.getIdToken().then((token) => {
            fetch(`/api/tax-office/automations/${automationId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ status })
            }).catch((error) => console.error("Error actualizando estado de automatización fiscal:", error));
          });
        }
      }
    },
    [isViewingSample, user]
  );

  // Si no tiene acceso pagado y no activó el modo demo, mostramos el Paywall
  if (!hasAccess && !isDemoMode) {
    return <TaxOfficePaywall onEnableDemo={() => setIsDemoMode(true)} brokerName={brokerName} />;
  }

  const subTabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "cases", label: `Casos (${activeCases.length})`, icon: FolderKanban },
    { id: "clients", label: `Clientes (${activeClients.length})`, icon: Users },
    { id: "workflow", label: "Workflow", icon: Workflow },
    { id: "tasks", label: `Tasks (${activeTasks.filter((t) => t.status !== "completed").length})`, icon: ListChecks },
    { id: "appointments", label: "Appointments", icon: CalendarClock },
    { id: "invoices", label: `Facturación (${activeInvoices.length})`, icon: Receipt },
    { id: "commissions", label: "Comisiones", icon: Percent },
    { id: "templates", label: `Forms & Contracts (${activeForms.length})`, icon: FileText },
    { id: "automations", label: "Automations", icon: Zap },
  ];

  return (
    <div className="space-y-6">
      {/* Banner de Modo Demostración (para prospectos desde el Paywall) */}
      {isDemoMode && !hasAccess && (
        <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-cyan-300">
            <Sparkles size={16} className="text-cyan-400 shrink-0" />
            <span>
              <strong>Modo Demostración Activo:</strong> Estás explorando la Oficina Virtual E360 con datos de ejemplo interactivos.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://wa.me/17869680370?text=Hola%20E360,%20quiero%20activar%20mi%20Oficina%20Virtual%20de%20Taxes"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-extrabold rounded-xl text-[11px] transition-colors shadow-[0_0_15px_rgba(0,224,240,0.25)]"
            >
              Activar Licencia Real
            </a>
            <button
              onClick={() => setIsDemoMode(false)}
              className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-xl text-[11px] font-semibold transition-colors border border-gray-700 cursor-pointer"
            >
              Salir de Demo
            </button>
          </div>
        </div>
      )}

      {/* Banner de Datos de Muestra (para usuarios con acceso que activaron la vista previa) */}
      {hasAccess && showSampleData && (
        <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between text-xs text-cyan-300">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-cyan-400 shrink-0" />
            <span>
              <strong>Viendo datos de ejemplo:</strong> Estas cifras corresponden a la demostración comercial de Oficina Virtual E360.
            </span>
          </div>
          <button
            onClick={() => setShowSampleData(false)}
            className="text-white hover:text-cyan-300 underline font-bold cursor-pointer"
          >
            Volver a mis datos reales ({realCases.length} casos)
          </button>
        </div>
      )}

      {/* Subnavegación Interna de la Oficina Virtual — la tira de pestañas
          tiene su propio scroll horizontal (min-w-0 para que pueda encogerse
          dentro del flex row), separado de los botones de acción, que llevan
          shrink-0 para quedar siempre visibles y no desaparecer dentro del
          scroll junto con las pestañas. */}
      <div className="border-b border-gray-800 flex items-center justify-between gap-3 pb-px">
        <div className="flex items-center gap-2 overflow-x-auto min-w-0">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as SubTab)}
                className={`px-4 py-3 text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2 cursor-pointer shrink-0 ${
                  isActive
                    ? "border-cyan-400 text-cyan-400 bg-cyan-500/5"
                    : "border-transparent text-gray-400 hover:text-white hover:border-gray-700"
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasAccess && (
            <button
              onClick={() => setShowSampleData((prev) => !prev)}
              className={`hidden md:flex px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors items-center gap-1.5 cursor-pointer ${
                showSampleData
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-400"
                  : "bg-[#05101F] text-gray-400 border-gray-800 hover:text-white"
              }`}
            >
              <Eye size={13} />
              <span>{showSampleData ? "Ocultar Muestra" : "Ver Datos de Ejemplo"}</span>
            </button>
          )}

          <button
            onClick={() => setIsNewCaseModalOpen(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(0,224,240,0.25)] flex items-center gap-1.5 transition-all cursor-pointer shrink-0 my-1"
          >
            <Plus size={15} />
            <span>Nuevo Caso</span>
          </button>
        </div>
      </div>

      {/* Vista Activa */}
      {activeSubTab === "dashboard" && (
        <TaxOfficeDashboard
          stats={activeStats}
          cases={activeCases}
          invoices={activeInvoices}
          clients={activeClients}
          leads={activeLeads}
          tasks={activeTasks}
          appointments={activeAppointments}
          commissions={activeCommissions}
          onNewCase={() => setIsNewCaseModalOpen(true)}
          onNavigateTab={setActiveSubTab}
          onSelectCase={(c) => {
            setSelectedCase(c);
            setActiveSubTab("cases");
          }}
        />
      )}

      {activeSubTab === "cases" && (
        <TaxOfficeCasesTab
          cases={activeCases}
          onNewCase={() => setIsNewCaseModalOpen(true)}
          onUpdateCaseStage={handleUpdateCaseStage}
          selectedCase={selectedCase}
          onSelectCase={setSelectedCase}
        />
      )}

      {activeSubTab === "clients" && (
        <TaxOfficeClientsTab clients={activeClients} onAddClient={handleAddClient} onUpdateStatus={handleUpdateClientStatus} />
      )}

      {activeSubTab === "workflow" && (
        <TaxOfficeWorkflowTab
          pipelines={activePipelines}
          leads={activeLeads}
          onAddLead={handleAddLead}
          onMoveLead={handleMoveLead}
          onAddPipeline={handleAddPipeline}
          onUpdateStages={handleUpdateStages}
        />
      )}

      {activeSubTab === "tasks" && (
        <TaxOfficeTasksTab tasks={activeTasks} clients={activeClients} onAddTask={handleAddTask} onUpdateStatus={handleUpdateTaskStatus} />
      )}

      {activeSubTab === "appointments" && (
        <TaxOfficeAppointmentsTab appointments={activeAppointments} clients={activeClients} onAddAppointment={handleAddAppointment} />
      )}

      {activeSubTab === "invoices" && (
        <TaxOfficeInvoicesTab
          invoices={activeInvoices}
          cases={activeCases}
          clients={activeClients}
          onAddInvoice={handleAddInvoice}
          onUpdateStatus={handleUpdateInvoiceStatus}
        />
      )}

      {activeSubTab === "commissions" && (
        <TaxOfficeCommissionsTab commissions={activeCommissions} onAddCommission={handleAddCommission} />
      )}

      {activeSubTab === "templates" && (
        <TaxOfficeFormsTab
          forms={activeForms}
          onAddForm={handleAddForm}
          onUpdateForm={handleUpdateForm}
          onPublishForm={handlePublishForm}
          onAiAssist={handleAiAssistForm}
          onUploadAttachment={handleUploadFormAttachment}
          onFetchSubmissions={handleFetchFormSubmissions}
        />
      )}

      {activeSubTab === "automations" && (
        <TaxOfficeAutomationsTab automations={activeAutomations} onAddAutomation={handleAddAutomation} onUpdateStatus={handleUpdateAutomationStatus} />
      )}

      {/* Modal de Nuevo Caso Fiscal */}
      <NewTaxCaseModal
        isOpen={isNewCaseModalOpen}
        onClose={() => setIsNewCaseModalOpen(false)}
        onCaseCreated={handleCaseCreated}
        clients={activeClients}
      />
    </div>
  );
}
