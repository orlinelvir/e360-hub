"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  Ticket,
  Send,
  X,
  Loader2,
  AlertCircle,
  Clock,
  User,
  Headset,
  Paperclip,
  Star,
  ChevronDown,
  ChevronRight,
  Layers
} from "lucide-react";
import { getTicketCategoryLabel, getTicketCategoryDef, TICKET_CATEGORIES } from "@/lib/support/ticket-categories";
import {
  isResponseSlaBreached,
  wasResolvedWithinSla,
  formatDurationMs
} from "@/lib/support/ticket-sla";
import { TicketCategory } from "../../types";
import { useHubHeaderOffset } from "../../hooks/useHubHeaderOffset";

export interface AdminTicketItem {
  id: string;
  brokerId: string;
  brokerName: string;
  subject: string;
  category: TicketCategory;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved";
  description: string;
  createdAt: string;
  updatedAt: string;
  relatedClientId?: string;
  relatedClientName?: string;
  categoryFields?: Record<string, string>;
  attachmentUrl?: string;
  attachmentFileName?: string;
  // Seguimiento de SLA / métricas (ver lib/support/ticket-sla.ts)
  firstResponseAt?: string;
  resolvedAt?: string;
  escalated?: boolean;
  escalatedAt?: string;
  escalationReason?: string;
  // Encuesta de satisfacción del broker
  rating?: number;
  ratingComment?: string;
  ratedAt?: string;
}

interface TicketMessage {
  id?: string;
  sender: "broker" | "agent";
  senderName: string;
  content: string;
  createdAt: string;
}

interface AdminTicketsTabProps {
  tickets: AdminTicketItem[];
  loading: boolean;
  onRefresh: () => void;
}

type SortOption = "newest" | "oldest" | "sla_first" | "priority_first";
type GroupOption = "none" | "priority" | "category";

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

