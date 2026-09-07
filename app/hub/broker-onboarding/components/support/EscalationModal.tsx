"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, AlertCircle, Loader2, Upload } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { SupportTicketV2, TicketCategory } from "../../types";
import { TICKET_CATEGORIES, getTicketCategoryDef } from "@/lib/support/ticket-categories";
import { getBrokerClients, ClientLeadData } from "@/lib/services/broker-service";

interface EscalationModalProps {
  isOpen: boolean;
  contextData: string;
  conversationId?: string | null;
  onClose: () => void;
  onSuccess: (ticket: SupportTicketV2) => void;
}

export default function EscalationModal({ isOpen, contextData, conversationId, onClose, onSuccess }: EscalationModalProps) {
  const { user } = useAuth();
  const [category, setCategory] = useState<TicketCategory>("general");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [relatedClientId, setRelatedClientId] = useState("");
  const [extraFieldValue, setExtraFieldValue] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [clients, setClients] = useState<ClientLeadData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!user || !isOpen) return;
      getBrokerClients(user.uid).then(setClients);
    }, 0);
    return () => clearTimeout(timeout);
  }, [user, isOpen]);

  if (!isOpen) return null;

  const categoryDef = getTicketCategoryDef(category);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setError("");

    const hasAiContext = contextData && contextData.trim().length > 0;
    const description = hasAiContext
      ? `-- Contexto de la IA --\n${contextData}\n\n-- Notas adicionales --\n${additionalNotes || "Sin notas adicionales"}`
      : additionalNotes || "Sin notas adicionales";

    const relatedClient = clients.find((c) => c.id === relatedClientId);

    try {
      const token = await user.getIdToken();
      const body = new FormData();
      body.append("subject", `${categoryDef?.label || category}${relatedClient ? `: ${relatedClient.name}` : ""}`);
      body.append("category", category);
      body.append("priority", priority);
      body.append("description", description);
      if (conversationId) body.append("conversationId", conversationId);
      if (relatedClient) {
        body.append("relatedClientId", relatedClient.id || "");
        body.append("relatedClientName", relatedClient.name);
      }
      if (categoryDef?.extraField && extraFieldValue.trim()) {
        body.append("categoryFields", JSON.stringify({ [categoryDef.extraField.key]: extraFieldValue.trim() }));
      }
      if (attachment) body.append("attachment", attachment);

      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear el ticket");

      onSuccess(data.ticket as SupportTicketV2);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al crear el ticket");
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
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#0A182D] border border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl z-10"
        >
          <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <AlertCircle className="text-amber-400" /> Escalar a Agente
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {contextData ? "El historial del chat se enviará como contexto." : "Cuéntanos qué necesitas."}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Categoría *</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value as TicketCategory); setExtraFieldValue(""); }}
                className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                {TICKET_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Prioridad *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="low">Baja (Respuesta en 72h)</option>
                <option value="medium">Media (Respuesta en 24h)</option>
                <option value="high">Alta (Urgente)</option>
              </select>
            </div>

            {clients.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Cliente Relacionado (Opcional)</label>
                <select
                  value={relatedClientId}
                  onChange={(e) => setRelatedClientId(e.target.value)}
                  className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Ninguno / No aplica</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.serviceName || c.serviceId || "Servicio"}</option>
                  ))}
                </select>
              </div>
            )}

            {categoryDef?.extraField && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">{categoryDef.extraField.label}</label>
                <input
                  type={categoryDef.extraField.type}
                  value={extraFieldValue}
                  onChange={(e) => setExtraFieldValue(e.target.value)}
                  placeholder={categoryDef.extraField.placeholder}
                  className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Notas Adicionales (Opcional)</label>
              <textarea
                rows={3}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="¿Qué más debemos saber?"
                className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Adjuntar Captura o PDF (Opcional)</label>
              <label className="flex items-center gap-3 px-4 py-3 bg-[#05101F] border border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-cyan-500 transition-colors">
                <Upload size={18} className="text-gray-500 shrink-0" />
                <span className="text-xs text-gray-400 truncate">
                  {attachment ? attachment.name : "Sube una imagen o PDF (máx. 8MB)"}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  className="hidden"
                  onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                />
              </label>
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
