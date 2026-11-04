"use client";

import { motion } from "framer-motion";
import {
  DollarSign, Clock, Landmark, TrendingUp, Users,
  FileText, Plus, ChevronRight
} from "lucide-react";
import { TaxCase } from "../../types";
import { TaxOfficeStats } from "./mock-tax-data";

interface TaxOfficeDashboardProps {
  stats: TaxOfficeStats;
  cases: TaxCase[];
  onNewCase: () => void;
  onNavigateTab: (tab: "dashboard" | "cases" | "invoices" | "commissions" | "templates") => void;
  onSelectCase: (c: TaxCase) => void;
}

export default function TaxOfficeDashboard({
  stats,
  cases,
  onNewCase,
  onNavigateTab,
  onSelectCase,
}: TaxOfficeDashboardProps) {
  const formatMoney = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  const kpis = [
    {
      title: "Total Recaudado",
      value: formatMoney(stats.totalCollected),
      subtitle: "Cobros de honorarios y deducciones",
      icon: DollarSign,
      color: "emerald",
      trend: "+28% vs 2024",
    },
    {
      title: "Por Cobrar / Pendiente",
      value: formatMoney(stats.outstandingBalance),
      subtitle: "Reembolsos pendientes de liberación",
      icon: Clock,
      color: "amber",
      trend: "18 casos en tránsito",
    },
    {
      title: "Adelantos Bancarios",
      value: formatMoney(stats.refundAdvances),
      subtitle: "SBTPG • Refund Advantage • Republic",
      icon: Landmark,
      color: "cyan",
      trend: "48 solicitudes procesadas",
    },
    {
      title: "Honorario Promedio",
      value: formatMoney(stats.averageFee),
      subtitle: "Por declaración preparada",
      icon: TrendingUp,
      color: "blue",
      trend: "184 facturas pagadas",
    },
  ];

  const pipelineStages = [
    { key: "new", label: "Nuevos Leads", count: stats.stageCounts.new, color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    { key: "docs_pending", label: "Docs Pendientes", count: stats.stageCounts.docs_pending, color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    { key: "in_review", label: "En Auditoría / Prep", count: stats.stageCounts.in_review, color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    { key: "ready_to_file", label: "Firmados / Listos", count: stats.stageCounts.ready_to_file, color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" },
    { key: "transmitted", label: "Transmitidos IRS", count: stats.stageCounts.transmitted, color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
    { key: "accepted", label: "Aceptados / Pagados", count: stats.stageCounts.accepted, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  ];

  const getStageBadge = (stage: TaxCase["stage"]) => {
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

  const getStageText = (stage: TaxCase["stage"]) => {
    switch (stage) {
      case "new":
        return "Nuevo Expediente";
      case "docs_pending":
        return "Docs Pendientes";
      case "in_review":
        return "En Revisión";
      case "ready_to_file":
        return "Listo para E-File";
      case "transmitted":
        return "Transmitido al IRS";
      case "accepted":
        return "Aceptado IRS";
      default:
        return stage;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Botones de Acción Rápida */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
        <div>
          <h2 className="text-lg font-black text-white">Panel de Control de Temporada</h2>
          <p className="text-xs text-gray-400">Año Fiscal Activo: <strong className="text-cyan-400">2025</strong> • Temporada 2026</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onNewCase}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,224,240,0.3)] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Nuevo Caso Fiscal</span>
          </button>

          <button
            onClick={() => onNavigateTab("invoices")}
            className="px-3.5 py-2.5 bg-[#05101F] hover:bg-gray-800 border border-gray-700 text-gray-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <DollarSign size={14} className="text-emerald-400" />
            <span>Facturación</span>
          </button>

          <button
            onClick={() => onNavigateTab("commissions")}
            className="px-3.5 py-2.5 bg-[#05101F] hover:bg-gray-800 border border-gray-700 text-gray-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Users size={14} className="text-amber-400" />
            <span>Comisiones</span>
          </button>

          <button
            onClick={() => onNavigateTab("templates")}
            className="px-3.5 py-2.5 bg-[#05101F] hover:bg-gray-800 border border-gray-700 text-gray-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FileText size={14} className="text-cyan-400" />
            <span>Plantillas IRS 7216</span>
          </button>
        </div>
      </div>

      {/* Grid de 4 KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-5 rounded-2xl bg-[#0A182D]/90 border border-gray-800 hover:border-gray-700 transition-all shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{kpi.title}</span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  kpi.color === "emerald" ? "bg-emerald-500/10 text-emerald-400" :
                  kpi.color === "cyan" ? "bg-cyan-500/10 text-cyan-400" :
                  kpi.color === "amber" ? "bg-amber-500/10 text-amber-400" :
                  "bg-blue-500/10 text-blue-400"
                }`}>
                  <Icon size={18} />
                </div>
              </div>

              <div className="mt-3">
                <p className="text-2xl font-black text-white tracking-tight">{kpi.value}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] text-gray-400 truncate">{kpi.subtitle}</span>
                  <span className="text-[10px] font-semibold text-emerald-400 shrink-0 ml-1">{kpi.trend}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pipeline de Casos (Workflow visual tipo LUXOFFICE) */}
      <div className="p-6 rounded-2xl bg-[#0A182D]/80 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
              Embudo de Casos Fiscales (Pipeline)
            </h3>
            <p className="text-xs text-gray-400">Total en proceso: <strong className="text-white">{stats.totalCasesCount} declaraciones</strong></p>
          </div>
          <button
            onClick={() => onNavigateTab("cases")}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Ver Todos los Casos</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {pipelineStages.map((stage) => (
            <div
              key={stage.key}
              onClick={() => onNavigateTab("cases")}
              className={`p-4 rounded-xl border ${stage.color} hover:scale-[1.02] transition-transform cursor-pointer flex flex-col justify-between`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider line-clamp-1">{stage.label}</span>
              <p className="text-2xl font-black mt-2">{stage.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Casos Recientes */}
      <div className="p-6 rounded-2xl bg-[#0A182D]/80 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-cyan-400 rounded-full" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
              Expedientes Recientes
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab("cases")}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Explorar Casos</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                <th className="pb-3 pl-2">Cliente</th>
                <th className="pb-3">Servicio Fiscal</th>
                <th className="pb-3">Año</th>
                <th className="pb-3">Honorario</th>
                <th className="pb-3">Producto Banco</th>
                <th className="pb-3">Estado</th>
                <th className="pb-3 text-right pr-2">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {cases.slice(0, 5).map((c) => (
                <tr key={c.id} className="hover:bg-gray-900/40 transition-colors group">
                  <td className="py-3 pl-2 font-bold text-white">
                    <div>{c.clientName}</div>
                    <div className="text-[10px] text-gray-500 font-normal">{c.clientPhone}</div>
                  </td>
                  <td className="py-3 text-gray-300 capitalize">
                    {c.serviceType.replace("_", " ")}
                  </td>
                  <td className="py-3 text-gray-300 font-mono">{c.taxYear}</td>
                  <td className="py-3 text-emerald-400 font-bold">{formatMoney(c.agreedFee)}</td>
                  <td className="py-3">
                    {c.bankProduct ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 uppercase">
                        {c.bankPartner}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-500 font-semibold">Directo</span>
                    )}
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStageBadge(c.stage)}`}>
                      {getStageText(c.stage)}
                    </span>
                  </td>
                  <td className="py-3 text-right pr-2">
                    <button
                      onClick={() => onSelectCase(c)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-cyan-400 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg transition-colors cursor-pointer"
                    >
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