// Definido fuera de AdminTicketsTab para que no se recree en cada render
// (react-hooks/static-components) — mismo patrón que RowGroup en
// AdminCasesTab.tsx: encabezado de grupo sticky, apilado justo debajo de la
// barra de filtros (que a su vez está debajo del header del Hub).
function TicketGroup({
  label,
  count,
  items,
  collapsed,
  onToggle,
  top,
  renderCard
}: {
  label: string;
  count: number;
  items: AdminTicketItem[];
  collapsed: boolean;
  onToggle: () => void;
  top: number;
  renderCard: (t: AdminTicketItem) => React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div style={{ top }} className="sticky z-[15] -mx-1 px-1">
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-[#05101F] border border-gray-800 rounded-xl hover:bg-[#0A182D] transition-colors text-left"
        >
          {collapsed ? <ChevronRight size={14} className="text-gray-500 shrink-0" /> : <ChevronDown size={14} className="text-gray-500 shrink-0" />}
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-300">{label}</span>
          <span className="text-[10px] text-gray-500 font-mono">({count})</span>
        </button>
      </div>
      {!collapsed && <div className="space-y-3">{items.map((t) => renderCard(t))}</div>}
    </div>
  );
}

export default function AdminTicketsTab({ tickets, loading, onRefresh }: AdminTicketsTabProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  // "Por Prioridad"/"Por Categoría" — mismo patrón de agrupación colapsable
  // que "Agrupar por Estado" en AdminCasesTab.tsx.
  const [groupBy, setGroupBy] = useState<GroupOption>("none");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroupCollapsed = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // La barra de filtros (y, si hay agrupación activa, el encabezado de cada
  // grupo) son sticky, apilados justo debajo del header del Hub (igual que
  // en AdminCasesTab) — se miden en vivo en vez de usar px fijos.
  const headerOffset = useHubHeaderOffset();
  const filterBarRef = useRef<HTMLDivElement>(null);
  const [filterBarHeight, setFilterBarHeight] = useState<number>(0);

  useEffect(() => {
    if (!filterBarRef.current) return;
    const el = filterBarRef.current;
    const update = () => setFilterBarHeight(el.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const [activeTicket, setActiveTicket] = useState<AdminTicketItem | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "in_progress": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "resolved": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open": return "Abierto";
      case "in_progress": return "En Proceso";
      case "resolved": return "Resuelto";
      default: return status;
    }
  };

  const filteredTickets = useMemo(() => {
    const filtered = tickets.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          t.subject.toLowerCase().includes(q) ||
          t.brokerName.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "oldest":
          return a.createdAt.localeCompare(b.createdAt);
        case "priority_first":
          return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        case "sla_first": {
          const aOverdue = a.status !== "resolved" && isResponseSlaBreached(a);
          const bOverdue = b.status !== "resolved" && isResponseSlaBreached(b);
          if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
          return a.createdAt.localeCompare(b.createdAt);
        }
        case "newest":
        default:
          return b.createdAt.localeCompare(a.createdAt);
      }
    });
  }, [tickets, search, statusFilter, priorityFilter, categoryFilter, sortOption]);

  // Grupos por Prioridad o Categoría — se respeta el orden ya aplicado por
  // sortOption dentro de cada grupo, ya que parten de filteredTickets.
  const groupedTickets = useMemo(() => {
    if (groupBy === "none") return null;
    if (groupBy === "priority") {
      const order = ["high", "medium", "low"] as const;
      const groups = new Map<string, AdminTicketItem[]>();
      order.forEach((p) => groups.set(p, []));
      filteredTickets.forEach((t) => {
        if (!groups.has(t.priority)) groups.set(t.priority, []);
        groups.get(t.priority)!.push(t);
      });
      return Array.from(groups.entries()).filter(([, items]) => items.length > 0);
    }
    // category
    const groups = new Map<string, AdminTicketItem[]>();
    TICKET_CATEGORIES.forEach((c) => groups.set(c.id, []));
    filteredTickets.forEach((t) => {
      if (!groups.has(t.category)) groups.set(t.category, []);
      groups.get(t.category)!.push(t);
    });
    return Array.from(groups.entries()).filter(([, items]) => items.length > 0);
  }, [filteredTickets, groupBy]);

  const getGroupLabel = (key: string) => {
    if (groupBy === "priority") {
      return key === "high" ? "Prioridad Alta" : key === "medium" ? "Prioridad Media" : "Prioridad Baja";
    }
    return getTicketCategoryLabel(key);
  };

  // Métricas de soporte: SLA de respuesta, tiempos y satisfacción — la prueba
  // numérica de que el compromiso anunciado a la comunidad se está cumpliendo.
  const metrics = useMemo(() => {
    // Ojo con react-hooks/purity: nada de Date.now() directo en render —
    // isResponseSlaBreached calcula el "ahora" dentro de la librería.
    const open = tickets.filter((t) => t.status === "open").length;
    const inProgress = tickets.filter((t) => t.status === "in_progress").length;
    const resolved = tickets.filter((t) => t.status === "resolved").length;
    const escalated = tickets.filter((t) => t.escalated).length;

    const overdue = tickets.filter((t) => isResponseSlaBreached(t)).length;

    const responded = tickets.filter(
      (t) =>
        t.firstResponseAt &&
        !Number.isNaN(Date.parse(t.firstResponseAt)) &&
        !Number.isNaN(Date.parse(t.createdAt))
    );
    const avgFirstMs = responded.length
      ? responded.reduce(
          (acc, t) => acc + (Date.parse(t.firstResponseAt!) - Date.parse(t.createdAt)),
          0
        ) / responded.length
      : null;

    const withResolvedClock = tickets.filter((t) => t.resolvedAt);
    const withinSla = withResolvedClock.filter((t) => wasResolvedWithinSla(t));
    const pctSla = withResolvedClock.length
      ? Math.round((withinSla.length / withResolvedClock.length) * 100)
      : null;

    const rated = tickets.filter((t) => typeof t.rating === "number");
    const avgRating = rated.length
      ? rated.reduce((acc, t) => acc + (t.rating || 0), 0) / rated.length
      : null;

    return {
      open,
      inProgress,
      resolved,
      escalated,
      overdue,
      avgFirstMs,
      pctSla,
      resolvedWithClock: withResolvedClock.length,
      avgRating,
      ratedCount: rated.length
    };
  }, [tickets]);

  const openTicket = async (ticket: AdminTicketItem) => {
    setActiveTicket(ticket);
    setMessages([]);
    setLoadingThread(true);
    try {
      const res = await fetch(`/api/admin/tickets/messages?brokerId=${ticket.brokerId}&ticketId=${ticket.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Error cargando hilo del ticket:", err);
    } finally {
      setLoadingThread(false);
    }
  };

  const handleSendReply = async () => {
    if (!activeTicket || !reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/tickets/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brokerId: activeTicket.brokerId, ticketId: activeTicket.id, content: reply })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setReply("");
        onRefresh();
      }
    } catch (err) {
      console.error("Error enviando respuesta:", err);
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!activeTicket) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brokerId: activeTicket.brokerId, ticketId: activeTicket.id, status })
      });
      if (res.ok) {
        setActiveTicket({ ...activeTicket, status: status as AdminTicketItem["status"] });
        onRefresh();
      }
    } catch (err) {
      console.error("Error actualizando estado del ticket:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const renderTicketCard = (t: AdminTicketItem) => (
    <div
      key={`${t.brokerId}-${t.id}`}
      onClick={() => openTicket(t)}
      className="bg-[#05101F] hover:bg-[#0A182D] border border-gray-800/80 hover:border-cyan-500/40 rounded-2xl p-4 cursor-pointer transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono text-cyan-400 font-bold">{t.id}</span>
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getStatusBadge(t.status)}`}>
          {getStatusLabel(t.status)}
        </span>
      </div>
      <h4 className="text-sm font-bold text-white mb-1">{t.subject}</h4>
      <p className="text-xs text-gray-400 line-clamp-1 mb-3">{t.description}</p>
      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-3 border-t border-gray-900">
        <span className="bg-gray-900 px-2 py-0.5 rounded-md text-gray-400">{getTicketCategoryLabel(t.category)}</span>
        <div className="flex items-center gap-3">
          {typeof t.rating === "number" && (
            <span className="flex items-center gap-0.5 text-amber-400 font-bold" title={`Calificación del broker: ${t.rating}/5`}>
              <Star size={10} className="fill-amber-400" /> {t.rating}
            </span>
          )}
          {t.escalated && <span className="text-purple-400 font-bold">Escalado</span>}
          {t.status !== "resolved" && isResponseSlaBreached(t) && (
            <span className="text-red-400 font-bold">SLA vencido</span>
          )}
          {t.relatedClientName && <span className="text-cyan-400 font-bold">{t.relatedClientName}</span>}
          <span className="text-gray-400 font-bold">{t.brokerName}</span>
          <span className="flex items-center gap-1"><Clock size={10} /> {new Date(t.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Métricas de soporte (SLA, tiempos, satisfacción) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0A182D]/60 border border-gray-800 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Abiertos</p>
          <p className="text-2xl font-extrabold mt-1 text-blue-400">{metrics.open}</p>
        </div>
        <div className="bg-[#0A182D]/60 border border-gray-800 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">En proceso</p>
          <p className="text-2xl font-extrabold mt-1 text-amber-400">{metrics.inProgress}</p>
        </div>
        <div className="bg-[#0A182D]/60 border border-gray-800 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Resueltos</p>
          <p className="text-2xl font-extrabold mt-1 text-emerald-400">{metrics.resolved}</p>
        </div>
        <div className="bg-[#0A182D]/60 border border-gray-800 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">SLA vencidos</p>
          <p className={`text-2xl font-extrabold mt-1 ${metrics.overdue > 0 ? "text-red-400" : "text-gray-500"}`}>
            {metrics.overdue}
          </p>
          <p className="text-[10px] text-gray-600 mt-0.5">sin primera respuesta</p>
        </div>
        <div className="bg-[#0A182D]/60 border border-gray-800 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Escalados</p>
          <p className={`text-2xl font-extrabold mt-1 ${metrics.escalated > 0 ? "text-purple-400" : "text-gray-500"}`}>
            {metrics.escalated}
          </p>
        </div>
        <div className="bg-[#0A182D]/60 border border-gray-800 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">1ª respuesta prom.</p>
          <p className="text-2xl font-extrabold mt-1 text-cyan-400">
            {metrics.avgFirstMs !== null ? formatDurationMs(metrics.avgFirstMs) : "—"}
          </p>
        </div>
        <div className="bg-[#0A182D]/60 border border-gray-800 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">SLA cumplido</p>
          <p className={`text-2xl font-extrabold mt-1 ${metrics.pctSla !== null && metrics.pctSla < 80 ? "text-red-400" : "text-emerald-400"}`}>
            {metrics.pctSla !== null ? `${metrics.pctSla}%` : "—"}
          </p>
          <p className="text-[10px] text-gray-600 mt-0.5">de {metrics.resolvedWithClock} resueltos</p>
        </div>
        <div className="bg-[#0A182D]/60 border border-gray-800 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Satisfacción</p>
          <p className="text-2xl font-extrabold mt-1 text-amber-400 flex items-baseline gap-1">
            {metrics.avgRating !== null ? metrics.avgRating.toFixed(1) : "—"}
            {metrics.avgRating !== null && <Star size={14} className="fill-amber-400 text-amber-400 self-center" />}
          </p>
          <p className="text-[10px] text-gray-600 mt-0.5">{metrics.ratedCount} calificado{metrics.ratedCount === 1 ? "" : "s"}</p>
        </div>
      </div>

      {/* Filtros — sticky justo debajo del header del Hub, igual que en el
          Master Feed de Casos, para que no se pierdan al bajar por la lista. */}
      <div
        ref={filterBarRef}
        style={{ top: headerOffset }}
        className="sticky z-30 bg-[#0B1C33] border border-gray-800 rounded-2xl p-4 space-y-3 shadow-lg shadow-black/20"
      >
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <div className="relative flex-grow min-w-[180px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por asunto, broker o ID..."
            className="w-full bg-[#05101F] border border-gray-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#05101F] border border-gray-800 rounded-xl py-2 px-3 text-xs text-gray-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="all">Todos los estados</option>
          <option value="open">Abiertos</option>
          <option value="in_progress">En Proceso</option>
          <option value="resolved">Resueltos</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="bg-[#05101F] border border-gray-800 rounded-xl py-2 px-3 text-xs text-gray-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="all">Toda prioridad</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-[#05101F] border border-gray-800 rounded-xl py-2 px-3 text-xs text-gray-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="all">Toda categoría</option>
          {TICKET_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as SortOption)}
          className="bg-[#05101F] border border-gray-800 rounded-xl py-2 px-3 text-xs text-gray-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="newest">Más recientes primero</option>
          <option value="oldest">Más antiguos primero</option>
          <option value="sla_first">SLA vencido primero</option>
          <option value="priority_first">Prioridad alta primero</option>
        </select>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-gray-800/60">
          <Layers size={13} className="text-gray-500" />
          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Agrupar por:</span>
          <button
            type="button"
            onClick={() => setGroupBy("none")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
              groupBy === "none" ? "bg-cyan-500 text-black" : "bg-[#05101F] text-gray-400 hover:text-white border border-gray-800"
            }`}
          >
            Sin agrupar
          </button>
          <button
            type="button"
            onClick={() => setGroupBy("priority")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
              groupBy === "priority" ? "bg-cyan-500 text-black" : "bg-[#05101F] text-gray-400 hover:text-white border border-gray-800"
            }`}
          >
            Prioridad
          </button>
          <button
            type="button"
            onClick={() => setGroupBy("category")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
              groupBy === "category" ? "bg-cyan-500 text-black" : "bg-[#05101F] text-gray-400 hover:text-white border border-gray-800"
            }`}
          >
            Categoría
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm flex items-center justify-center gap-3">
          <Loader2 size={18} className="animate-spin text-cyan-400" />
          <span>Cargando tickets de brokers...</span>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="py-16 text-center text-gray-500 bg-[#0A182D]/40 border border-gray-800 rounded-2xl">
          <Ticket size={32} className="mx-auto text-gray-600 mb-3" />
          No hay tickets con los filtros seleccionados.
        </div>
      ) : groupedTickets ? (
        <div className="space-y-5">
          {groupedTickets.map(([key, items]) => (
            <TicketGroup
              key={key}
              label={getGroupLabel(key)}
              count={items.length}
              items={items}
              collapsed={collapsedGroups.has(key)}
              onToggle={() => toggleGroupCollapsed(key)}
              top={headerOffset + filterBarHeight}
              renderCard={renderTicketCard}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((t) => renderTicketCard(t))}
        </div>
      )}

      {/* Modal de hilo / respuesta */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0A182D] border border-cyan-500/40 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-800 bg-[#05101F]/80 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">{activeTicket.id}</span>
                  <span className="text-[10px] font-bold text-cyan-300">{activeTicket.brokerName}</span>
                </div>
                <h3 className="font-extrabold text-white text-base">{activeTicket.subject}</h3>
              </div>
              <button
                onClick={() => setActiveTicket(null)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 border-b border-gray-800 bg-[#05101F]/50 flex items-center gap-2">
              <span className="text-[10px] text-gray-400 uppercase font-bold mr-1">Estado:</span>
              {(["open", "in_progress", "resolved"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => handleUpdateStatus(s)}
                  disabled={updatingStatus}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase border transition-colors disabled:opacity-50 ${
                    activeTicket.status === s
                      ? getStatusBadge(s)
                      : "bg-transparent border-gray-800 text-gray-500 hover:text-white"
                  }`}
                >
                  {getStatusLabel(s)}
                </button>
              ))}
              {typeof activeTicket.rating === "number" && (
                <span className="ml-auto flex items-center gap-1 text-[11px] font-bold text-amber-400" title="Calificación del broker">
                  <Star size={12} className="fill-amber-400" /> {activeTicket.rating}/5
                </span>
              )}
            </div>

            {activeTicket.escalated && activeTicket.escalationReason && (
              <div className="px-3 py-2 bg-purple-500/10 border-b border-purple-500/20 text-[11px] text-purple-300">
                <span className="font-bold">Escalado automáticamente:</span> {activeTicket.escalationReason}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                  <User size={16} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">{activeTicket.brokerName}</span>
                    <span className="text-[10px] text-gray-500">{new Date(activeTicket.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl rounded-tl-sm bg-[#05101F] border border-gray-800 text-gray-300 text-sm whitespace-pre-wrap">
                    {activeTicket.description}
                  </div>
                  {activeTicket.categoryFields && Object.keys(activeTicket.categoryFields).length > 0 && (
                    <div className="text-xs text-gray-400 space-y-0.5 pl-1">
                      {Object.entries(activeTicket.categoryFields).map(([key, value]) => (
                        <p key={key}>
                          <span className="font-bold text-gray-300">{getTicketCategoryDef(activeTicket.category)?.extraField?.label || key}:</span> {value}
                        </p>
                      ))}
                    </div>
                  )}
                  {activeTicket.attachmentUrl && (
                    <a
                      href={activeTicket.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Paperclip size={14} />
                      {activeTicket.attachmentFileName || "Ver adjunto"}
                    </a>
                  )}
                </div>
              </div>

              {loadingThread ? (
                <div className="py-6 text-center text-gray-500 text-xs flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Cargando conversación...
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={msg.id || i} className="flex gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      msg.sender === "agent" ? "bg-cyan-500/20 text-cyan-400" : "bg-blue-600/20 text-blue-400"
                    }`}>
                      {msg.sender === "agent" ? <Headset size={16} /> : <User size={16} />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">
                          {msg.sender === "agent" ? msg.senderName || "Soporte E360" : activeTicket.brokerName}
                        </span>
                        <span className="text-[10px] text-gray-500">{new Date(msg.createdAt).toLocaleString()}</span>
                      </div>
                      <div className={`p-3.5 rounded-2xl rounded-tl-sm text-sm whitespace-pre-wrap ${
                        msg.sender === "agent"
                          ? "bg-cyan-500/5 border border-cyan-500/20 text-cyan-100/90"
                          : "bg-[#05101F] border border-gray-800 text-gray-300"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {activeTicket.status !== "resolved" ? (
              <div className="p-4 bg-[#05101F]/90 border-t border-gray-800">
                <div className="relative">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Responder como Soporte E360..."
                    rows={2}
                    disabled={sending}
                    className="w-full bg-[#0A182D] border border-gray-800 rounded-xl py-3 pl-4 pr-14 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 resize-none disabled:opacity-60"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!reply.trim() || sending}
                    className="absolute right-3 bottom-3 p-2 bg-cyan-500 text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[#05101F]/90 border-t border-gray-800 flex items-center gap-2 text-xs text-gray-500">
                <AlertCircle size={14} /> Este ticket está resuelto. Cambia el estado para reabrir la conversación.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
