"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, Pencil, RotateCcw, X, Save, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export interface AdminServiceItem {
  id: string;
  title: string;
  category: "financial" | "professional";
  centralDepartment: string;
  pipelineCluster: string;
  status: "active" | "delay" | "paused" | "upcoming";
  statusLabel: string;
  description: string;
  requirements: string[];
  process: string[];
  timeframe: string;
  comission: string;
  formLink: string;
  supportPhone: string;
  supportPhoneFormatted: string;
  updatedAt?: string;
  updatedByName?: string;
}

interface EditForm {
  title: string;
  description: string;
  requirements: string;
  process: string;
  timeframe: string;
  comission: string;
  formLink: string;
  supportPhone: string;
  supportPhoneFormatted: string;
  status: AdminServiceItem["status"];
  statusLabel: string;
}

const STATUS_OPTIONS: { value: AdminServiceItem["status"]; label: string }[] = [
  { value: "active", label: "Activo" },
  { value: "delay", label: "Con Retraso" },
  { value: "paused", label: "Pausado" },
  { value: "upcoming", label: "Próximamente" }
];

function toForm(service: AdminServiceItem): EditForm {
  return {
    title: service.title,
    description: service.description,
    requirements: service.requirements.join("\n"),
    process: service.process.join("\n"),
    timeframe: service.timeframe,
    comission: service.comission,
    formLink: service.formLink,
    supportPhone: service.supportPhone,
    supportPhoneFormatted: service.supportPhoneFormatted,
    status: service.status,
    statusLabel: service.statusLabel
  };
}

export default function AdminServicesTab() {
  const { user } = useAuth();
  const [services, setServices] = useState<AdminServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminServiceItem | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/services", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setServices(data.services || []);
    } catch (err) {
      console.error("Error cargando catálogo de servicios:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchServices();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchServices]);

  const filtered = services.filter((s) =>
    !search.trim() ||
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.id.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (service: AdminServiceItem) => {
    setEditing(service);
    setForm(toForm(service));
    setError("");
  };

  const handleSave = async () => {
    if (!user || !editing || !form) return;
    setSaving(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          serviceId: editing.id,
          override: {
            title: form.title,
            description: form.description,
            requirements: form.requirements.split("\n").map((r) => r.trim()).filter(Boolean),
            process: form.process.split("\n").map((p) => p.trim()).filter(Boolean),
            timeframe: form.timeframe,
            comission: form.comission,
            formLink: form.formLink,
            supportPhone: form.supportPhone,
            supportPhoneFormatted: form.supportPhoneFormatted,
            status: form.status,
            statusLabel: form.statusLabel
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      setEditing(null);
      setForm(null);
      await fetchServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (serviceId: string) => {
    if (!user) return;
    setRestoringId(serviceId);
    try {
      const token = await user.getIdToken();
      await fetch(`/api/admin/services?serviceId=${serviceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchServices();
    } catch (err) {
      console.error("Error restaurando servicio:", err);
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar servicio por nombre o id..."
            className="w-full bg-[#05101F] border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <p className="text-xs text-gray-400 self-end sm:self-center">
          Total: <span className="text-cyan-400 font-bold">{filtered.length}</span> servicios
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm flex items-center justify-center gap-3">
          <Loader2 size={18} className="animate-spin text-cyan-400" />
          <span>Cargando catálogo...</span>
        </div>
      ) : (
        <div className="bg-[#0A182D]/50 border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#05101F] text-gray-400 uppercase font-mono text-[10px] tracking-wider border-b border-gray-800">
                <tr>
                  <th className="p-4">Servicio</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Comisión</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-[#05101F]/80 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-white text-sm">{s.title}</p>
                      <p className="text-[10px] font-mono text-gray-500">{s.id}</p>
                      {s.updatedAt && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded text-[9px] font-bold">
                          EDITADO {s.updatedByName ? `· ${s.updatedByName}` : ""}
                        </span>
                      )}
                    </td>
                    <td className="p-4 capitalize">{s.category === "financial" ? "Financiero" : "Profesional"}</td>
                    <td className="p-4">{STATUS_OPTIONS.find((o) => o.value === s.status)?.label || s.status}</td>
                    <td className="p-4 text-emerald-400 font-semibold">{s.comission}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(s)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-[10px] font-bold transition-colors"
                        >
                          <Pencil size={12} />
                          Editar
                        </button>
                        {s.updatedAt && (
                          <button
                            onClick={() => handleRestore(s.id)}
                            disabled={restoringId === s.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg text-[10px] font-bold disabled:opacity-50"
                          >
                            {restoringId === s.id ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                            Restaurar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && form && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0A182D] border border-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#0A182D] border-b border-gray-800 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Editar Servicio</h2>
                <p className="text-sm text-gray-400 mt-1">{editing.title} · {editing.id}</p>
              </div>
              <button onClick={() => { setEditing(null); setForm(null); }} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Título</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-[#05101F] border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Descripción</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-[#05101F] border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Requisitos (uno por línea)</label>
                  <textarea
                    rows={4}
                    value={form.requirements}
                    onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                    className="w-full bg-[#05101F] border border-gray-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Proceso (uno por línea)</label>
                  <textarea
                    rows={4}
                    value={form.process}
                    onChange={(e) => setForm({ ...form, process: e.target.value })}
                    className="w-full bg-[#05101F] border border-gray-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Tiempo Estimado</label>
                  <input
                    type="text"
                    value={form.timeframe}
                    onChange={(e) => setForm({ ...form, timeframe: e.target.value })}
                    className="w-full bg-[#05101F] border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Comisión</label>
                  <input
                    type="text"
                    value={form.comission}
                    onChange={(e) => setForm({ ...form, comission: e.target.value })}
                    className="w-full bg-[#05101F] border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Enlace del Formulario</label>
                <input
                  type="text"
                  value={form.formLink}
                  onChange={(e) => setForm({ ...form, formLink: e.target.value })}
                  className="w-full bg-[#05101F] border border-gray-700 rounded-lg p-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Teléfono de Soporte</label>
                  <input
                    type="text"
                    value={form.supportPhone}
                    onChange={(e) => setForm({ ...form, supportPhone: e.target.value })}
                    className="w-full bg-[#05101F] border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Teléfono (formato display)</label>
                  <input
                    type="text"
                    value={form.supportPhoneFormatted}
                    onChange={(e) => setForm({ ...form, supportPhoneFormatted: e.target.value })}
                    className="w-full bg-[#05101F] border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Estado</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as AdminServiceItem["status"] })}
                    className="w-full bg-[#05101F] border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Etiqueta de Estado</label>
                  <input
                    type="text"
                    value={form.statusLabel}
                    onChange={(e) => setForm({ ...form, statusLabel: e.target.value })}
                    className="w-full bg-[#05101F] border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setEditing(null); setForm(null); }}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
