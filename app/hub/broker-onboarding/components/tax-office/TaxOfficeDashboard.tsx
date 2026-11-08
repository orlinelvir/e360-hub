"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, Clock, Landmark, TrendingUp, Users, CheckCircle2,
  FileText, Plus, ChevronRight, ListChecks, CalendarClock, UserPlus, AlertTriangle
} from "lucide-react";
import { TaxCase, TaxClient, TaxLead, TaxTask, TaxAppointment, TaxCommissionItem, TaxInvoice } from "../../types";
import { TaxOfficeStats } from "./mock-tax-data";

type TaxOfficeSubTab = "dashboard" | "cases" | "clients" | "workflow" | "tasks" | "appointments" | "invoices" | "commissions" | "templates" | "automations";

type DateRangeOption = "today" | "7d" | "30d" | "90d" | "ytd" | "all";

interface TaxOfficeDashboardProps {
  stats: TaxOfficeStats;
  cases: TaxCase[];
  invoices: TaxInvoice[];
  clients: TaxClient[];
  leads: TaxLead[];
  tasks: TaxTask[];
  appointments: TaxAppointment[];
  commissions: TaxCommissionItem[];
  onNewCase: () => void;
  onNavigateTab: (tab: TaxOfficeSubTab) => void;
  onSelectCase: (c: TaxCase) => void;
}

const DATE_RANGE_OPTIONS: { id: DateRangeOption; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "ytd", label: "Year to date" },
  { id: "all", label: "Custom" },
];

function withinRange(dateStr: string, range: DateRangeOption, custom?: { from: string; to: string }): boolean {
  if (range === "all") {
    if (!custom || (!custom.from && !custom.to)) return true;
    const time = new Date(dateStr).getTime();
    if (custom.from && time < new Date(custom.from).getTime()) return false;
    if (custom.to && time > new Date(custom.to).getTime() + 86400000 - 1) return false;
    return true;
  }
  const date = new Date(dateStr);
  const now = new Date();
  if (range === "today") return date.toDateString() === now.toDateString();
  if (range === "ytd") return date.getFullYear() === now.getFullYear();
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return now.getTime() - date.getTime() <= days * 86400000;
}

