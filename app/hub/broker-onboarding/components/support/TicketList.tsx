"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter, MessageSquare, AlertCircle } from "lucide-react";
import { SupportTicketV2 } from "../../types";
import { useAuth } from "@/components/AuthProvider";

interface TicketListProps {
  onSelectTicket: (ticket: SupportTicketV2) => void;
  onNewTicket: () => void;
}

export default function TicketList({ onSelectTicket, onNewTicket }: TicketListProps) {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicketV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) return;
    const fetchTickets = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/support/tickets", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTickets(data.tickets || []);
        }
      } catch (err) {
        console.error("Error fetching tickets:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [user]);

  const filteredTickets = tickets.filter(t => {
    const matchSearch = t.subject.toLowerCase().includes(search.toLowerCase()) || 
                        t.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar ticket..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#05101F] border border-gray-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#05101F] border border-gray-800 rounded-xl py-2 px-3 text-xs text-gray-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Todos los estados</option>
            <option value="open">Abiertos</option>
            <option value="in_progress">En Proceso</option>
            <option value="resolved">Resueltos</option>
          </select>
        </div>
        
        <button
          onClick={onNewTicket}
          className="w-full sm:w-auto px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Nuevo Ticket
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400 text-sm">Cargando tickets...</div>
      ) : filteredTickets.length === 0 ? (
        <div className="py-16 bg-[#0A182D]/40 border border-gray-800/80 rounded-2xl text-center">
          <AlertCircle size={32} className="mx-auto text-gray-500 mb-3" />
          <h3 className="text-sm font-bold text-gray-300">No hay tickets</h3>
          <p className="text-xs text-gray-500 mt-1">Crea un nuevo ticket para contactar a soporte.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map(ticket => (
            <motion.div
              key={ticket.id}
              whileHover={{ y: -2 }}
              onClick={() => onSelectTicket(ticket)}
              className="bg-[#05101F] hover:bg-[#0A182D] border border-gray-800/80 hover:border-cyan-500/40 rounded-2xl p-4 cursor-pointer transition-all shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-cyan-400 font-bold">{ticket.id}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getStatusBadge(ticket.status)}`}>
                  {getStatusLabel(ticket.status)}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mb-1">{ticket.subject}</h4>
              <p className="text-xs text-gray-400 line-clamp-1 mb-3">{ticket.description}</p>
              
              <div className="flex items-center justify-between text-[10px] text-gray-500 pt-3 border-t border-gray-900">
                <span className="capitalize bg-gray-900 px-2 py-0.5 rounded-md text-gray-400">
                  {ticket.category.replace('_', ' ')}
                </span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><MessageSquare size={10} /> 1</span>
                  <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
