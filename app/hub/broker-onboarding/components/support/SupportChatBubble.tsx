"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Ticket } from "lucide-react";
import AIChatWidget from "./AIChatWidget";
import EscalationModal from "./EscalationModal";
import { TicketCreatedIllustration } from "./illustrations";
import { SupportTicketV2 } from "../../types";

interface SupportChatBubbleProps {
  // La burbuja no tiene su propia noción de pestañas (vive fuera de
  // SoporteSection) — al crear un ticket, en vez de "cambiar a la pestaña
  // Tickets" como hace SoporteSection, delega en el padre (BrokerOnboardingClient)
  // para que cambie activeTab a "soporte".
  onNavigateToSupport: () => void;
}

export default function SupportChatBubble({ onNavigateToSupport }: SupportChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Mismo patrón de orquestación de escalación que ya usa SoporteSection.tsx
  // (handleEscalate/isEscalationOpen/escalationContext/escalationConversationId) —
  // reusa EscalationModal tal cual, sin tocarlo.
  const [isEscalationOpen, setIsEscalationOpen] = useState(false);
  const [escalationContext, setEscalationContext] = useState("");
  const [escalationConversationId, setEscalationConversationId] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<SupportTicketV2 | null>(null);

  const handleEscalate = (context: string, conversationId: string | null) => {
    setEscalationContext(context);
    setEscalationConversationId(conversationId);
    setIsEscalationOpen(true);
  };

  const handleEscalationSuccess = (ticket: SupportTicketV2) => {
    setIsEscalationOpen(false);
    setCreatedTicket(ticket);
  };

  const handleClose = () => {
    setIsOpen(false);
    // Al cerrar se limpia el estado de éxito — la próxima vez que se abra,
    // vuelve a mostrar el chat en vez de quedarse pegado en la confirmación.
    setCreatedTicket(null);
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-black flex items-center justify-center shadow-[0_0_25px_rgba(0,224,240,0.4)]"
        aria-label={isOpen ? "Cerrar asistente de soporte" : "Abrir asistente de soporte"}
      >
        {isOpen ? <X size={24} /> : <Bot size={26} />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-[90] w-[92vw] max-w-[380px] h-[70vh] max-h-[560px] bg-[#0A182D] border border-gray-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {createdTicket ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-5">
                <TicketCreatedIllustration size={104} />
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-white">¡Ticket creado!</h4>
                  <p className="text-xs text-gray-400 max-w-xs">
                    Un representante de E360 te contactará pronto. Puedes seguir el estatus en tus tickets.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    onNavigateToSupport();
                  }}
                  className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl text-xs font-extrabold transition-colors flex items-center gap-2"
                >
                  <Ticket size={14} />
                  <span>Ver mis tickets</span>
                </button>
              </div>
            ) : (
              <AIChatWidget variant="embedded" onEscalate={handleEscalate} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <EscalationModal
        isOpen={isEscalationOpen}
        contextData={escalationContext}
        conversationId={escalationConversationId}
        onClose={() => setIsEscalationOpen(false)}
        onSuccess={handleEscalationSuccess}
      />
    </>
  );
}