export default function TaxOfficeDashboard({
  stats,
  cases,
  invoices,
  clients,
  leads,
  tasks,
  appointments,
  commissions,
  onNewCase,
  onNavigateTab,
  onSelectCase,
}: TaxOfficeDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRangeOption>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const customBounds = useMemo(() => ({ from: customFrom, to: customTo }), [customFrom, customTo]);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  const casesInRange = useMemo(() => cases.filter((c) => withinRange(c.createdAt, dateRange, customBounds)), [cases, dateRange, customBounds]);
  const leadsInRange = useMemo(() => leads.filter((l) => withinRange(l.createdAt, dateRange, customBounds)), [leads, dateRange, customBounds]);
  const invoicesInRange = useMemo(() => invoices.filter((i) => withinRange(i.createdAt, dateRange, customBounds)), [invoices, dateRange, customBounds]);

  // Los 5 KPIs de ingreso se recalculan sobre el período seleccionado — antes
  // el selector de fechas solo afectaba "New Leads" y una etiqueta suelta,
  // mientras estos 5 números (los más visibles del dashboard) seguían
  // mostrando siempre el total histórico sin importar qué rango se eligiera.
  const totalCollectedInRange = invoicesInRange.filter((i) => i.status === "paid").reduce((acc, i) => acc + i.amount, 0);
  const outstandingInRange = invoicesInRange
    .filter((i) => i.status === "sent" || (i.status as string) === "pending")
    .reduce((acc, i) => acc + i.amount, 0);
  const refundedInRange = casesInRange.filter((c) => c.refundAdvanceRequested).reduce((acc, c) => acc + (c.estimatedRefund || 0), 0);
  const paidInvoicesCountInRange = invoicesInRange.filter((i) => i.status === "paid").length;
  const totalFeesInRange = casesInRange.reduce((acc, c) => acc + c.agreedFee, 0);
  const averageFeeInRange = casesInRange.length > 0 ? Math.round(totalFeesInRange / casesInRange.length) : 0;

  const kpis = [
    {
      title: "Total Collected",
      value: formatMoney(totalCollectedInRange),
      subtitle: "Cobros de honorarios y deducciones",
      icon: DollarSign,
      color: "emerald",
    },
    {
      title: "Outstanding",
      value: formatMoney(outstandingInRange),
      subtitle: "Facturas enviadas, sin cobrar",
      icon: Clock,
      color: "amber",
    },
    {
      title: "Refunded",
      value: formatMoney(refundedInRange),
      subtitle: "SBTPG • Refund Advantage • Republic",
      icon: Landmark,
      color: "cyan",
    },
    {
      title: "Paid Invoices",
      value: String(paidInvoicesCountInRange),
      subtitle: "Facturas liquidadas",
      icon: CheckCircle2,
      color: "blue",
    },
    {
      title: "Average Payment",
      value: formatMoney(averageFeeInRange),
      subtitle: "Por declaración preparada",
      icon: TrendingUp,
      color: "purple",
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
      case "rejected":
        return "bg-red-500/10 text-red-400 border-red-500/20";
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
      case "rejected":
        return "Rechazado IRS";
      default:
        return stage;
    }
  };

  // --- Leads & clients ---
  const openLeads = leads.length;
  const pipelineValue = leads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);
  const newLeadsInRange = leadsInRange.length;
  const activeClientsCount = clients.filter((c) => c.status === "active").length;

  // --- Tasks due / Today ---
  const today = new Date().toDateString();
  const tasksDue = tasks.filter((t) => t.status !== "completed" && t.dueDate && new Date(t.dueDate) <= new Date());
  const todaysAppointments = appointments.filter((a) => new Date(a.dateTime).toDateString() === today);

  // --- Collaborator commissions ---
  const totalCommissionsOwed = commissions.filter((c) => c.status === "pending").reduce((acc, c) => acc + c.netCommission, 0);

  // --- Cases by preparer ---
  const casesByPreparer = useMemo(() => {
    const map: Record<string, number> = {};
    cases.forEach((c) => {
      const name = c.assignedPreparer || "Sin asignar";
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [cases]);

  // --- Upcoming deadlines ---
  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    return cases
      .filter((c) => c.deadline && new Date(c.deadline) >= now)
      .sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""))
      .slice(0, 5);
  }, [cases]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Botones de Acción Rápida + Filtro de Fecha */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
        <div>
          <h2 className="text-lg font-black text-white">Case Pipeline</h2>
          <p className="text-xs text-gray-400">Every active matter across your office, in one view.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#05101F] border border-gray-800 overflow-x-auto">
            {DATE_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setDateRange(opt.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  dateRange === opt.id ? "bg-cyan-500/20 text-cyan-300" : "text-gray-400 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {dateRange === "all" && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-2 py-1.5 rounded-lg text-[10px] font-semibold bg-[#05101F] border border-gray-800 text-gray-200 cursor-pointer"
              />
              <span className="text-[10px] text-gray-500">a</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-2 py-1.5 rounded-lg text-[10px] font-semibold bg-[#05101F] border border-gray-800 text-gray-200 cursor-pointer"
              />
            </div>
          )}
        </div>
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
          <span>Forms &amp; Contracts</span>
        </button>
      </div>

      {/* Grid de 5 KPIs de Ingreso */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    kpi.color === "emerald"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : kpi.color === "cyan"
                      ? "bg-cyan-500/10 text-cyan-400"
                      : kpi.color === "amber"
                      ? "bg-amber-500/10 text-amber-400"
                      : kpi.color === "purple"
                      ? "bg-purple-500/10 text-purple-400"
                      : "bg-blue-500/10 text-blue-400"
                  }`}
                >
                  <Icon size={18} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-black text-white tracking-tight">{kpi.value}</p>
                <span className="text-[11px] text-gray-400 truncate block mt-1">{kpi.subtitle}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Comisiones de colaboradores */}
      <div className="p-5 rounded-2xl bg-[#0A182D]/80 border border-gray-800 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">Collaborator commissions</h3>
            <p className="text-[11px] text-gray-400">{commissions.length === 0 ? "No commissions in this period." : `${commissions.length} preparadores con comisiones activas`}</p>
          </div>
        </div>
        {commissions.length > 0 && (
          <div className="text-right">
            <p className="text-lg font-black text-amber-400">{formatMoney(totalCommissionsOwed)}</p>
            <button onClick={() => onNavigateTab("commissions")} className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer">
              Ver detalle →
            </button>
          </div>
        )}
      </div>

      {/* Leads & clients */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">Leads &amp; clients</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Open Leads", value: String(openLeads), icon: UserPlus, onClick: () => onNavigateTab("workflow") },
            { label: "Pipeline Value", value: formatMoney(pipelineValue), icon: TrendingUp, onClick: () => onNavigateTab("workflow") },
            { label: "New Leads", value: String(newLeadsInRange), icon: UserPlus, onClick: () => onNavigateTab("workflow") },
            { label: "Active Clients", value: String(activeClientsCount), icon: Users, onClick: () => onNavigateTab("clients") },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                onClick={card.onClick}
                className="p-4 rounded-xl bg-[#0A182D]/80 border border-gray-800 hover:border-cyan-500/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-gray-500">{card.label}</span>
                  <Icon size={14} className="text-cyan-400" />
                </div>
                <p className="text-xl font-black text-white mt-1.5">{card.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tasks due + Today + Upcoming deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-1.5">
              <ListChecks size={14} className="text-cyan-400" />
              Tasks due
            </h3>
            <button onClick={() => onNavigateTab("tasks")} className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer">
              Ver todas
            </button>
          </div>
          {tasksDue.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No tasks due.</p>
          ) : (
            <ul className="space-y-1.5">
              {tasksDue.slice(0, 4).map((t) => (
                <li key={t.id} className="text-xs text-gray-300 truncate">
                  • {t.title}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-5 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-1.5">
              <CalendarClock size={14} className="text-cyan-400" />
              Today
            </h3>
            <button onClick={() => onNavigateTab("appointments")} className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer">
              Ver agenda
            </button>
          </div>
          {todaysAppointments.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No appointments today.</p>
          ) : (
            <ul className="space-y-1.5">
              {todaysAppointments.map((a) => (
                <li key={a.id} className="text-xs text-gray-300 truncate">
                  • {new Date(a.dateTime).toLocaleTimeString("es-US", { hour: "2-digit", minute: "2-digit" })} — {a.title}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-5 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-1.5 mb-2">
            <AlertTriangle size={14} className="text-amber-400" />
            Upcoming deadlines
          </h3>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No deadlines set.</p>
          ) : (
            <ul className="space-y-1.5">
              {upcomingDeadlines.map((c) => (
                <li key={c.id} className="text-xs text-gray-300 flex items-center justify-between">
                  <span className="truncate">{c.clientName}</span>
                  <span className="font-mono text-amber-400 shrink-0 ml-2">{c.deadline}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Cases by preparer */}
      {casesByPreparer.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-white mb-3">Cases by preparer</h3>
          <div className="space-y-2">
            {casesByPreparer.map(([name, count]) => (
              <div key={name} className="flex items-center gap-3">
                <span className="text-xs text-gray-300 w-32 truncate">{name}</span>
                <div className="flex-1 h-2 rounded-full bg-gray-900 overflow-hidden">
                  <div className="h-full bg-cyan-500" style={{ width: `${(count / cases.length) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-white w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline de Casos (Workflow visual tipo LUXOFFICE) */}
      <div className="p-6 rounded-2xl bg-[#0A182D]/80 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
              Embudo de Casos Fiscales (Pipeline)
            </h3>
            <p className="text-xs text-gray-400">Total en proceso: <strong className="text-white">{stats.totalCasesCount} declaraciones</strong> • {casesInRange.length} en el período seleccionado</p>
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
              Recent activity
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
          {cases.length === 0 ? (
            <p className="text-xs text-gray-500 italic py-4 text-center">No cases yet. Create your first case to get started.</p>
          ) : (
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
                    <td className="py-3 text-gray-300 capitalize">{c.serviceType.replace("_", " ")}</td>
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
                      <span className={`inline-flex text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStageBadge(c.stage)}`}>{getStageText(c.stage)}</span>
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
          )}
        </div>
      </div>
    </div>
  );
}
