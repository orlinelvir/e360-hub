"use client";

import { useState } from "react";
import { Headphones, Ticket, Sparkles, Phone, MessageSquare } from "lucide-react";

import AIChatWidget from "./support/AIChatWidget";
import TicketList from "./support/TicketList";
import TicketDetail from "./support/TicketDetail";
import FAQSection from "./support/FAQSection";
import DepartmentCards from "./support/DepartmentCards";
import EscalationModal from "./support/EscalationModal";
import { SupportTicketV2 } from "../types";

type SupportTab = "ai" | "tickets" | "faq" | "contact";

interface SoporteSectionProps {
  brokerName: string;
}

export default function SoporteSection({ brokerName }: SoporteSectionProps) {
  const [activeTab, setActiveTab] = useState<SupportTab>("ai");
  
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketV2 | null>(null);

  // Escalation Modal State
  const [isEscalationOpen, setIsEscalationOpen] = useState(false);
  const [escalationContext, setEscalationContext] = useState("");
  const [escalationConversationId, setEscalationConversationId] = useState<string | null>(null);

  const handleEscalate = (context: string, conversationId: string | null) => {
    setEscalationContext(context);
    setEscalationConversationId(conversationId);
    setIsEscalationOpen(true);
  };

  const handleEscalationSuccess = (ticket: SupportTicketV2) => {
    setIsEscalationOpen(false);
    setSelectedTicket(ticket);
    setActiveTab("tickets");
  };

  const handleOpenTicket = (category: string) => {
    // This could optionally open a "New Ticket" modal pre-filled with the category
    // For now, we'll just switch to the tickets tab where they can create it
    setActiveTab("tickets");
  };

  return (
    <div className="space-y-8">
      
      {/* BANNER PRINCIPAL VIP */}
      <div className="bg-gradient-to-r from-[#0A182D] via-[#102747] to-[#0A182D] border border-cyan-500/30 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 border border-cyan-400/40 rounded-2xl flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_25px_rgba(0,224,240,0.2)]">
              <Headphones size={32} />
            </div>
            <div>
              <span className="inline-block px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest mb-1">
                Centro de Atención Exclusivo
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                Soporte & Asistencia
              </h2>
              <p className="text-xs text-gray-400 mt-1 max-w-xl leading-relaxed">
                Resolución rápida mediante nuestra IA, o conexión directa con especialistas para casos complejos.
              </p>
            </div>
          </div>
          
          <div className="flex w-full lg:w-auto">
            <a
              href="https://wa.me/12013652055"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              <MessageSquare size={16} />
              <span>WhatsApp Urgente</span>
            </a>
          </div>
        </div>
      </div>

      {/* TABS NAVEGACIÓN */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-gray-800">
        {[
          { id: "ai", label: "Asistente IA", icon: Sparkles },
          { id: "tickets", label: "Mis Tickets", icon: Ticket },
          { id: "faq", label: "Preguntas Frecuentes", icon: MessageSquare },
          { id: "contact", label: "Contacto Directo", icon: Phone }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as SupportTab);
                if (tab.id !== "tickets") setSelectedTicket(null);
              }}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* CONTENIDO TABS */}
      <div className="min-h-[500px]">
        {activeTab === "ai" && (
          <div className="max-w-4xl mx-auto">
            <AIChatWidget onEscalate={handleEscalate} />
          </div>
        )}

        {activeTab === "tickets" && (
          <div className="max-w-5xl mx-auto">
            {selectedTicket ? (
              <TicketDetail 
                ticket={selectedTicket} 
                onBack={() => setSelectedTicket(null)} 
              />
            ) : (
              <TicketList 
                onSelectTicket={setSelectedTicket}
                onNewTicket={() => {
                  setEscalationContext("Creación manual de ticket desde listado");
                  setEscalationConversationId(null);
                  setIsEscalationOpen(true);
                }}
              />
            )}
          </div>
        )}

        {activeTab === "faq" && (
          <div className="max-w-5xl mx-auto">
            <FAQSection onAskAI={(q) => setActiveTab("ai")} />
          </div>
        )}

        {activeTab === "contact" && (
          <div className="max-w-5xl mx-auto">
            <DepartmentCards onOpenTicket={handleOpenTicket} />
          </div>
        )}
      </div>

      <EscalationModal
        isOpen={isEscalationOpen}
        contextData={escalationContext}
        conversationId={escalationConversationId}
        onClose={() => setIsEscalationOpen(false)}
        onSuccess={handleEscalationSuccess}
      />
    </div>
  );
}
