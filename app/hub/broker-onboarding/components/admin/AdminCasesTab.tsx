"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Edit3,
  X,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Banknote,
  MessageSquare,
  FileText,
  Paperclip,
  Download,
  Send,
  User
} from "lucide-react";
import { CaseNote, CaseNoteCategory, CaseDocument } from "../../types";

export interface CaseItem {
  id: string;
  brokerId: string;
  brokerName: string;
  brokerEmail: string;
  brokerTier: string;
  name: string;
  email: string;
  phone: string;
  serviceName: string;
  serviceId?: string;
  pipelineCluster: string;
  amount: number;
  estimatedCommission: number;
  status: string;
  createdAt: string;
  lastActivity?: string;
  notes?: string;
  adminNotes?: string;
  ghlContactId?: string;
  ghlOpportunityId?: string;
}

interface AdminCasesTabProps {
  cases: CaseItem[];
  loading: boolean;
  onRefresh: () => void;
}

export default function AdminCasesTab({ cases, loading, onRefresh }: AdminCasesTabProps) {
  const [search, setSearch] = useState<string>("");
  const [selectedCluster, setSelectedCluster] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedBroker, setSelectedBroker] = useState<string>("all");

  // Modal de Detalle / Edición
  const [activeCase, setActiveCase] = useState<CaseItem | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [editCommission, setEditCommission] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string>("");

  // Expediente de Caso: notas segmentadas por audiencia + documentos
  const [activeDetailTab, setActiveDetailTab] = useState<CaseNoteCategory | "documents">("case");
  const [caseNotes, setCaseNotes] = useState<CaseNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState<boolean>(false);
  const [newNoteContent, setNewNoteContent] = useState<string>("");
  const [savingNote, setSavingNote] = useState<boolean>(false);
  const [caseDocuments, setCaseDocuments] = useState<(CaseDocument & { downloadUrl: string | null })[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState<boolean>(false);
  const [uploadingDocument, setUploadingDocument] = useState<boolean>(false);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
  };

  // Lista única de brokers para el dropdown
  const uniqueBrokers = useMemo(() => {
    const map = new Map<string, string>();
    cases.forEach((c) => {
      if (c.brokerId && !map.has(c.brokerId)) {
        map.set(c.brokerId, c.brokerName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [cases]);

  // Filtrado reactivo
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // Búsqueda
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.brokerName.toLowerCase().includes(q) ||
          c.serviceName.toLowerCase().includes(q);
        if (!matches) return false;
      }
      // Cluster
      if (selectedCluster !== "all" && c.pipelineCluster !== selectedCluster) {
        return false;
      }
      // Status
      if (selectedStatus !== "all" && c.status !== selectedStatus) {
        return false;
      }
      // Broker
      if (selectedBroker !== "all" && c.brokerId !== selectedBroker) {
        return false;
      }
      return true;
    });
  }, [cases, search, selectedCluster, selectedStatus, selectedBroker]);

  // KPIs agregados de la selección actual
  const kpis = useMemo(() => {
    let totalVol = 0;
    let totalComm = 0;
    let fundedCount = 0;

    filteredCases.forEach((c) => {
      totalVol += c.amount;
      totalComm += c.estimatedCommission;
      if (c.status === "funded" || c.status === "approved") {
        fundedCount++;
      }
    });

    return {
      count: filteredCases.length,
      totalVolume: totalVol,
      totalCommission: totalComm,
      fundedCount,
    };
  }, [filteredCases]);

  const fetchCaseNotes = useCallback(async (brokerId: string, clientId: string) => {
    setLoadingNotes(true);
    try {
      const res = await fetch(`/api/admin/cases/notes?brokerId=${brokerId}&clientId=${clientId}`);
      const data = await res.json();
      if (res.ok) setCaseNotes(data.notes || []);
    } catch (err) {
      console.error("Error cargando notas del caso:", err);
    } finally {
      setLoadingNotes(false);
    }
  }, []);

  const fetchCaseDocuments = useCallback(async (brokerId: string, clientId: string) => {
    setLoadingDocuments(true);
    try {
      const res = await fetch(`/api/admin/cases/documents?brokerId=${brokerId}&clientId=${clientId}`);
      const data = await res.json();
      if (res.ok) setCaseDocuments(data.documents || []);
    } catch (err) {
      console.error("Error cargando documentos del caso:", err);
    } finally {
      setLoadingDocuments(false);
    }
  }, []);

  const openDetailModal = (c: CaseItem) => {
    setActiveCase(c);
    setEditStatus(c.status);
    setEditCommission(String(c.estimatedCommission || 0));
    setSaveError("");
    setActiveDetailTab("case");
    setNewNoteContent("");
    setCaseNotes([]);
    setCaseDocuments([]);
    fetchCaseNotes(c.brokerId, c.id);
    fetchCaseDocuments(c.brokerId, c.id);
  };

  const handleSaveCase = async (statusOverride?: string) => {
    if (!activeCase) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/admin/cases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brokerId: activeCase.brokerId,
          clientId: activeCase.id,
          status: statusOverride || editStatus,
          estimatedCommission: Number(editCommission) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar caso");

      if (statusOverride) {
        setEditStatus(statusOverride);
      } else {
        setActiveCase(null);
      }
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!activeCase || !newNoteContent.trim() || activeDetailTab === "documents") return;
    setSavingNote(true);
    setSaveError("");
    try {
      const res = await fetch("/api/admin/cases/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brokerId: activeCase.brokerId,
          clientId: activeCase.id,
          category: activeDetailTab,
          content: newNoteContent.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar la nota");

      setNewNoteContent("");
      fetchCaseNotes(activeCase.brokerId, activeCase.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setSaveError(msg);
    } finally {
      setSavingNote(false);
    }
  };

  const handleUploadDocument = async (file: File) => {
    if (!activeCase) return;
    setUploadingDocument(true);
    setSaveError("");
    try {
      const formData = new FormData();
      formData.append("brokerId", activeCase.brokerId);
      formData.append("clientId", activeCase.id);
      formData.append("file", file);

      const res = await fetch("/api/admin/cases/documents", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir el documento");

      fetchCaseDocuments(activeCase.brokerId, activeCase.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setSaveError(msg);
    } finally {
      setUploadingDocument(false);
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "funded":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1"><CheckCircle2 size={11} /> Fondeado</span>;
      case "approved":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1"><CheckCircle2 size={11} /> Aprobado</span>;
      case "in_progress":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1"><Clock size={11} /> En Underwriting</span>;
      case "failed_sync":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1"><AlertTriangle size={11} /> Fallo Sync</span>;
      case "rejected":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-700 text-gray-400 border border-gray-600 flex items-center gap-1"><XCircle size={11} /> Declinado</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1"><CheckCircle2 size={11} /> Ingresado GHL</span>;
    }
  };

  const getClusterBadge = (cluster: string) => {
    switch (cluster) {
      case "fondeo_rapido":
        return <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 uppercase">Fondeo Rápido</span>;
      case "real_estate":
        return <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">Real Estate</span>;
      case "credit_repair":
        return <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30 uppercase">Rep. Crédito</span>;
      case "seguros":
        return <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase">Seguros</span>;
      case "corporativo":
        return <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">Corporativo</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-gray-800 text-gray-400 uppercase">{cluster}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. KPIs de la Vista Filtrada */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0A182D]/70 border border-gray-800 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Solicitudes</p>
          <p className="text-2xl font-extrabold text-white mt-1">{kpis.count}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Casos en la vista actual</p>
        </div>

        <div className="bg-[#0A182D]/70 border border-gray-800 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Volumen Filtrado</p>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{formatMoney(kpis.totalVolume)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Monto total solicitado</p>
        </div>

        <div className="bg-[#0A182D]/70 border border-gray-800 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Comisiones Estimadas</p>
          <p className="text-2xl font-extrabold text-cyan-400 mt-1">{formatMoney(kpis.totalCommission)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Honorarios proyectados</p>
        </div>

        <div className="bg-[#0A182D]/70 border border-gray-800 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Aprobados / Fondeados</p>
          <p className="text-2xl font-extrabold text-white mt-1">
            {kpis.fundedCount}
            <span className="text-xs text-emerald-400 font-normal ml-2">
              ({kpis.count > 0 ? Math.round((kpis.fundedCount / kpis.count) * 100) : 0}%)
            </span>
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Tasa de éxito comercial</p>
        </div>
      </div>

      {/* 2. Barra de Filtros y Búsqueda */}
      <div className="bg-[#0A182D]/60 border border-gray-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Buscador */}
          <div className="relative md:col-span-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente, broker, teléfono..."
              className="w-full bg-[#05101F] border border-gray-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Selector Cluster */}
          <div>
            <select
              value={selectedCluster}
              onChange={(e) => setSelectedCluster(e.target.value)}
              className="w-full bg-[#05101F] border border-gray-800 rounded-xl py-2 px-3 text-xs text-gray-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">📁 Todos los Clusters</option>
              <option value="fondeo_rapido">💳 Fondeo Rápido (MCA, Loans)</option>
              <option value="real_estate">🏠 Real Estate & Hipotecas</option>
              <option value="credit_repair">⚖️ Reparación de Crédito</option>
              <option value="seguros">🛡️ Seguros & Pólizas</option>
              <option value="corporativo">🏢 Corporativo (LLC, Taxes)</option>
            </select>
          </div>

          {/* Selector Estado */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-[#05101F] border border-gray-800 rounded-xl py-2 px-3 text-xs text-gray-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">⚡ Todos los Estados</option>
              <option value="synced">Sincronizado / Ingresado</option>
              <option value="in_progress">En Underwriting</option>
              <option value="approved">Aprobado</option>
              <option value="funded">Fondeado / Pagado</option>
              <option value="failed_sync">Fallo Sincronización</option>
              <option value="rejected">Declinado</option>
            </select>
          </div>

          {/* Selector Broker */}
          <div>
            <select
              value={selectedBroker}
              onChange={(e) => setSelectedBroker(e.target.value)}
              className="w-full bg-[#05101F] border border-gray-800 rounded-xl py-2 px-3 text-xs text-gray-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">👤 Todos los Brokers ({uniqueBrokers.length})</option>
              {uniqueBrokers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Tabla Principal de Casos */}
      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm flex items-center justify-center gap-3">
          <Loader2 size={18} className="animate-spin text-cyan-400" />
          <span>Cargando Master Feed de Solicitudes...</span>
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="py-16 text-center text-gray-500 bg-[#0A182D]/40 border border-gray-800 rounded-2xl">
          No se encontraron solicitudes con los filtros seleccionados.
        </div>
      ) : (
        <div className="bg-[#0A182D]/50 border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#05101F] text-gray-400 uppercase font-mono text-[10px] tracking-wider border-b border-gray-800">
                <tr>
                  <th className="p-4">Cliente / Solicitante</th>
                  <th className="p-4">Servicio & Cluster</th>
                  <th className="p-4">Broker Atribuido</th>
                  <th className="p-4 text-right">Monto</th>
                  <th className="p-4 text-right">Comisión</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-center">Fecha</th>
                  <th className="p-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filteredCases.map((c) => (
                  <tr key={`${c.brokerId}-${c.id}`} className="hover:bg-[#05101F]/80 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-white text-sm">{c.name}</p>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Mail size={12} /> {c.email || "(sin email)"}
                      </p>
                      {c.phone && (
                        <p className="text-[11px] text-gray-500 flex items-center gap-1">
                          <Phone size={12} /> {c.phone}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-gray-200">{c.serviceName}</p>
                      <div className="mt-1">{getClusterBadge(c.pipelineCluster)}</div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-cyan-400">{c.brokerName}</p>
                      <span className="text-[10px] text-gray-500 font-mono">{c.brokerTier}</span>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-emerald-400 text-sm">
                      {formatMoney(c.amount)}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-cyan-300 text-sm">
                      {formatMoney(c.estimatedCommission)}
                    </td>
                    <td className="p-4 text-center">{getStatusBadge(c.status)}</td>
                    <td className="p-4 text-center text-gray-500 font-mono text-[11px]">
                      {c.createdAt || "—"}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => openDetailModal(c)}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                      >
                        <Edit3 size={13} />
                        <span>Gestionar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. MODAL DE GESTIÓN Y EDICIÓN DEL CASO */}
      <AnimatePresence>
        {activeCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0A182D] border border-cyan-500/40 rounded-3xl p-6 md:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 relative"
            >
              <div className="flex items-start justify-between border-b border-gray-800 pb-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
                    Expediente Central E360
                  </span>
                  <h3 className="text-xl font-extrabold text-white mt-1">{activeCase.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{activeCase.serviceName}</p>
                </div>
                <button
                  onClick={() => setActiveCase(null)}
                  className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {saveError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
                  {saveError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-[#05101F] p-4 rounded-xl border border-gray-800 space-y-2">
                  <p className="text-[10px] text-gray-500 uppercase font-mono font-bold">Datos del Solicitante</p>
                  <p className="text-gray-300"><strong>Email:</strong> {activeCase.email || "—"}</p>
                  <p className="text-gray-300"><strong>Teléfono:</strong> {activeCase.phone || "—"}</p>
                  <p className="text-gray-300"><strong>Monto Solicitado:</strong> {formatMoney(activeCase.amount)}</p>
                </div>

                <div className="bg-[#05101F] p-4 rounded-xl border border-gray-800 space-y-2">
                  <p className="text-[10px] text-gray-500 uppercase font-mono font-bold">Broker & Atribución</p>
                  <p className="text-gray-300"><strong>Broker:</strong> {activeCase.brokerName}</p>
                  <p className="text-gray-300"><strong>Email:</strong> {activeCase.brokerEmail}</p>
                  <p className="text-gray-300"><strong>Tier:</strong> {activeCase.brokerTier}</p>
                </div>
              </div>

              {/* Acciones Rápidas de Decisión */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveCase("approved")}
                  disabled={saving}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 ${
                    editStatus === "approved" ? "bg-cyan-500 text-black" : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20"
                  }`}
                >
                  <ThumbsUp size={14} /> Aprobar
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveCase("rejected")}
                  disabled={saving}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 ${
                    editStatus === "rejected" ? "bg-gray-600 text-white" : "bg-gray-700/40 text-gray-400 border border-gray-600 hover:bg-gray-700/60"
                  }`}
                >
                  <ThumbsDown size={14} /> Declinar
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveCase("funded")}
                  disabled={saving}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 ${
                    editStatus === "funded" ? "bg-emerald-500 text-black" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                  }`}
                >
                  <Banknote size={14} /> Marcar Fondeado
                </button>
              </div>

              {/* Controles de Actualización */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1.5">
                    Estado Operativo
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="synced">Sincronizado / Ingresado</option>
                    <option value="in_progress">En Underwriting</option>
                    <option value="approved">Aprobado (Listo para oferta)</option>
                    <option value="funded">Fondeado / Pagado</option>
                    <option value="failed_sync">Fallo de Sincronización</option>
                    <option value="rejected">Declinado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1.5">
                    Comisión Broker ($)
                  </label>
                  <input
                    type="number"
                    value={editCommission}
                    onChange={(e) => setEditCommission(e.target.value)}
                    className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Expediente de Caso: Notas segmentadas + Documentos */}
              <div className="border border-gray-800 rounded-2xl overflow-hidden">
                <div className="flex items-center overflow-x-auto bg-[#05101F] border-b border-gray-800">
                  {[
                    { id: "observation" as const, label: "Notas de Observación", icon: FileText },
                    { id: "case" as const, label: "Notas del Caso", icon: MessageSquare },
                    { id: "broker" as const, label: "Notas para el Broker", icon: User },
                    { id: "documents" as const, label: "Documentos", icon: Paperclip },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveDetailTab(tab.id)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-bold whitespace-nowrap border-b-2 transition-colors ${
                          activeDetailTab === tab.id
                            ? "border-cyan-400 text-cyan-400"
                            : "border-transparent text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        <Icon size={13} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                  {activeDetailTab === "documents" ? (
                    <>
                      {loadingDocuments ? (
                        <p className="text-xs text-gray-500 flex items-center gap-2"><Loader2 size={13} className="animate-spin" /> Cargando documentos...</p>
                      ) : caseDocuments.length === 0 ? (
                        <p className="text-xs text-gray-500">Sin documentos adjuntos todavía.</p>
                      ) : (
                        caseDocuments.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between bg-[#05101F] border border-gray-800 rounded-xl p-3 text-xs">
                            <div className="min-w-0">
                              <p className="text-gray-200 font-semibold truncate">{doc.fileName}</p>
                              <p className="text-[10px] text-gray-500">{doc.uploadedByName} · {new Date(doc.createdAt).toLocaleString()}</p>
                            </div>
                            {doc.downloadUrl && (
                              <a
                                href={doc.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-cyan-400 hover:text-cyan-300 shrink-0"
                              >
                                <Download size={16} />
                              </a>
                            )}
                          </div>
                        ))
                      )}
                    </>
                  ) : loadingNotes ? (
                    <p className="text-xs text-gray-500 flex items-center gap-2"><Loader2 size={13} className="animate-spin" /> Cargando notas...</p>
                  ) : caseNotes.filter((n) => n.category === activeDetailTab).length === 0 ? (
                    <p className="text-xs text-gray-500">Sin notas todavía en esta categoría.</p>
                  ) : (
                    caseNotes
                      .filter((n) => n.category === activeDetailTab)
                      .map((note) => (
                        <div key={note.id} className="bg-[#05101F] border border-gray-800 rounded-xl p-3 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-cyan-400">{note.authorName}</span>
                            <span className="text-[10px] text-gray-500">{new Date(note.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-gray-300 whitespace-pre-wrap">{note.content}</p>
                        </div>
                      ))
                  )}
                </div>

                <div className="p-3 border-t border-gray-800 bg-[#05101F]/60">
                  {activeDetailTab === "documents" ? (
                    <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-bold cursor-pointer transition-colors">
                      {uploadingDocument ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
                      <span>{uploadingDocument ? "Subiendo..." : "Subir Documento (PDF/Imagen, máx. 8MB)"}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        className="hidden"
                        disabled={uploadingDocument}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadDocument(file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  ) : (
                    <div className="relative">
                      <textarea
                        rows={2}
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        placeholder={
                          activeDetailTab === "broker"
                            ? "Escribe una actualización que el broker podrá ver en su panel..."
                            : "Escribe una nota interna sobre este caso..."
                        }
                        className="w-full bg-[#0A182D] border border-gray-800 rounded-xl p-3 pr-12 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 resize-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddNote}
                        disabled={!newNoteContent.trim() || savingNote}
                        className="absolute right-2.5 bottom-2.5 p-2 bg-cyan-500 text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {savingNote ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setActiveCase(null)}
                  className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveCase()}
                  disabled={saving}
                  className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl text-xs font-extrabold transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(0,224,240,0.3)] disabled:opacity-50"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  <span>{saving ? "Guardando..." : "Guardar Estado y Comisión"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
