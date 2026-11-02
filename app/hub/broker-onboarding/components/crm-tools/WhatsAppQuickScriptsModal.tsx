"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  MessageSquare, 
  Copy, 
  Check, 
  ExternalLink, 
  Send, 
  User, 
  Phone, 
  FileText, 
  Sparkles,
  ShieldCheck
} from "lucide-react";
import { ClientLead } from "../../types";
import { servicesData } from "../../data/services";

interface WhatsAppQuickScriptsModalProps {
  client: ClientLead | null;
  brokerName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ScriptTemplate {
  id: string;
  category: "intake" | "reminder" | "submitted" | "approved";
  categoryLabel: string;
  categoryColor: string;
  title: string;
  generateText: (clientName: string, brokerName: string, serviceName: string, crmLink: string) => string;
}

const TEMPLATES: ScriptTemplate[] = [
  {
    id: "intake_crm",
    category: "intake",
    categoryLabel: "1. Admisión & Carga CRM",
    categoryColor: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
    title: "Solicitud Inicial y Carga Oficial de Documentos",
    generateText: (clientName, brokerName, serviceName, crmLink) =>
      `¡Hola ${clientName}! Te saluda ${brokerName} de Emprende 360. Para iniciar la tramitación de tu solicitud de ${serviceName}, por favor completa tus datos y sube los documentos requeridos directamente en nuestro portal seguro de CRM: ${crmLink} . El proceso es 100% digital y confidencial. Por favor avísame en cuanto lo envíes para dar seguimiento de inmediato con nuestro equipo. ¡Quedo muy atento!`
  },
  {
    id: "docs_reminder",
    category: "reminder",
    categoryLabel: "2. Recordatorio",
    categoryColor: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    title: "Documentos Pendientes para Someter Caso",
    generateText: (clientName, brokerName, serviceName, crmLink) =>
      `Estimado/a ${clientName}, te saluda ${brokerName} de Emprende 360. Dando seguimiento a tu expediente de ${serviceName}, te comento que aún tenemos documentos pendientes para poder presentar tu caso a evaluación formal. Por favor súbelos a través del portal de tu expediente: ${crmLink} . Cuanto antes los completemos, más rápido podremos obtener tu oferta. ¡Gracias!`
  },
  {
    id: "case_submitted",
    category: "submitted",
    categoryLabel: "3. Sometido",
    categoryColor: "bg-blue-500/10 text-blue-300 border-blue-500/30",
    title: "Expediente Sometido a Underwriting / Evaluación",
    generateText: (clientName, brokerName, serviceName) =>
      `¡Excelentes noticias ${clientName}! Te confirmo que tu expediente de ${serviceName} está completo y ya fue sometido a revisión con la mesa de underwriting. Te estaré notificando en cuanto tengamos la resolución oficial. ¡Agradezco mucho tu confianza y diligencia!`
  },
  {
    id: "case_approved",
    category: "approved",
    categoryLabel: "4. Aprobado",
    categoryColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    title: "Aprobación y Coordinación de Cierre / Desembolso",
    generateText: (clientName, brokerName, serviceName) =>
      `¡Felicidades ${clientName}! Tu solicitud para ${serviceName} ha sido pre-aprobada exitosamente. Por favor comunícate conmigo a la brevedad para revisar juntos los términos de la oferta y coordinar las firmas finales para el desembolso. Saludos cordiales de parte de ${brokerName} y todo el equipo de Emprende 360.`
  }
];

export default function WhatsAppQuickScriptsModal({
  client,
  brokerName,
  isOpen,
  onClose
}: WhatsAppQuickScriptsModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen || !client) return null;

  const matchedService = servicesData.find(
    (s) => s.id === client.serviceId || s.title.toLowerCase() === client.serviceName.toLowerCase()
  );
  const crmFormLink = matchedService?.formLink || "https://app.startpoint.biz";

  // Formatear teléfono para wa.me (remover caracteres especiales)
  const cleanPhone = (rawPhone: string) => {
    let cleaned = rawPhone.replace(/\D/g, "");
    // Si tiene 10 dígitos (formato estándar USA sin prefijo +1), anteponer 1
    if (cleaned.length === 10) {
      cleaned = `1${cleaned}`;
    }
    return cleaned;
  };

  const targetPhone = cleanPhone(client.phone || "");

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // fallback
    }
  };

  const handleOpenWhatsApp = (text: string) => {
    const encoded = encodeURIComponent(text);
    const url = targetPhone ? `https://wa.me/${targetPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-[#0A182D] border border-cyan-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-y-auto space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  Plantillas de WhatsApp de 1 Clic
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    Auto-rellenado
                  </span>
                </h3>
                <p className="text-xs text-gray-400">
                  Mensajes personalizados para <strong className="text-white">{client.name}</strong> • {client.phone || "Sin teléfono"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Recordatorio obligatorio de CRM */}
          <div className="bg-[#05101F] border border-cyan-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs">
            <ShieldCheck size={16} className="text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-300 leading-relaxed">
              Las plantillas enlazan automáticamente al <strong className="text-white">formulario oficial del CRM (StartPoint CRM / GHL)</strong> para garantizar que el cliente entregue la información en los canales certificados de E360.
            </p>
          </div>

          {/* Lista de Plantillas */}
          <div className="space-y-4">
            {TEMPLATES.map((tmpl) => {
              const scriptText = tmpl.generateText(
                client.name,
                brokerName || "Emprende 360",
                client.serviceName,
                crmFormLink
              );
              const isCopied = copiedId === tmpl.id;

              return (
                <div
                  key={tmpl.id}
                  className="bg-[#05101F] border border-gray-800 hover:border-gray-700 rounded-2xl p-4 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${tmpl.categoryColor}`}>
                        {tmpl.categoryLabel}
                      </span>
                      <h4 className="text-xs font-bold text-white">{tmpl.title}</h4>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(tmpl.id, scriptText)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0A182D] hover:bg-[#10233F] text-gray-300 hover:text-white border border-gray-800 text-[11px] font-bold transition-colors cursor-pointer"
                        title="Copiar texto"
                      >
                        {isCopied ? (
                          <>
                            <Check size={12} className="text-emerald-400" />
                            <span className="text-emerald-400">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenWhatsApp(scriptText)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-black transition-colors cursor-pointer shadow-md shadow-emerald-500/10"
                      >
                        <Send size={12} />
                        <span>Abrir en WhatsApp</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 bg-[#0A182D] p-3 rounded-xl border border-gray-850 leading-relaxed font-sans select-all whitespace-pre-wrap">
                    {scriptText}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-gray-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
