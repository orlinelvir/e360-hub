"use client";

import { useState } from "react";
import { Plus, Zap, X, Play, Pause, FileEdit } from "lucide-react";
import {
  TaxAutomation,
  TaxAutomationStatus,
  TaxAutomationTriggerType,
  TaxAutomationActionType,
  NewTaxAutomationInput,
  TaxCaseStage
} from "../../types";

interface TaxOfficeAutomationsTabProps {
  automations: TaxAutomation[];
  onAddAutomation: (input: NewTaxAutomationInput) => Promise<boolean>;
  onUpdateStatus: (automationId: string, status: TaxAutomationStatus) => void;
}

const STATUS_TABS: { id: TaxAutomationStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "draft", label: "Draft" },
  { id: "paused", label: "Paused" },
];

const TRIGGER_LABELS: Record<TaxAutomationTriggerType, string> = {
  deadline_approaching: "Deadline approaching",
  stage_changed: "Case stage changed",
  task_overdue: "Task overdue",
  invoice_overdue: "Invoice overdue",
};

const ACTION_LABELS: Record<TaxAutomationActionType, string> = {
  send_email: "Send email",
  send_sms: "Send SMS (notifica internamente)",
  create_task: "Create task",
};

const CASE_STAGES: TaxCaseStage[] = ["new", "docs_pending", "in_review", "ready_to_file", "transmitted", "accepted", "rejected"];

const STARTER_TEMPLATES: { name: string; triggerType: TaxAutomationTriggerType; triggerConfig: NewTaxAutomationInput["triggerConfig"]; actionType: TaxAutomationActionType; actionConfig: NewTaxAutomationInput["actionConfig"] }[] = [
  {
    name: "Recordatorio 3 días antes del deadline",
    triggerType: "deadline_approaching",
    triggerConfig: { daysBefore: 3 },
    actionType: "send_email",
    actionConfig: { subject: "Tu fecha límite se acerca", message: "Recuerda que tu declaración tiene una fecha límite próxima. Contáctanos si necesitas ayuda." }
  },
  {
    name: "Avisar cuando un caso llega a Docs Pendientes",
    triggerType: "stage_changed",
    triggerConfig: { toStageId: "docs_pending" },
    actionType: "send_email",
    actionConfig: { subject: "Nos faltan algunos documentos", message: "Tu caso está esperando documentos adicionales. Por favor súbelos lo antes posible." }
  },
  {
    name: "Tarea de seguimiento para facturas vencidas",
    triggerType: "invoice_overdue",
    triggerConfig: {},
    actionType: "create_task",
    actionConfig: { taskTitle: "Dar seguimiento a factura vencida" }
  },
];

