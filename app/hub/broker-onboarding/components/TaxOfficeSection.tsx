"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { LayoutDashboard, FolderKanban, Receipt, Users, FileText, Sparkles, Plus, Eye } from "lucide-react";
import TaxOfficePaywall from "./tax-office/TaxOfficePaywall";
import TaxOfficeDashboard from "./tax-office/TaxOfficeDashboard";
import TaxOfficeCasesTab from "./tax-office/TaxOfficeCasesTab";
import TaxOfficeInvoicesTab from "./tax-office/TaxOfficeInvoicesTab";
import TaxOfficeCommissionsTab from "./tax-office/TaxOfficeCommissionsTab";
import TaxOfficeTemplatesTab from "./tax-office/TaxOfficeTemplatesTab";
import NewTaxCaseModal from "./tax-office/NewTaxCaseModal";
import {
  INITIAL_TAX_CASES,
  INITIAL_TAX_INVOICES,
  INITIAL_TAX_COMMISSIONS,
  INITIAL_TAX_STATS,
  TaxOfficeStats
} from "./tax-office/mock-tax-data";
import {
  TaxCase,
  TaxCaseStage,
  TaxInvoice,
  TaxCommissionItem,
  NewTaxCaseInput,
  NewTaxInvoiceInput,
  NewTaxCommissionInput
} from "../types";

type SubTab = "dashboard" | "cases" | "invoices" | "commissions" | "templates";

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
  const [demoCases, setDemoCases] = useState<TaxCase[]>(INITIAL_TAX_CASES);
  const [demoInvoices, setDemoInvoices] = useState<TaxInvoice[]>(INITIAL_TAX_INVOICES);
  const [demoCommissions, setDemoCommissions] = useState<TaxCommissionItem[]>(INITIAL_TAX_COMMISSIONS);

  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<TaxCase | null>(null);

  const activeCases = isViewingSample ? demoCases : realCases;
  const activeInvoices = isViewingSample ? demoInvoices : realInvoices;
  const activeCommissions = isViewingSample ? demoCommissions : realCommissions;

  // Carga los datos reales una sola vez cuando la cuenta tiene acceso pagado —
  // independiente de si en ese momento se está viendo la muestra de demo.
  useEffect(() => {
    if (!hasAccess || !user) return;
    let cancelled = false;

    (async () => {
      try {
        const token = await user.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };
        const [casesRes, invoicesRes, commissionsRes] = await Promise.all([
          fetch("/api/tax-office/cases", { headers }),
          fetch("/api/tax-office/invoices", { headers }),
          fetch("/api/tax-office/commissions", { headers })
        ]);
        if (cancelled) return;
        if (casesRes.ok) setRealCases((await casesRes.json()).cases);
        if (invoicesRes.ok) setRealInvoices((await invoicesRes.json()).invoices);
        if (commissionsRes.ok) setRealCommissions((await commissionsRes.json()).commissions);
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

    const outstandingBalance = activeInvoices
      .filter((i) => i.status === "pending")
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
          status: "pending",
          dueDate: new Date(now.getTime() + 7 * 86400000).toISOString().split("T")[0],
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
        const e360FeeDeduction = input.underMentorship ? input.totalReturns * 60 : 0;
        const netCommission = Math.round(input.grossVolume * (input.splitPercentage / 100)) - e360FeeDeduction;
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

  // Si no tiene acceso pagado y no activó el modo demo, mostramos el Paywall
  if (!hasAccess && !isDemoMode) {
    return <TaxOfficePaywall onEnableDemo={() => setIsDemoMode(true)} brokerName={brokerName} />;
  }

  const subTabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "cases", label: `Casos (${activeCases.length})`, icon: FolderKanban },
    { id: "invoices", label: `Facturación (${activeInvoices.length})`, icon: Receipt },
    { id: "commissions", label: "Comisiones", icon: Users },
    { id: "templates", label: "Plantillas IRS", icon: FileText },
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

      {/* Subnavegación Interna de la Oficina Virtual */}
      <div className="border-b border-gray-800 flex items-center justify-between overflow-x-auto pb-px">
        <div className="flex items-center gap-2">
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

        <div className="flex items-center gap-2">
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

      {activeSubTab === "invoices" && (
        <TaxOfficeInvoicesTab invoices={activeInvoices} onAddInvoice={handleAddInvoice} />
      )}

      {activeSubTab === "commissions" && (
        <TaxOfficeCommissionsTab commissions={activeCommissions} onAddCommission={handleAddCommission} />
      )}

      {activeSubTab === "templates" && <TaxOfficeTemplatesTab />}

      {/* Modal de Nuevo Caso Fiscal */}
      <NewTaxCaseModal
        isOpen={isNewCaseModalOpen}
        onClose={() => setIsNewCaseModalOpen(false)}
        onCaseCreated={handleCaseCreated}
      />
    </div>
  );
}
