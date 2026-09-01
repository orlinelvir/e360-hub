"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { createBrokerTicket } from "@/lib/services/broker-service";
import { SupportTicket } from "../../types";

interface EscalationModalProps {
  isOpen: boolean;
  contextData: string;
  onClose: () => void;
  onSuccess: (ticket: SupportTicket) => void;
}

export default function EscalationModal({ isOpen, contextData, onClose, onSuccess }: EscalationModalProps) {
  const { user } = useAuth();
  const [department, setDepartment] = useState<"general" | "commission" | "underwriting" | "ghl_crm">("general");
  const [priority, setPriority] = useState<"medium" | "high">("medium");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    const description = `-- Contexto de la IA --\\n${contextData}\\n\\n-- Notas adicionales --\\n${additionalNotes || 'Sin notas adicionales'}`;
    
    try {
      const payload = {
        subject: `Escalación IA: ${department.toUpperCase()}`,
        category: department,
        priority: priority,
        status: "open" as const,
        createdAt: new Date().toISOString().split("T")[0],
        description: description
      };
      
      const docId = await createBrokerTicket(user.uid, payload);
      
      onSuccess({
        id: docId,
        ...payload
      });
      
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[#0A182D] border border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl z-10"
        >
          <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <AlertCircle className="text-amber-400" /> Escalar a Agente
              </h2>
              <p className="text-xs text-gray-400 mt-1">El historial del chat se enviará como contexto.</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Departamento *</label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value as "general" | "commission" | "underwriting" | "ghl_crm")}
                className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="general">Soporte General</option>
                <option value="commission">Comisiones y Pagos</option>
                <option value="underwriting">Underwriting / Requisitos</option>
                <option value="ghl_crm">StartPoint CRM Soporte Técnico</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Prioridad *</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as "medium" | "high")}
                className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="medium">Media (Respuesta en 24h)</option>
                <option value="high">Alta (Urgente)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Notas Adicionales (Opcional)</label>
              <textarea
                rows={3}
                value={additionalNotes}
                onChange={e => setAdditionalNotes(e.target.value)}
                placeholder="¿Qué más debemos saber?"
                className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 text-gray-400 hover:text-white text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-sm transition-colors flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Crear Ticket
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
