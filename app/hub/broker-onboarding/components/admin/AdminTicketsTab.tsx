"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Ticket,
  Send,
  X,
  Loader2,
  AlertCircle,
  Clock,
  User,
  Headset
} from "lucide-react";

export interface AdminTicketItem {
  id: string;
  brokerId: string;
  brokerName: string;
  subject: string;
  category: "ghl_crm" | "commission" | "underwriting" | "general";
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved";
  description: string;
  createdAt: string;
  updatedAt: string;
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

export default function AdminTicketsTab({ tickets, loading, onRefresh }: AdminTicketsTabProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
    return tickets.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
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
  }, [tickets, search, statusFilter]);

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

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-[#0A182D]/60 border border-gray-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
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
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((t) => (
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
                <span className="capitalize bg-gray-900 px-2 py-0.5 rounded-md text-gray-400">{t.category.replace('_', ' ')}</span>
                <div className="flex items-center gap-3">
                  <span className="text-cyan-400 font-bold">{t.brokerName}</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> {new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
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
            </div>

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
