"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Building, DollarSign, Phone, Mail, ArrowRight, ArrowLeft, 
  ExternalLink, User, AlertCircle, CheckCircle2, ChevronRight, Eye 
} from "lucide-react";
import { ClientLead, PipelineStage } from "../types";
import { resolvePipelineCluster } from "@/lib/service-routing";
import { deriveCaseStatus, REVIEW_STATUS_META } from "@/lib/services/case-status";

interface KanbanBoardProps {
  clients: ClientLead[];
  stageLabels: Record<PipelineStage, { label: string; color: string; bg: string }>;
  onUpdateStage: (id: string, newStage: PipelineStage) => void;
  onSelectClient: (client: ClientLead) => void;
  applicationStatusClusters: string[];
}

const STAGE_ORDER: PipelineStage[] = [
  "lead",
  "qualification",
  "docs_pending",
  "submitted",
  "approved",
  "paid",
  "rejected"
];

export default function KanbanBoard({
  clients,
  stageLabels,
  onUpdateStage,
  onSelectClient,
  applicationStatusClusters,
}: KanbanBoardProps) {
  const [draggedClientId, setDraggedClientId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

  const handleDragStart = (e: React.DragEvent, clientId: string) => {
    e.dataTransfer.setData("text/plain", clientId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedClientId(clientId);
  };

  const handleDragEnd = () => {
    setDraggedClientId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleDragLeave = (stage: PipelineStage) => {
    if (dragOverStage === stage) {
      setDragOverStage(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStage: PipelineStage) => {
    e.preventDefault();
    setDragOverStage(null);
    const clientId = e.dataTransfer.getData("text/plain") || draggedClientId;
    if (clientId) {
      onUpdateStage(clientId, targetStage);
    }
    setDraggedClientId(null);
  };

  // Helper para mover al siguiente/anterior estado con 1 clic (para móviles y accesibilidad)
  const handleShiftStage = (client: ClientLead, direction: "prev" | "next") => {
    const currentIndex = STAGE_ORDER.indexOf(client.stage);
    if (currentIndex === -1) return;
    const newIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < STAGE_ORDER.length) {
      onUpdateStage(client.id, STAGE_ORDER[newIndex]);
    }
  };

  return (
    <div className="w-full overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
      <div className="flex gap-4 min-w-[1750px] items-start">
        {STAGE_ORDER.map((stageKey) => {
          const stageInfo = stageLabels[stageKey] || stageLabels.lead;
          const stageClients = clients.filter((c) => c.stage === stageKey);

          // Métricas de la columna
          const totalVolume = stageClients.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
          const totalCommission = stageClients.reduce((acc, c) => acc + (Number(c.estimatedCommission) || 0), 0);

          const isOver = dragOverStage === stageKey;

          return (
            <div
              key={stageKey}
              onDragOver={(e) => handleDragOver(e, stageKey)}
              onDragLeave={() => handleDragLeave(stageKey)}
              onDrop={(e) => handleDrop(e, stageKey)}
              className={`w-[245px] shrink-0 rounded-2xl border transition-all flex flex-col bg-[#0A182D]/40 ${
                isOver
                  ? "border-cyan-400 bg-cyan-950/20 ring-2 ring-cyan-400/50"
                  : "border-gray-800/80 hover:border-gray-700/80"
              }`}
            >
              {/* Encabezado de Columna */}
              <div className="p-3.5 border-b border-gray-800/80 bg-[#05101F]/80 rounded-t-2xl">
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${stageInfo.bg.split(" ")[0]}`} />
                    <h3 className="font-extrabold text-xs text-white uppercase tracking-wider truncate">
                      {stageInfo.label}
                    </h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${stageInfo.bg} ${stageInfo.color}`}>
                    {stageClients.length}
                  </span>
                </div>

                {/* Subtotales financieros de la columna */}
                <div className="flex items-center justify-between text-[10px] text-gray-400 mt-2.5 pt-2 border-t border-gray-900">
                  <span>
                    Vol: <strong className="text-white">${totalVolume.toLocaleString()}</strong>
                  </span>
                  <span>
                    Com: <strong className="text-emerald-400">${totalCommission.toLocaleString()}</strong>
                  </span>
                </div>
              </div>

              {/* Lista de Tarjetas en la Columna */}
              <div className="p-2.5 space-y-2.5 min-h-[450px] max-h-[720px] overflow-y-auto">
                {stageClients.length === 0 ? (
                  <div
                    className={`h-32 border border-dashed rounded-xl flex flex-col items-center justify-center p-3 text-center transition-colors ${
                      isOver
                        ? "border-cyan-400/60 bg-cyan-500/5 text-cyan-300"
                        : "border-gray-800/60 text-gray-600"
                    }`}
                  >
                    <span className="text-[11px] font-semibold">
                      {isOver ? "Suelta aquí para mover" : "Sin clientes en esta etapa"}
                    </span>
                    <span className="text-[9px] text-gray-600 mt-1">Arrastra prospectos aquí</span>
                  </div>
                ) : (
                  stageClients.map((client) => {
                    const safeAmount = Number(client.amount) || 0;
                    const safeCommission = Number(client.estimatedCommission) || 0;
                    const cluster = resolvePipelineCluster(client.serviceId, client.serviceName);
                    const applicationStatusInfo = REVIEW_STATUS_META[deriveCaseStatus(client).reviewStatus];
                    const showApplicationStatus = applicationStatusClusters.includes(cluster);

                    const currentIndex = STAGE_ORDER.indexOf(client.stage);
                    const hasPrev = currentIndex > 0;
                    const hasNext = currentIndex < STAGE_ORDER.length - 1;

                    return (
                      <div
                        key={client.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, client.id)}
                        onDragEnd={handleDragEnd}
                        className="bg-[#05101F]/90 hover:bg-[#08172E] border border-gray-800/90 hover:border-cyan-500/50 rounded-xl p-3 shadow-md hover:shadow-cyan-500/10 transition-all cursor-grab active:cursor-grabbing group select-none relative"
                      >
                        {/* ID y Servicio */}
                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono mb-1">
                          <span className="font-bold text-gray-400">{client.id}</span>
                          <span className="text-[9px] text-gray-400 truncate max-w-[110px]" title={client.serviceName}>
                            {client.serviceName}
                          </span>
                        </div>

                        {/* Nombre del Cliente */}
                        <h4
                          onClick={() => onSelectClient(client)}
                          className="font-extrabold text-white text-xs group-hover:text-cyan-300 transition-colors cursor-pointer line-clamp-1"
                        >
                          {client.name}
                        </h4>

                        {/* Montos Financieros */}
                        {client.serviceId !== "credit-repair" && (
                          <div className="flex items-center justify-between text-[11px] mt-2 py-1.5 px-2 rounded-lg bg-[#0A182D]/80 border border-gray-900">
                            <span className="text-gray-300 font-bold">
                              ${safeAmount.toLocaleString()}
                            </span>
                            <span className="text-emerald-400 font-extrabold text-[10px]">
                              +${safeCommission.toLocaleString()} est.
                            </span>
                          </div>
                        )}

                        {/* Badge de Estado Real E360 (Underwriting/Seguros) */}
                        {showApplicationStatus && (
                          <div
                            className={`mt-2 text-[9px] font-bold px-2 py-0.5 rounded border text-center ${applicationStatusInfo.bg} ${applicationStatusInfo.color} ${applicationStatusInfo.border}`}
                          >
                            {applicationStatusInfo.label}
                          </div>
                        )}

                        {/* Barra de Acciones y Flechas de Avance */}
                        <div className="mt-3 pt-2 border-t border-gray-800/70 flex items-center justify-between gap-1">
                          {/* Flecha retroceder */}
                          <button
                            type="button"
                            disabled={!hasPrev}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShiftStage(client, "prev");
                            }}
                            title="Retroceder etapa"
                            className="p-1 rounded text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                          >
                            <ArrowLeft size={12} />
                          </button>

                          {/* Botón Ver Detalle */}
                          <button
                            type="button"
                            onClick={() => onSelectClient(client)}
                            className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded hover:bg-cyan-500/10 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={11} />
                            <span>Expediente</span>
                          </button>

                          {/* Flecha avanzar */}
                          <button
                            type="button"
                            disabled={!hasNext}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShiftStage(client, "next");
                            }}
                            title="Avanzar etapa"
                            className="p-1 rounded text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                          >
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