export default function TaxOfficeAutomationsTab({ automations, onAddAutomation, onUpdateStatus }: TaxOfficeAutomationsTabProps) {
  const [statusFilter, setStatusFilter] = useState<TaxAutomationStatus | "all">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

  const filtered = statusFilter === "all" ? automations : automations.filter((a) => a.status === statusFilter);

  const handleAddFromTemplate = async (template: (typeof STARTER_TEMPLATES)[number]) => {
    setIsCreatingTemplate(true);
    await onAddAutomation({ ...template, status: "draft" });
    setIsCreatingTemplate(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-gray-400">When something happens, the right message, task or reminder goes out automatically.</p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,224,240,0.3)] flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>New automation</span>
        </button>
      </div>

      {automations.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STARTER_TEMPLATES.map((t) => (
            <div key={t.name} className="p-4 rounded-xl bg-[#05101F] border border-gray-800">
              <p className="text-xs font-bold text-white leading-snug">{t.name}</p>
              <p className="text-[10px] text-gray-500 mt-1">
                {TRIGGER_LABELS[t.triggerType]} → {ACTION_LABELS[t.actionType]}
              </p>
              <button
                onClick={() => handleAddFromTemplate(t)}
                disabled={isCreatingTemplate}
                className="mt-3 w-full px-3 py-1.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-extrabold text-[11px] rounded-lg cursor-pointer disabled:opacity-50"
              >
                + Start from template
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors shrink-0 cursor-pointer ${
              statusFilter === tab.id ? "bg-cyan-500/20 text-cyan-300 border-cyan-400" : "bg-[#05101F] text-gray-400 border-gray-800 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
        {automations.length === 0 ? (
          <div className="py-10 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
              <Zap size={22} />
            </div>
            <p className="text-white font-bold text-sm">No automations yet. Start from a template or build your own.</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-gray-500 italic text-xs">No hay automatizaciones en este estado.</p>
        ) : (
          <div className="divide-y divide-gray-800/60">
            {filtered.map((a) => (
              <div key={a.id} className="py-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{a.name}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {TRIGGER_LABELS[a.triggerType]} → {ACTION_LABELS[a.actionType]}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      a.status === "active"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : a.status === "paused"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                    }`}
                  >
                    {a.status}
                  </span>
                  {a.status === "active" ? (
                    <button onClick={() => onUpdateStatus(a.id, "paused")} title="Pause" className="p-1.5 text-amber-400 hover:text-amber-300 cursor-pointer">
                      <Pause size={14} />
                    </button>
                  ) : (
                    <button onClick={() => onUpdateStatus(a.id, "active")} title="Activate" className="p-1.5 text-emerald-400 hover:text-emerald-300 cursor-pointer">
                      <Play size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && <NewAutomationModal onClose={() => setIsModalOpen(false)} onSubmit={async (input) => (await onAddAutomation(input)) && setIsModalOpen(false)} />}
    </div>
  );
}

function NewAutomationModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (input: NewTaxAutomationInput) => Promise<void | boolean> }) {
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState<TaxAutomationTriggerType>("deadline_approaching");
  const [daysBefore, setDaysBefore] = useState(3);
  const [toStageId, setToStageId] = useState<TaxCaseStage>("docs_pending");
  const [actionType, setActionType] = useState<TaxAutomationActionType>("send_email");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [status, setStatus] = useState<TaxAutomationStatus>("draft");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    await onSubmit({
      name: name.trim(),
      status,
      triggerType,
      triggerConfig: triggerType === "deadline_approaching" ? { daysBefore } : triggerType === "stage_changed" ? { toStageId } : {},
      actionType,
      actionConfig:
        actionType === "send_email"
          ? { subject: subject.trim() || name.trim(), message: message.trim() }
          : actionType === "send_sms"
          ? { message: message.trim() }
          : { taskTitle: taskTitle.trim() || name.trim() }
    });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0A182D] border border-cyan-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[#05101F]">
          <h3 className="font-bold text-sm text-white">New automation</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">When this happens...</label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value as TaxAutomationTriggerType)}
              className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
            >
              {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {triggerType === "deadline_approaching" && (
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Days before deadline</label>
              <input
                type="number"
                min="1"
                value={daysBefore}
                onChange={(e) => setDaysBefore(Number(e.target.value))}
                className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>
          )}

          {triggerType === "stage_changed" && (
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Target stage</label>
              <select
                value={toStageId}
                onChange={(e) => setToStageId(e.target.value as TaxCaseStage)}
                className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
              >
                {CASE_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">...do this</label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value as TaxAutomationActionType)}
              className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
            >
              {Object.entries(ACTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {actionType === "send_email" && (
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none mb-2"
              />
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none resize-none"
              />
            </div>
          )}

          {actionType === "send_sms" && (
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none resize-none"
              />
              <p className="text-[10px] text-amber-400 mt-1">Todavía no hay envío real de SMS conectado — se te notificará internamente para enviarlo tú mismo.</p>
            </div>
          )}

          {actionType === "create_task" && (
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Task title</label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <FileEdit size={12} className="text-gray-500" />
            <label className="text-[10px] uppercase font-bold text-gray-400">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaxAutomationStatus)}
              className="bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-lg px-2 py-1 text-white outline-none cursor-pointer"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-700 text-gray-300 rounded-xl font-semibold hover:bg-gray-800 cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-cyan-500 text-black font-extrabold rounded-xl hover:bg-cyan-400 disabled:opacity-50 cursor-pointer">
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
