"use client";

import { useState, useMemo } from "react";
import { 
  Search, Plus, Filter, FileText, CheckCircle2, Clock, Landmark, 
  Send, AlertTriangle, Eye, X, ChevronRight, User, Phone, Mail 
} from "lucide-react";
import { TaxCase, TaxCaseStage, TaxServiceType } from "../../types";

interface TaxOfficeCasesTabProps {
  cases: TaxCase[];
  onNewCase: () => void;
  onUpdateCaseStage: (caseId: string, newStage: TaxCaseStage) => void;
  selectedCase: TaxCase | null;
  onSelectCase: (c: TaxCase | null) => void;
}

const STAGES: { id: TaxCaseStage | "all"; label: string }[] = [
  { id: "all", label: "Todos los Estados" },
  { id: "new", label: "Nuevos Leads" },
  { id: "docs_pending", label: "Docs Pendientes" },
  { id: "in_review", label: "En Revisión" },
  { id: "ready_to_file", label: "Listos para E-File" },
  { id: "transmitted", label: "Transmitidos al IRS" },
  { id: "accepted", label: "Aceptados / Pagados" },
];

export default function TaxOfficeCasesTab({
  cases,
  onNewCase,
  onUpdateCaseStage,
  selectedCase,
  onSelectCase,
}: TaxOfficeCasesTabProps) {
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState<number | "all">("all");
  const [stageFilter, setStageFilter] = useState<TaxCaseStage | "all">("all");

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const matchSearch =
        c.clientName.toLowerCase().includes(search.toLowerCase()) ||
        c.clientEmail.toLowerCase().includes(search.toLowerCase()) ||
        c.clientPhone.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase());

      const matchYear = yearFilter === "all" || c.taxYear === yearFilter;
      const matchStage = stageFilter === "all" || c.stage === stageFilter;

      return matchSearch && matchYear && matchStage;
    });
  }, [cases, search, yearFilter, stageFilter]);

  const getStageBadge = (stage: TaxCaseStage) => {
    switch (stage) {
      case "new":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "docs_pending":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "in_review":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "ready_to_file":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "transmitted":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "accepted":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const getStageLabel = (stage: TaxCaseStage) => {
    switch (stage) {
      case "new":
        return "Nuevo Lead";
      case "docs_pending":
        return "Docs Pendientes";
      case "in_review":
        return "En Revisión";
      case "ready_to_file":
        return "Listo E-File";
      case "transmitted":
        return "Transmitido";
      case "accepted":
        return "Aceptado IRS";
      default:
        return stage;
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros y Búsqueda */}
      <div className="p-5 rounded-2xl bg-[#0A182D]/80 border border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente, teléfono, email o ID de caso..."
              className="w-full bg-[#05101F] border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="bg-[#05101F] border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none cursor-pointer"
          >
            <option value="all">Todos los Años</option>
            <option value={2025}>2025 (Actual)</option>
            <option value={2024}>2024</option>
            <option value={2023}>2023</option>
          </select>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as TaxCaseStage | "all")}
            className="bg-[#05101F] border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none cursor-pointer hidden sm:block"
          >
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onNewCase}
          className="w-full md:w-auto px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,224,240,0.3)] flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
        >
          <Plus size={16} />
          <span>Nuevo Caso de Tax</span>
        </button>
      </div>

      {/* Tabla de Casos */}
      <div className="p-6 rounded-2xl bg-[#0A182D]/80 border border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <p className="text-xs text-gray-400">
            Mostrando <strong className="text-white">{filteredCases.length}</strong> expedientes fiscales
          </p>
        </div>

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                <th className="py-3 pl-2">ID & Contribuyente</th>
                <th className="py-3">Servicio Fiscal</th>
                <th className="py-3">Año</th>
                <th className="py-3">Honorario</th>
                <th className="py-3">Banco / Adelanto</th>
                <th className="py-3">Docs</th>
                <th className="py-3">Estado</th>
                <th className="py-3 text-right pr-2">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500 italic">
                    No se encontraron casos fiscales que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-900/40 transition-colors group">
                    <td className="py-3.5 pl-2">
                      <div className="font-bold text-white group-hover:text-cyan-300 transition-colors">{c.clientName}</div>
                      <div className="text-[10px] text-gray-500 flex items-center gap-2 mt-0.5 font-mono">
                        <span>{c.id}</span>
                        <span>•</span>
                        <span>{c.clientPhone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-gray-300 capitalize">
                      {c.serviceType.replace("_", " ")}
                    </td>
                    <td className="py-3.5 text-gray-300 font-mono">{c.taxYear}</td>
                    <td className="py-3.5 text-emerald-400 font-bold">{formatMoney(c.agreedFee)}</td>
                    <td className="py-3.5">
                      {c.bankProduct ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 uppercase">
                            {c.bankPartner}
                          </span>
                          {c.refundAdvanceRequested && (
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                              Adelanto
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-500 font-medium">Pago Directo</span>
                      )}
                    </td>
                    <td className="py-3.5 text-gray-400 font-mono">
                      {c.documentsCount} archivos
                    </td>
                    <td className="py-3.5">
                      <span className={`inline-flex text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStageBadge(c.stage)}`}>
                        {getStageLabel(c.stage)}
                      </span>
                    </td>
                    <td className="py-3.5 text-right pr-2">
                      <button
                        onClick={() => onSelectCase(c)}
                        className="px-3 py-1.5 text-xs font-semibold text-cyan-400 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg transition-colors cursor-pointer"
                      >
                        Gestionar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Slide-over de Detalle de Caso */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0A182D] border border-cyan-500/30 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[#05101F]">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">{selectedCase.id}</span>
                <h3 className="font-extrabold text-base text-white">{selectedCase.clientName}</h3>
              </div>
              <button
                onClick={() => onSelectCase(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-gray-300">
              {/* Info de contacto */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#05101F] border border-gray-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-500">Teléfono</span>
                  <p className="text-white font-medium mt-0.5">{selectedCase.clientPhone}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-500">Correo</span>
                  <p className="text-white font-medium mt-0.5 truncate">{selectedCase.clientEmail}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-500">Año Fiscal</span>
                  <p className="text-white font-mono mt-0.5">{selectedCase.taxYear}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-500">Honorario Acordado</span>
                  <p className="text-emerald-400 font-bold mt-0.5">{formatMoney(selectedCase.agreedFee)}</p>
                </div>
              </div>

              {/* Estado actual & avance */}
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Avanzar Estado del Expediente</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {(["new", "docs_pending", "in_review", "ready_to_file", "transmitted", "accepted"] as TaxCaseStage[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => onUpdateCaseStage(selectedCase.id, st)}
                      className={`p-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        selectedCase.stage === st
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 ring-1 ring-cyan-400"
                          : "bg-gray-900/40 text-gray-400 border-gray-800 hover:border-gray-700"
                      }`}
                    >
                      {getStageLabel(st)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Producto Bancario */}
              <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-900/40 space-y-1">
                <span className="text-[10px] uppercase font-bold text-cyan-400">Integración Bancaria</span>
                <p className="text-xs text-white">
                  {selectedCase.bankProduct ? (
                    <>Banco: <strong>{selectedCase.bankPartner?.toUpperCase()}</strong> • Deducción directa del reembolso{selectedCase.refundAdvanceRequested ? " • Adelanto solicitado" : ""}</>
                  ) : (
                    "Cobro directo al cliente (Sin producto bancario)"
                  )}
                </p>
              </div>

              {/* Notas */}
              {selectedCase.notes && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-500">Notas de Preparación</span>
                  <p className="mt-1 text-xs text-gray-300 bg-[#05101F] p-3 rounded-xl border border-gray-800 leading-relaxed">
                    {selectedCase.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-800 bg-[#05101F] flex justify-end">
              <button
                onClick={() => onSelectCase(null)}
                className="px-5 py-2 rounded-xl bg-cyan-500 text-black font-extrabold text-xs cursor-pointer"
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
