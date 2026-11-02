"use client";

import { useState } from "react";
import { 
  FileText, 
  ExternalLink, 
  Copy, 
  Check, 
  AlertTriangle, 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  Layers
} from "lucide-react";
import { ClientLead } from "../../types";
import { servicesData, ServiceDetail } from "../../data/services";

interface CrmDocumentPortalCardProps {
  client: ClientLead;
  brokerName?: string;
}

export default function CrmDocumentPortalCard({ client, brokerName }: CrmDocumentPortalCardProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  // Encontrar el servicio correspondiente para obtener su enlace oficial de CRM y requisitos
  const matchedService: ServiceDetail | undefined = servicesData.find(
    (s) => s.id === client.serviceId || s.title.toLowerCase() === client.serviceName.toLowerCase()
  );

  const officialFormLink = matchedService?.formLink || "https://app.startpoint.biz";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(officialFormLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div className="bg-[#05101F] border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
      {/* Glow de acento E360 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <FileText size={16} />
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              Portal Oficial de Documentos & Admisión CRM
            </h4>
            <p className="text-[11px] text-gray-400">
              Enlace de carga segura vinculado a StartPoint CRM (GHL)
            </p>
          </div>
        </div>
        <span className="self-start sm:self-auto px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
          Uso Obligatorio
        </span>
      </div>

      {/* Banner de Aviso de Cumplimiento CRM Estricto */}
      <div className="mt-3.5 bg-[#0A182D] border border-cyan-500/40 rounded-xl p-3.5 text-xs">
        <div className="flex items-start gap-2.5">
          <ShieldCheck size={16} className="text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-extrabold text-cyan-300 text-[11px] uppercase tracking-wide">
              Regla de Operación E360: Uso Obligatorio del CRM
            </p>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              Los brokers y sus clientes <strong>deben utilizar siempre</strong> los formularios oficiales alojados en el CRM (StartPoint CRM / GoHighLevel). No se admiten expedientes ni recaudación de documentos fuera de estos canales:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5 mt-1.5 border-t border-gray-800">
              <div className="flex items-start gap-1.5 text-[10px] text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <span>
                  <strong className="text-white">Formularios E360:</strong> Con la marca e infraestructura central de Emprende 360.
                </span>
              </div>
              <div className="flex items-start gap-1.5 text-[10px] text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <span>
                  <strong className="text-white">Formularios con tu Logo:</strong> Si tienes subcuenta de CRM activa con tu branding de broker.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enlace y Acciones Rápidas */}
      <div className="mt-4 space-y-2">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Enlace Directo para {client.name} ({matchedService?.title || client.serviceName}):
        </label>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 bg-[#0A182D] border border-gray-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 truncate select-all">
            {officialFormLink}
          </div>
          
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black rounded-xl transition-colors cursor-pointer shrink-0"
          >
            {copiedLink ? (
              <>
                <Check size={14} className="text-black" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copiar Enlace</span>
              </>
            )}
          </button>

          <a
            href={officialFormLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#0A182D] hover:bg-[#10233f] text-white border border-gray-700 hover:border-cyan-500 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <ExternalLink size={14} />
            <span>Abrir Formulario</span>
          </a>
        </div>
      </div>

      {/* Requisitos Documentales sugeridos para este servicio */}
      {matchedService?.requirements && matchedService.requirements.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-gray-800/80">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
            <Layers size={12} className="text-cyan-400" />
            Documentación Requerida para este Servicio ({matchedService.requirements.length} ítems):
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {matchedService.requirements.map((req, idx) => (
              <li key={idx} className="flex items-start gap-1.5 text-[11px] text-gray-300 bg-[#0A182D]/60 p-2 rounded-lg border border-gray-850">
                <CheckCircle2 size={13} className="text-cyan-400 shrink-0 mt-0.5" />
                <span className="leading-tight">{req}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Enlace directo a la consola del CRM */}
      <div className="mt-3.5 pt-3 border-t border-gray-800 flex items-center justify-between text-[11px]">
        <span className="text-gray-400">
          ¿Deseas gestionar subcuentas o contactos en el CRM central?
        </span>
        <a
          href="https://app.startpoint.biz"
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-300 font-bold inline-flex items-center gap-1"
        >
          <span>Ir a StartPoint CRM</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
