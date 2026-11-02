"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { LayoutDashboard, FolderKanban, Receipt, Users, FileText, Lock, Sparkles, Plus, AlertCircle, ArrowLeft } from "lucide-react";
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
import { TaxCase, TaxCaseStage, TaxInvoice } from "../types";

type SubTab = "dashboard" | "cases" | "invoices" | "commissions" | "templates";

interface TaxOfficeSectionProps {
  brokerName: string;
}

export default function TaxOfficeSection({ brokerName }: TaxOfficeSectionProps) {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const hasAccess = Boolean(profile?.taxOfficeAccess || isAdmin);

  const [isDemoMode, setIsDemoMode] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("dashboard");
  const [cases, setCases] = useState<TaxCase[]>(INITIAL_TAX_CASES);
  const [invoices, setInvoices] = useState<TaxInvoice[]>(INITIAL_TAX_INVOICES);
  const [commissions] = useState(INITIAL_TAX_COMMISSIONS);
  const [stats, setStats] = useState<TaxOfficeStats>(INITIAL_TAX_STATS);
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<TaxCase | null>(null);

  const handleCaseCreated = (newCase: TaxCase) => {
    setCases((prev) => [newCase, ...prev]);
    setStats((prev) => ({
      ...prev,
      totalCasesCount: prev.totalCasesCount + 1,
      stageCounts: {
        ...prev.stageCounts,
        new: prev.stageCounts.new + 1,
      },
    }));
  };

  const handleUpdateCaseStage = (caseId: string, newStage: TaxCaseStage) => {
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, stage: newStage, updatedAt: new Date().toISOString() } : c))
    );
    if (selectedCase && selectedCase.id === caseId) {
      setSelectedCase((prev) => (prev ? { ...prev, stage: newStage } : null));
    }
  };

  const handleAddInvoice = (newInv: TaxInvoice) => {
    setInvoices((prev) => [newInv, ...prev]);
  };

  // Si no tiene acceso pagado y no activó el modo demo, mostramos el Paywall
  if (!hasAccess && !isDemoMode) {
    return <TaxOfficePaywall onEnableDemo={() => setIsDemoMode(true)} brokerName={brokerName} />;
  }

  const subTabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "cases", label: `Casos (${cases.length})`, icon: FolderKanban },
    { id: "invoices", label: `Facturación (${invoices.length})`, icon: Receipt },
    { id: "commissions", label: "Comisiones", icon: Users },
    { id: "templates", label: "Plantillas IRS", icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Banner de Modo Demostración si no tiene licencia real */}
      {isDemoMode && !hasAccess && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-300">
            <Sparkles size={16} className="text-amber-400 shrink-0" />
            <span>
              <strong>Modo Demostración Activo:</strong> Estás probando la Oficina Virtual E360 con datos de ejemplo interactivos.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://wa.me/17869680370?text=Hola%20E360,%20quiero%20activar%20mi%20Oficina%20Virtual%20de%20Taxes"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-lg text-[11px] transition-colors"
            >
              Activar Licencia Real
            </a>
            <button
              onClick={() => setIsDemoMode(false)}
              className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-lg text-[11px] font-semibold transition-colors"
            >
              Salir de Demo
            </button>
          </div>
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

        <button
          onClick={() => setIsNewCaseModalOpen(true)}
          className="hidden sm:flex px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(0,224,240,0.25)] items-center gap-1.5 transition-all cursor-pointer shrink-0 my-1"
        >
          <Plus size={15} />
          <span>Nuevo Caso</span>
        </button>
      </div>

      {/* Vista Activa */}
      {activeSubTab === "dashboard" && (
        <TaxOfficeDashboard
          stats={stats}
          cases={cases}
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
          cases={cases}
          onNewCase={() => setIsNewCaseModalOpen(true)}
          onUpdateCaseStage={handleUpdateCaseStage}
          selectedCase={selectedCase}
          onSelectCase={setSelectedCase}
        />
      )}

      {activeSubTab === "invoices" && (
        <TaxOfficeInvoicesTab invoices={invoices} onAddInvoice={handleAddInvoice} />
      )}

      {activeSubTab === "commissions" && (
        <TaxOfficeCommissionsTab commissions={commissions} />
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
