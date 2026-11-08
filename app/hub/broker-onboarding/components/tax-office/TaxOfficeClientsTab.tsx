"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Users, X } from "lucide-react";
import { TaxClient, TaxClientStatus, NewTaxClientInput } from "../../types";

interface TaxOfficeClientsTabProps {
  clients: TaxClient[];
  onAddClient: (input: NewTaxClientInput) => Promise<boolean>;
  onUpdateStatus: (clientId: string, status: TaxClientStatus) => void;
}

const STATUS_TABS: { id: TaxClientStatus | "all"; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "lead", label: "Lead" },
  { id: "active", label: "Activo" },
  { id: "pending", label: "Pendiente" },
  { id: "waiting_docs", label: "Esperando Docs" },
  { id: "in_review", label: "En Revisión" },
  { id: "completed", label: "Completado" },
  { id: "inactive", label: "Inactivo" },
  { id: "archived", label: "Archivado" },
];

function statusBadge(status: TaxClientStatus) {
  switch (status) {
    case "lead":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "active":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "pending":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "waiting_docs":
      return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    case "in_review":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "completed":
      return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    case "inactive":
      return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    case "archived":
      return "bg-gray-700/20 text-gray-500 border-gray-700/40";
    default:
      return "bg-gray-500/10 text-gray-400 border-gray-500/20";
  }
}

function statusLabel(status: TaxClientStatus) {
  return STATUS_TABS.find((t) => t.id === status)?.label || status;
}

export default function TaxOfficeClientsTab({ clients, onAddClient, onUpdateStatus }: TaxOfficeClientsTabProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaxClientStatus | "all">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<TaxClient | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<TaxClientStatus>("lead");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [clients, search, statusFilter]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    const success = await onAddClient({ name: name.trim(), email: email.trim(), phone: phone.trim(), status, notes: notes.trim() });
    setIsSubmitting(false);
    if (success) {
      setIsModalOpen(false);
      setName("");
      setEmail("");
      setPhone("");
      setStatus("lead");
      setNotes("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-[#0A182D]/80 border border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, correo o teléfono..."
              className="w-full bg-[#05101F] border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60"
            />
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,224,240,0.3)] flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
        >
          <Plus size={16} />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors shrink-0 cursor-pointer ${
              statusFilter === tab.id
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-400"
                : "bg-[#05101F] text-gray-400 border-gray-800 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6 rounded-2xl bg-[#0A182D]/80 border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                <th className="py-3 pl-2">Cliente</th>
                <th className="py-3">Contacto</th>
                <th className="py-3">Estado</th>
                <th className="py-3 text-right pr-2">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
                        <Users size={22} />
                      </div>
                      <p className="text-white font-bold text-sm">No tienes clientes registrados aún</p>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        Registra a tus clientes fiscales aquí para poder vincularlos a casos, facturas, tareas y citas.
                      </p>
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-extrabold text-xs rounded-xl shadow-[0_0_15px_rgba(0,224,240,0.25)] cursor-pointer inline-flex items-center gap-1.5 transition-all"
                      >
                        <Plus size={14} />
                        <span>Crear Primer Cliente</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500 italic">
                    No se encontraron clientes que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredClients.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-900/40 transition-colors group">
                    <td className="py-3.5 pl-2 font-bold text-white group-hover:text-cyan-300 transition-colors">{c.name}</td>
                    <td className="py-3.5 text-gray-300">
                      <div>{c.email || "—"}</div>
                      <div className="text-[10px] text-gray-500">{c.phone || "—"}</div>
                    </td>
                    <td className="py-3.5">
                      <span className={`inline-flex text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge(c.status)}`}>
                        {statusLabel(c.status)}
                      </span>
                    </td>
                    <td className="py-3.5 text-right pr-2">
                      <button
                        onClick={() => setSelectedClient(c)}
                        className="px-3 py-1.5 text-xs font-semibold text-cyan-400 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg transition-colors cursor-pointer"
                      >
                        Gestionar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0A182D] border border-cyan-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[#05101F]">
              <h3 className="font-bold text-sm text-white">Nuevo Cliente</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateClient} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Nombre completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Roberto Silva"
                  className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@gmail.com"
                  className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (305) 555-0100"
                  className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Estado</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaxClientStatus)}
                  className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                >
                  {STATUS_TABS.filter((t) => t.id !== "all").map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Notas (opcional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none resize-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-700 text-gray-300 rounded-xl font-semibold hover:bg-gray-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-cyan-500 text-black font-extrabold rounded-xl hover:bg-cyan-400 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Creando..." : "Crear Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0A182D] border border-cyan-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[#05101F]">
              <h3 className="font-extrabold text-base text-white">{selectedClient.name}</h3>
              <button onClick={() => setSelectedClient(null)} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs text-gray-300">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#05101F] border border-gray-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-500">Correo</span>
                  <p className="text-white font-medium mt-0.5 truncate">{selectedClient.email || "—"}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-500">Teléfono</span>
                  <p className="text-white font-medium mt-0.5">{selectedClient.phone || "—"}</p>
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Cambiar Estado</span>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {STATUS_TABS.filter((t) => t.id !== "all").map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onUpdateStatus(selectedClient.id, t.id as TaxClientStatus);
                        setSelectedClient((prev) => (prev ? { ...prev, status: t.id as TaxClientStatus } : null));
                      }}
                      className={`p-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        selectedClient.status === t.id
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 ring-1 ring-cyan-400"
                          : "bg-gray-900/40 text-gray-400 border-gray-800 hover:border-gray-700"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              {selectedClient.notes && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-500">Notas</span>
                  <p className="mt-1 text-xs text-gray-300 bg-[#05101F] p-3 rounded-xl border border-gray-800 leading-relaxed">{selectedClient.notes}</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-800 bg-[#05101F] flex justify-end">
              <button onClick={() => setSelectedClient(null)} className="px-5 py-2 rounded-xl bg-cyan-500 text-black font-extrabold text-xs cursor-pointer">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
