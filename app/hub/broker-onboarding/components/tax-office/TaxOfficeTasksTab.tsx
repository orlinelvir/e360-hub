"use client";

import { useState, useMemo } from "react";
import { Plus, CheckCircle2, Circle, Clock, ListChecks, X } from "lucide-react";
import { TaxTask, TaxTaskStatus, TaxTaskPriority, NewTaxTaskInput, TaxClient } from "../../types";

interface TaxOfficeTasksTabProps {
  tasks: TaxTask[];
  clients: TaxClient[];
  onAddTask: (input: NewTaxTaskInput) => Promise<boolean>;
  onUpdateStatus: (taskId: string, status: TaxTaskStatus) => void;
}

const STATUS_TABS: { id: TaxTaskStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "to_do", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
];

function priorityBadge(priority: TaxTaskPriority) {
  switch (priority) {
    case "high":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case "medium":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "low":
      return "bg-gray-500/10 text-gray-400 border-gray-500/20";
  }
}

function nextStatus(status: TaxTaskStatus): TaxTaskStatus {
  if (status === "to_do") return "in_progress";
  if (status === "in_progress") return "completed";
  return "to_do";
}

export default function TaxOfficeTasksTab({ tasks, clients, onAddTask, onUpdateStatus }: TaxOfficeTasksTabProps) {
  const [statusFilter, setStatusFilter] = useState<TaxTaskStatus | "all">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<TaxTaskPriority>("medium");
  const [relatedClientId, setRelatedClientId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTasks = useMemo(() => {
    const list = statusFilter === "all" ? tasks : tasks.filter((t) => t.status === statusFilter);
    return list.slice().sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
  }, [tasks, statusFilter]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    const success = await onAddTask({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
      priority,
      relatedClientId: relatedClientId || undefined
    });
    setIsSubmitting(false);
    if (success) {
      setIsModalOpen(false);
      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority("medium");
      setRelatedClientId("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
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
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,224,240,0.3)] flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>New task</span>
        </button>
      </div>

      <div className="p-6 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
        {tasks.length === 0 ? (
          <div className="py-12 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
              <ListChecks size={22} />
            </div>
            <p className="text-white font-bold text-sm">No tasks.</p>
            <p className="text-gray-400 text-xs leading-relaxed">Crea tareas de seguimiento vinculadas a tus clientes fiscales.</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <p className="py-8 text-center text-gray-500 italic text-xs">No hay tareas en este estado.</p>
        ) : (
          <div className="divide-y divide-gray-800/60">
            {filteredTasks.map((task) => {
              const client = clients.find((c) => c.id === task.relatedClientId);
              return (
                <div key={task.id} className="py-3.5 flex items-start gap-3 group">
                  <button
                    onClick={() => onUpdateStatus(task.id, nextStatus(task.status))}
                    className="mt-0.5 text-cyan-400 hover:text-cyan-300 cursor-pointer shrink-0"
                    title="Cambiar estado"
                  >
                    {task.status === "completed" ? (
                      <CheckCircle2 size={18} />
                    ) : task.status === "in_progress" ? (
                      <Clock size={18} className="text-amber-400" />
                    ) : (
                      <Circle size={18} />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${task.status === "completed" ? "text-gray-500 line-through" : "text-white"}`}>{task.title}</p>
                    {task.description && <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {task.dueDate && <span className="text-[10px] font-mono text-gray-500">Vence: {task.dueDate}</span>}
                      {client && <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">{client.name}</span>}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${priorityBadge(task.priority)}`}>{task.priority}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0A182D] border border-cyan-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[#05101F]">
              <h3 className="font-bold text-sm text-white">New task</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Task title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Due date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaxTaskPriority)}
                    className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Related client</label>
                <select
                  value={relatedClientId}
                  onChange={(e) => setRelatedClientId(e.target.value)}
                  className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                >
                  <option value="">No client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-700 text-gray-300 rounded-xl font-semibold hover:bg-gray-800 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-cyan-500 text-black font-extrabold rounded-xl hover:bg-cyan-400 disabled:opacity-50 cursor-pointer">
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
