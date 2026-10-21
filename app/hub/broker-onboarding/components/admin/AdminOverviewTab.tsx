"use client";

import { AlertTriangle, Clock, PlugZap, FilePlus2, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { CaseItem } from "./AdminCasesTab";
import { AdminTicketItem } from "./AdminTicketsTab";
import { FailedLeadItem } from "./AdminFailedSyncTab";
import { BacklogByCluster } from "./AdminStaffActivityTab";
import { isResponseSlaBreached } from "@/lib/support/ticket-sla";

interface AdminOverviewTabProps {
  cases: CaseItem[];
  tickets: AdminTicketItem[];
  failedLeads: FailedLeadItem[];
  backlogByCluster: BacklogByCluster;
  isFullAdmin: boolean;
  isSupport: boolean;
  loading: boolean;
  onOpenCase: (brokerId: string, clientId: string) => void;
  onGoToTab: (tab: "cases" | "tickets" | "failed_sync") => void;
}

type AttentionItem = {
  key: string;
  label: string;
  badge: string;
  badgeClass: string;
  onClick: () => void;
};

export default function AdminOverviewTab({
  cases,
  tickets,
  failedLeads,
  backlogByCluster,
  isFullAdmin,
  isSupport,
  loading,
  onOpenCase,
  onGoToTab
}: AdminOverviewTabProps) {
  const today = new Date().toISOString().split("T")[0];
  const newToday = cases.filter((c) => (c.createdAt || "").startsWith(today)).length;

  // Casos atrasados viene de /api/admin/staff-activity, que es admin-only —
  // para cualquier otro rol backlogByCluster llega vacío, así que esta
  // tarjeta/lista simplemente no aparece (ver isFullAdmin abajo).
  const staleCases = Object.values(backlogByCluster).flatMap((c) => c.staleCases);
  const slaBreachedTickets = tickets.filter((t) => t.status !== "resolved" && isResponseSlaBreached(t));

  const attentionItems: AttentionItem[] = [
    ...(isFullAdmin
      ? staleCases.map((c): AttentionItem => ({
          key: `stale-${c.brokerId}-${c.clientId}`,
          label: c.name,
          badge: `${c.ageDays}d sin actividad`,
          badgeClass: "text-amber-400 bg-amber-500/10",
          onClick: () => onOpenCase(c.brokerId, c.clientId)
        }))
      : []),
    ...(isFullAdmin || isSupport
      ? slaBreachedTickets.map((t): AttentionItem => ({
          key: `ticket-${t.brokerId}-${t.id}`,
          label: `Ticket ${t.id} — ${t.subject}`,
          badge: "SLA vencido",
          badgeClass: "text-red-400 bg-red-500/10",
          onClick: () => onGoToTab("tickets")
        }))
      : []),
    ...(isFullAdmin || isSupport
      ? failedLeads.map((l): AttentionItem => ({
          key: `sync-${l.brokerId}-${l.id}`,
          label: `${l.name} — ${l.serviceName}`,
          badge: "sync fallido",
          badgeClass: "text-red-400 bg-red-500/10",
          onClick: () => onGoToTab("failed_sync")
        }))
      : [])
  ].slice(0, 8);

  if (loading) {
    return (
      <div className="py-16 text-center text-gray-400 text-sm flex items-center justify-center gap-3">
        <Loader2 size={18} className="animate-spin text-cyan-400" />
        <span>Cargando resumen...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isFullAdmin ? "lg:grid-cols-4" : "lg:grid-cols-2"} gap-4`}>
        {isFullAdmin && (
          <div className="bg-[#0A182D]/70 border border-red-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle size={13} className="text-red-400" />
              <span className="text-[9.5px] font-bold text-red-400 uppercase tracking-wider">SLA vencido</span>
            </div>
            <p className="text-2xl font-extrabold text-white">{slaBreachedTickets.length}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">tickets sin primera respuesta</p>
          </div>
        )}
        {!isFullAdmin && isSupport && (
          <div className="bg-[#0A182D]/70 border border-red-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle size={13} className="text-red-400" />
              <span className="text-[9.5px] font-bold text-red-400 uppercase tracking-wider">SLA vencido</span>
            </div>
            <p className="text-2xl font-extrabold text-white">{slaBreachedTickets.length}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">tickets sin primera respuesta</p>
          </div>
        )}

        {isFullAdmin && (
          <div className="bg-[#0A182D]/70 border border-amber-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock size={13} className="text-amber-400" />
              <span className="text-[9.5px] font-bold text-amber-400 uppercase tracking-wider">Casos atrasados</span>
            </div>
            <p className="text-2xl font-extrabold text-white">{staleCases.length}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">+72h sin actividad</p>
          </div>
        )}

        {(isFullAdmin || isSupport) && (
          <div className="bg-[#0A182D]/70 border border-red-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <PlugZap size={13} className="text-red-400" />
              <span className="text-[9.5px] font-bold text-red-400 uppercase tracking-wider">Syncs fallidos</span>
            </div>
            <p className="text-2xl font-extrabold text-white">{failedLeads.length}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">sin sincronizar a GHL</p>
          </div>
        )}

        <div className="bg-[#0A182D]/70 border border-cyan-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <FilePlus2 size={13} className="text-cyan-400" />
            <span className="text-[9.5px] font-bold text-cyan-400 uppercase tracking-wider">Casos nuevos hoy</span>
          </div>
          <p className="text-2xl font-extrabold text-white">{newToday}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">en tu vista actual</p>
        </div>
      </div>

      <div className="bg-[#0A182D]/50 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Requiere atención ahora</span>
        </div>
        {attentionItems.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            Todo al día — no hay nada urgente ahora mismo.
          </div>
        ) : (
          <div className="divide-y divide-gray-800/60">
            {attentionItems.map((item) => (
              <button
                key={item.key}
                onClick={item.onClick}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#05101F]/60 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`shrink-0 text-[9.5px] font-bold uppercase px-2 py-0.5 rounded-full ${item.badgeClass}`}>
                    {item.badge}
                  </span>
                  <span className="text-xs text-gray-200 truncate">{item.label}</span>
                </div>
                <ArrowRight size={14} className="text-cyan-400 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
