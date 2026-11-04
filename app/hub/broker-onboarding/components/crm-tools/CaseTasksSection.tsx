"use client";

import { useState, useCallback } from "react";
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { CaseTask } from "../../types";

interface CaseTasksSectionProps {
  clientId: string;
  clientName: string;
  onTasksUpdated?: (tasks: CaseTask[]) => void;
}

const STORAGE_PREFIX = "e360_client_tasks_";

// Helper público para obtener tareas desde localStorage (útil para Kanban y Grid)
export function getStoredTasksForClient(clientId: string): CaseTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${clientId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredTasksForClient(clientId: string, tasks: CaseTask[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${clientId}`, JSON.stringify(tasks));
  } catch (err) {
    console.error("Error guardando tareas:", err);
  }
}

// Formatea en hora LOCAL ("YYYY-MM-DD"), nunca vía toISOString()/UTC — mezclar
// una fecha parseada en UTC (dueDate, un <input type="date">) contra una
// calculada en local causaba que una tarea que vence HOY se marcara "Vencida"
// con horas de anticipación para cualquiera en zona horaria negativa
// (Honduras/Centroamérica, el mercado real de E360). Comparar dos strings
// "YYYY-MM-DD" es suficiente — ese formato ordena igual lexicográfica y
// cronológicamente, sin necesidad de parsear ningún Date para compararlas.
function toLocalDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Exportada (no solo inline en el render) para que tests/crm-tools-and-tasks.test.ts
// pueda cubrir el bug de zona horaria de verdad, en vez de solo tenerlo arreglado sin prueba.
export function isTaskOverdue(task: Pick<CaseTask, "dueDate" | "completed">, now: Date = new Date()): boolean {
  return !task.completed && task.dueDate < toLocalDateString(now);
}

let taskIdCounter = 0;
// IDs únicos sin depender de Date.now()/Math.random() en cada llamada (las
// reglas de pureza de React marcan esas 2 como "funciones impuras" cuando se
// invocan en una ruta que podría re-ejecutarse en render) — un contador local
// + el momento real de creación es suficiente para que nunca choquen dentro
// de una misma sesión de pestaña.
function generateTaskId(): string {
  taskIdCounter += 1;
  return `task_${taskIdCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

const PRESET_TASKS = [
  { title: "Solicitar 3 meses de Bank Statements de Negocio", priority: "high" as const, daysAhead: 1 },
  { title: "Verificar Formulario Oficial CRM completado", priority: "high" as const, daysAhead: 1 },
  { title: "Solicitar Reporte de Crédito IdentityIQ", priority: "medium" as const, daysAhead: 2 },
  { title: "Enviar Acuerdo de Broker / Fee para Firma Digital", priority: "medium" as const, daysAhead: 2 },
  { title: "Cargar Copia de ID Oficial Vigente y EIN", priority: "high" as const, daysAhead: 1 },
  { title: "Llamada de Seguimiento de Oferta Aprobada", priority: "low" as const, daysAhead: 3 },
];

export default function CaseTasksSection({ clientId, clientName, onTasksUpdated }: CaseTasksSectionProps) {
  // Lazy initializer (no efecto): el padre le pasa key={clientId}, así que
  // React remonta este componente —y vuelve a correr este initializer— cada
  // vez que cambia de cliente, en vez de reutilizar la instancia.
  const [tasks, setTasks] = useState<CaseTask[]>(() => getStoredTasksForClient(clientId));
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return toLocalDateString(d);
  });
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [isAdding, setIsAdding] = useState(false);

  const persistTasks = useCallback((updated: CaseTask[]) => {
    setTasks(updated);
    saveStoredTasksForClient(clientId, updated);
    if (onTasksUpdated) {
      onTasksUpdated(updated);
    }
  }, [clientId, onTasksUpdated]);

  const handleToggleTask = (taskId: string) => {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    persistTasks(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    persistTasks(updated);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: CaseTask = {
      id: generateTaskId(),
      clientId,
      title: newTaskTitle.trim(),
      dueDate: newTaskDueDate,
      priority: newTaskPriority,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [newTask, ...tasks];
    persistTasks(updated);
    setNewTaskTitle("");
    setIsAdding(false);
  };

  const handleAddPreset = (preset: typeof PRESET_TASKS[number]) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + preset.daysAhead);

    const newTask: CaseTask = {
      id: generateTaskId(),
      clientId,
      title: preset.title,
      dueDate: toLocalDateString(targetDate),
      priority: preset.priority,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [newTask, ...tasks];
    persistTasks(updated);
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="bg-[#05101F] border border-gray-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <CheckSquare size={16} />
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Tareas y Recordatorios del Caso
            </h4>
            <p className="text-[11px] text-gray-400">
              Seguimiento operativo para {clientName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-[#0A182D] border border-gray-800 text-gray-300">
            {completedCount}/{tasks.length} listas
          </span>
          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black rounded-lg transition-colors cursor-pointer"
          >
            <Plus size={13} />
            <span>Nueva Tarea</span>
          </button>
        </div>
      </div>

      {/* Acciones Rápidas (Presets de 1 Clic) */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
          <Sparkles size={12} className="text-cyan-400" />
          Añadir Tarea Frecuente (1 Clic):
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_TASKS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAddPreset(preset)}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-[#0A182D] hover:bg-[#10233F] border border-gray-800 hover:border-cyan-500/40 text-gray-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus size={11} className="text-cyan-400" />
              <span>{preset.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Formulario Agregar Tarea */}
      {isAdding && (
        <form onSubmit={handleAddTask} className="bg-[#0A182D] border border-cyan-500/30 rounded-xl p-3.5 space-y-3">
          <p className="text-[10px] font-bold text-cyan-400 uppercase">Nueva Tarea Personalizada</p>
          <div>
            <input
              type="text"
              required
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Descripción de la tarea (ej: Revisar volumen de depósitos)"
              className="w-full bg-[#05101F] border border-gray-800 rounded-lg p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-1">
                Fecha Límite
              </label>
              <input
                type="date"
                required
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="w-full bg-[#05101F] border border-gray-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-1">
                Prioridad
              </label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as "low" | "medium" | "high")}
                className="w-full bg-[#05101F] border border-gray-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="high">Alta (Urgente)</option>
                <option value="medium">Media (Estándar)</option>
                <option value="low">Baja (Opcional)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Guardar Tarea
            </button>
          </div>
        </form>
      )}

      {/* Lista de Tareas */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="py-8 text-center text-gray-500 border border-dashed border-gray-800 rounded-xl">
            <Clock size={20} className="mx-auto mb-1.5 text-gray-600" />
            <p className="text-xs">No hay tareas pendientes en este caso.</p>
            <p className="text-[10px] text-gray-600 mt-0.5">Usa los botones superiores o añade una nueva.</p>
          </div>
        ) : (
          tasks.map((task) => {
            const isOverdue = isTaskOverdue(task);
            
            const priorityBadge = {
              high: "bg-red-500/10 text-red-400 border-red-500/30",
              medium: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
              low: "bg-gray-500/10 text-gray-400 border-gray-500/30",
            }[task.priority];

            const priorityLabel = {
              high: "Alta",
              medium: "Media",
              low: "Baja",
            }[task.priority];

            return (
              <div
                key={task.id}
                className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                  task.completed
                    ? "bg-[#0A182D]/30 border-gray-850 opacity-60"
                    : "bg-[#0A182D] border-gray-800 hover:border-gray-700"
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleTask(task.id)}
                    className="text-cyan-400 hover:text-cyan-300 shrink-0 cursor-pointer"
                  >
                    {task.completed ? (
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    ) : (
                      <Square size={18} className="text-gray-500 hover:text-cyan-400" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-semibold truncate ${
                        task.completed ? "line-through text-gray-500" : "text-white"
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                      <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${priorityBadge}`}>
                        {priorityLabel}
                      </span>
                      <span className={`flex items-center gap-1 ${isOverdue ? "text-red-400 font-bold" : "text-gray-400"}`}>
                        <Calendar size={11} />
                        <span>Vence: {task.dueDate}</span>
                        {isOverdue && <span className="text-[9px] uppercase font-black">(Vencida)</span>}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteTask(task.id)}
                  title="Eliminar tarea"
                  className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
