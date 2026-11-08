"use client";

import { useState, useMemo } from "react";
import { Plus, Settings2, X, GripVertical, Trash2 } from "lucide-react";
import { TaxPipeline, TaxLead, NewTaxLeadInput, NewTaxPipelineInput } from "../../types";

interface TaxOfficeWorkflowTabProps {
  pipelines: TaxPipeline[];
  leads: TaxLead[];
  onAddLead: (input: NewTaxLeadInput) => Promise<boolean>;
  onMoveLead: (leadId: string, stageId: string) => void;
  onAddPipeline: (input: NewTaxPipelineInput) => Promise<boolean>;
  onUpdateStages: (pipelineId: string, stages: { id: string; name: string }[]) => Promise<boolean>;
}

const formatMoney = (val: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

export default function TaxOfficeWorkflowTab({ pipelines, leads, onAddLead, onMoveLead, onAddPipeline, onUpdateStages }: TaxOfficeWorkflowTabProps) {
  const [activePipelineId, setActivePipelineId] = useState<string | null>(pipelines[0]?.id || null);
  const activePipeline = pipelines.find((p) => p.id === activePipelineId) || pipelines[0];

  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isNewPipelineOpen, setIsNewPipelineOpen] = useState(false);
  const [isManageStagesOpen, setIsManageStagesOpen] = useState(false);

  const leadsInPipeline = useMemo(
    () => leads.filter((l) => l.pipelineId === activePipeline?.id),
    [leads, activePipeline]
  );

  const handleDrop = (stageId: string) => {
    setDragOverStage(null);
    if (draggedLeadId) onMoveLead(draggedLeadId, stageId);
    setDraggedLeadId(null);
  };

  if (!activePipeline) {
    return <div className="p-8 text-center text-gray-400 text-sm">Cargando pipeline...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl bg-[#0A182D]/80 border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {pipelines.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePipelineId(p.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors shrink-0 cursor-pointer ${
                activePipeline.id === p.id
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-400"
                  : "bg-[#05101F] text-gray-400 border-gray-800 hover:text-white"
              }`}
            >
              {p.name}
            </button>
          ))}
          <button
            onClick={() => setIsNewPipelineOpen(true)}
            className="px-3 py-2 rounded-xl text-xs font-bold border border-dashed border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors shrink-0 cursor-pointer flex items-center gap-1"
          >
            <Plus size={14} />
            <span>Add</span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsManageStagesOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#05101F] text-gray-300 border border-gray-800 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Settings2 size={14} />
            <span>Manage stages</span>
          </button>
          <button
            onClick={() => setIsNewLeadOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,224,240,0.3)] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>New lead</span>
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-6">
        <div className="flex gap-4 min-w-max items-start">
          {activePipeline.stages
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((stage) => {
              const stageLeads = leadsInPipeline.filter((l) => l.stageId === stage.id);
              const isOver = dragOverStage === stage.id;
              return (
                <div
                  key={stage.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverStage !== stage.id) setDragOverStage(stage.id);
                  }}
                  onDragLeave={() => setDragOverStage((prev) => (prev === stage.id ? null : prev))}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(stage.id);
                  }}
                  className={`w-[260px] shrink-0 rounded-2xl border transition-all flex flex-col bg-[#0A182D]/40 ${
                    isOver ? "border-cyan-400 bg-cyan-950/20 ring-2 ring-cyan-400/50" : "border-gray-800/80"
                  }`}
                >
                  <div className="p-3.5 border-b border-gray-800/80 bg-[#05101F]/80 rounded-t-2xl flex items-center justify-between">
                    <h3 className="font-extrabold text-xs text-white uppercase tracking-wider truncate">{stage.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black border bg-cyan-500/10 text-cyan-300 border-cyan-500/20">
                      {stageLeads.length}
                    </span>
                  </div>
                  <div className="p-2.5 space-y-2.5 min-h-[420px] max-h-[640px] overflow-y-auto">
                    {stageLeads.length === 0 ? (
                      <div
                        className={`h-24 border border-dashed rounded-xl flex items-center justify-center text-[11px] font-semibold transition-colors ${
                          isOver ? "border-cyan-400/60 bg-cyan-500/5 text-cyan-300" : "border-gray-800/60 text-gray-600"
                        }`}
                      >
                        {isOver ? "Suelta aquí" : "No leads here yet."}
                      </div>
                    ) : (
                      stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", lead.id);
                            setDraggedLeadId(lead.id);
                          }}
                          onDragEnd={() => {
                            setDraggedLeadId(null);
                            setDragOverStage(null);
                          }}
                          className="bg-[#05101F]/90 hover:bg-[#08172E] border border-gray-800/90 hover:border-cyan-500/50 rounded-xl p-3 shadow-md transition-all cursor-grab active:cursor-grabbing select-none"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-extrabold text-white text-xs">{lead.name}</h4>
                            <GripVertical size={12} className="text-gray-600" />
                          </div>
                          {lead.email && <p className="text-[10px] text-gray-500 mt-0.5 truncate">{lead.email}</p>}
                          {lead.phone && <p className="text-[10px] text-gray-500">{lead.phone}</p>}
                          {typeof lead.estimatedValue === "number" && lead.estimatedValue > 0 && (
                            <div className="mt-2 text-[11px] font-bold text-emerald-400">{formatMoney(lead.estimatedValue)}</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {isNewLeadOpen && (
        <NewLeadModal
          stages={activePipeline.stages}
          pipelineId={activePipeline.id}
          onClose={() => setIsNewLeadOpen(false)}
          onSubmit={async (input) => {
            const ok = await onAddLead(input);
            if (ok) setIsNewLeadOpen(false);
            return ok;
          }}
        />
      )}

      {isNewPipelineOpen && (
        <NewPipelineModal
          onClose={() => setIsNewPipelineOpen(false)}
          onSubmit={async (input) => {
            const ok = await onAddPipeline(input);
            if (ok) setIsNewPipelineOpen(false);
            return ok;
          }}
        />
      )}

      {isManageStagesOpen && (
        <ManageStagesModal
          pipeline={activePipeline}
          onClose={() => setIsManageStagesOpen(false)}
          onSave={async (stages) => {
            const ok = await onUpdateStages(activePipeline.id, stages);
            if (ok) setIsManageStagesOpen(false);
            return ok;
          }}
        />
      )}
    </div>
  );
}

function NewLeadModal({
  stages,
  pipelineId,
  onClose,
  onSubmit
}: {
  stages: TaxPipeline["stages"];
  pipelineId: string;
  onClose: () => void;
  onSubmit: (input: NewTaxLeadInput) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [estimatedValue, setEstimatedValue] = useState<number | "">("");
  const [stageId, setStageId] = useState(stages[0]?.id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    await onSubmit({
      pipelineId,
      stageId,
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      estimatedValue: estimatedValue === "" ? undefined : Number(estimatedValue),
      notes: undefined
    });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0A182D] border border-cyan-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[#05101F]">
          <h3 className="font-bold text-sm text-white">New lead</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Nombre</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Teléfono</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Valor estimado ($)</label>
            <input
              type="number"
              min="0"
              value={estimatedValue}
              onChange={(e) => setEstimatedValue(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Etapa inicial</label>
            <select
              value={stageId}
              onChange={(e) => setStageId(e.target.value)}
              className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-700 text-gray-300 rounded-xl font-semibold hover:bg-gray-800 cursor-pointer">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-cyan-500 text-black font-extrabold rounded-xl hover:bg-cyan-400 disabled:opacity-50 cursor-pointer">
              {isSubmitting ? "Creando..." : "Crear lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NewPipelineModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (input: NewTaxPipelineInput) => Promise<boolean> }) {
  const [name, setName] = useState("");
  const [stagesText, setStagesText] = useState("New Lead, Contacted, Consultation, Proposal, Client");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const stageNames = stagesText.split(",").map((s) => s.trim()).filter(Boolean);
    if (!name.trim() || stageNames.length === 0) return;
    setIsSubmitting(true);
    await onSubmit({ name: name.trim(), stageNames });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0A182D] border border-cyan-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[#05101F]">
          <h3 className="font-bold text-sm text-white">Nuevo pipeline</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Nombre del pipeline</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Pipeline de Referidos"
              className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Etapas (separadas por coma)</label>
            <textarea
              value={stagesText}
              onChange={(e) => setStagesText(e.target.value)}
              rows={2}
              className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none resize-none"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-700 text-gray-300 rounded-xl font-semibold hover:bg-gray-800 cursor-pointer">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-cyan-500 text-black font-extrabold rounded-xl hover:bg-cyan-400 disabled:opacity-50 cursor-pointer">
              {isSubmitting ? "Creando..." : "Crear pipeline"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Función de módulo (no del componente) para que el linter de pureza de
// React no trate la llamada a Date.now() como parte del render.
function newStageId(index: number): string {
  return `stage-new-${index}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function ManageStagesModal({
  pipeline,
  onClose,
  onSave
}: {
  pipeline: TaxPipeline;
  onClose: () => void;
  onSave: (stages: { id: string; name: string }[]) => Promise<boolean>;
}) {
  // Cada fila conserva su id original de Firestore — nunca se reconcilia por
  // posición en el arreglo. Sin esto, borrar una etapa del medio desplaza los
  // nombres pero no sus ids, y el servidor termina guardando el id viejo de
  // "Contacted" con el nombre "Consultation", dejando leads huérfanos
  // (su stageId ya no corresponde a ninguna columna visible).
  const [rows, setRows] = useState<{ id: string; name: string }[]>(
    pipeline.stages.slice().sort((a, b) => a.order - b.order).map((s) => ({ id: s.id, name: s.name }))
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const cleaned = rows.map((r) => ({ id: r.id, name: r.name.trim() })).filter((r) => r.name);
    if (cleaned.length === 0) return;
    setIsSaving(true);
    await onSave(cleaned);
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0A182D] border border-cyan-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[#05101F]">
          <h3 className="font-bold text-sm text-white">Manage stages — {pipeline.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-3 text-xs">
          {rows.map((row, i) => (
            <div key={row.id} className="flex items-center gap-2">
              <input
                type="text"
                value={row.name}
                onChange={(e) => setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, name: e.target.value } : r)))}
                className="flex-1 bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
              />
              <button
                type="button"
                onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
                disabled={rows.length <= 1}
                className="p-2 text-red-400 hover:text-red-300 disabled:opacity-30 cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setRows((prev) => [...prev, { id: newStageId(prev.length), name: "" }])}
            className="w-full py-2 rounded-xl border border-dashed border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus size={14} />
            <span>Agregar etapa</span>
          </button>
          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-700 text-gray-300 rounded-xl font-semibold hover:bg-gray-800 cursor-pointer">
              Cancelar
            </button>
            <button type="button" onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-cyan-500 text-black font-extrabold rounded-xl hover:bg-cyan-400 disabled:opacity-50 cursor-pointer">
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
