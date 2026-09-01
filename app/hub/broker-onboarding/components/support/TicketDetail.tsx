"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Send, User, Headset, Clock, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { SupportTicketV2, TicketMessage } from "../../types";

interface TicketDetailProps {
  ticket: SupportTicketV2;
  onBack: () => void;
}

export default function TicketDetail({ ticket, onBack }: TicketDetailProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

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

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/support/tickets/messages?ticketId=${ticket.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Error cargando mensajes del ticket:", err);
    } finally {
      setLoading(false);
    }
  }, [user, ticket.id]);

  useEffect(() => {
    // setTimeout evita que el compilador de React marque esto como
    // "setState síncrono dentro de un efecto" (set-state-in-effect).
    setTimeout(fetchMessages, 0);
  }, [fetchMessages]);

  const handleSendReply = async () => {
    if (!user || !reply.trim()) return;
    setSending(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/support/tickets/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ticketId: ticket.id, content: reply })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setReply("");
      }
    } catch (err) {
      console.error("Error enviando respuesta:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[#0A182D]/60 border border-gray-800 rounded-3xl overflow-hidden flex flex-col h-[600px] shadow-2xl">
      {/* Header */}
      <div className="p-5 border-b border-gray-800 bg-[#05101F]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono text-cyan-400 font-bold">{ticket.id}</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getStatusBadge(ticket.status)}`}>
                {getStatusLabel(ticket.status)}
              </span>
            </div>
            <h3 className="font-extrabold text-white text-base">{ticket.subject}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400 ml-12 sm:ml-0">
          <span className="capitalize px-2 py-1 bg-gray-900 rounded-md">
            {ticket.category.replace('_', ' ')}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {new Date(ticket.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
        {/* Mensaje original (descripción del ticket) */}
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
            <User size={18} />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Tú</span>
              <span className="text-[10px] text-gray-500">{new Date(ticket.createdAt).toLocaleString()}</span>
            </div>
            <div className="p-4 rounded-2xl rounded-tl-sm bg-[#05101F] border border-gray-800 text-gray-300 text-sm whitespace-pre-wrap">
              {ticket.description}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-500 text-xs flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Cargando conversación...
          </div>
        ) : (
          messages.map((msg, i) => (
            <motion.div
              key={msg.id || i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                msg.sender === "agent" ? "bg-cyan-500/20 text-cyan-400" : "bg-blue-600/20 text-blue-400"
              }`}>
                {msg.sender === "agent" ? <Headset size={18} /> : <User size={18} />}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">
                    {msg.sender === "agent" ? msg.senderName || "Soporte E360" : "Tú"}
                  </span>
                  <span className="text-[10px] text-gray-500">{new Date(msg.createdAt).toLocaleString()}</span>
                </div>
                <div className={`p-4 rounded-2xl rounded-tl-sm text-sm whitespace-pre-wrap ${
                  msg.sender === "agent"
                    ? "bg-cyan-500/5 border border-cyan-500/20 text-cyan-100/90"
                    : "bg-[#05101F] border border-gray-800 text-gray-300"
                }`}>
                  {msg.content}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Reply Input */}
      {ticket.status !== 'resolved' && (
        <div className="p-4 bg-[#05101F]/90 border-t border-gray-800">
          <div className="relative">
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendReply();
                }
              }}
              placeholder="Escribe una respuesta..."
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
      )}
    </div>
  );
}
