"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  UserCheck,
  UserPlus,
  Search,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Layers,
  Key
} from "lucide-react";

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  allowedClusters: string[];
  permissions: string[];
  color: string;
}

export interface TeamMember {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  role: string;
  roleDetails?: RoleDefinition;
  updatedAt?: string;
}

export interface CandidateUser {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  tier: string;
  role: string;
}

interface AdminRolesTabProps {
  teamMembers: TeamMember[];
  roleDefinitions: RoleDefinition[];
  allBrokers: CandidateUser[];
  loading: boolean;
  onRefresh: () => void;
}

export default function AdminRolesTab({
  teamMembers,
  roleDefinitions,
  allBrokers,
  loading,
  onRefresh,
}: AdminRolesTabProps) {
  const [search, setSearch] = useState<string>("");
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<CandidateUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("underwriter_mca");
  const [userSearch, setUserSearch] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  const filteredTeam = useMemo(() => {
    if (!search.trim()) return teamMembers;
    const q = search.toLowerCase();
    return teamMembers.filter(
      (m) =>
        m.displayName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.roleDetails?.name || "").toLowerCase().includes(q)
    );
  }, [teamMembers, search]);

  const candidateList = useMemo(() => {
    if (!userSearch.trim()) return allBrokers.slice(0, 10);
    const q = userSearch.toLowerCase();
    return allBrokers.filter(
      (b) =>
        b.displayName.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [allBrokers, userSearch]);

  const handleAssignRole = async () => {
    if (!selectedUser) {
      setErrorMsg("Selecciona un usuario de la lista.");
      return;
    }
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUid: selectedUser.uid,
          role: selectedRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al asignar rol");

      setSuccessMsg(`Rol asignado correctamente a ${selectedUser.displayName}.`);
      setModalOpen(false);
      setSelectedUser(null);
      onRefresh();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (roleId: string, roleDef?: RoleDefinition) => {
    const color = roleDef?.color || "gray";
    switch (color) {
      case "purple":
        return <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-bold font-mono">👑 SuperAdmin</span>;
      case "blue":
        return <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-bold font-mono">💳 Underwriter MCA</span>;
      case "emerald":
        return <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold font-mono">🏠 Real Estate Specialist</span>;
      case "cyan":
        return <span className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-bold font-mono">🛡️ Seguros Specialist</span>;
      case "amber":
        return <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold font-mono">🏢 Taxes & Corp Specialist</span>;
      case "indigo":
        return <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-bold font-mono">🎧 Soporte & Ops</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-800 text-gray-300 border border-gray-700 rounded-lg text-xs font-bold font-mono">{roleId}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con botón para asignar nuevo rol */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <ShieldCheck size={18} className="text-cyan-400" />
            <span>Matriz de Roles & Equipo E360</span>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Control de permisos y asignación de empleados por vertical de negocio.
          </p>
        </div>

        <button
          onClick={() => { setModalOpen(true); setErrorMsg(""); }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold rounded-xl text-xs transition-colors shadow-[0_0_15px_rgba(0,224,240,0.2)]"
        >
          <UserPlus size={15} />
          <span>Asignar Rol a Empleado</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <p className="text-xs text-emerald-300">{successMsg}</p>
        </div>
      )}

      {/* Catálogo de Roles Disponibles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roleDefinitions.filter((r) => r.id !== "broker").map((r) => (
          <div
            key={r.id}
            className="bg-[#0A182D]/60 border border-gray-800 rounded-2xl p-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-white text-xs">{r.name}</h4>
                <Key size={14} className="text-cyan-400" />
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">{r.description}</p>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-800 text-[10px] text-gray-500 font-mono">
              Vertical: <span className="text-gray-300">{r.allowedClusters.join(", ") || "Todas"}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla de Miembros del Equipo Activos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            Personal con Permisos Especiales ({filteredTeam.length})
          </h4>
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar por nombre o email..."
              className="w-full bg-[#05101F] border border-gray-800 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm flex items-center justify-center gap-3">
            <Loader2 size={18} className="animate-spin text-cyan-400" />
            <span>Cargando roles de equipo...</span>
          </div>
        ) : filteredTeam.length === 0 ? (
          <div className="py-12 text-center text-gray-500 bg-[#0A182D]/40 border border-gray-800 rounded-2xl">
            No hay empleados asignados con roles especiales aún.
          </div>
        ) : (
          <div className="bg-[#0A182D]/50 border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#05101F] text-gray-400 uppercase font-mono text-[10px] tracking-wider border-b border-gray-800">
                  <tr>
                    <th className="p-4">Miembro del Equipo</th>
                    <th className="p-4">Rol Asignado</th>
                    <th className="p-4">Verticales Permitidas</th>
                    <th className="p-4 text-center">Fecha Actualización</th>
                    <th className="p-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {filteredTeam.map((m) => (
                    <tr key={m.uid} className="hover:bg-[#05101F]/80 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-white text-sm">{m.displayName}</p>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Mail size={12} /> {m.email || "(sin email)"}
                        </p>
                      </td>
                      <td className="p-4">
                        {getRoleBadge(m.role, m.roleDetails)}
                      </td>
                      <td className="p-4 font-mono text-[11px] text-gray-400">
                        {m.roleDetails?.allowedClusters.join(", ") || "Acceso Total"}
                      </td>
                      <td className="p-4 text-center font-mono text-gray-500 text-[11px]">
                        {m.updatedAt ? new Date(m.updatedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedUser({
                              uid: m.uid,
                              displayName: m.displayName,
                              email: m.email,
                              phone: m.phone,
                              tier: "Team",
                              role: m.role,
                            });
                            setSelectedRole(m.role);
                            setModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-bold transition-colors"
                        >
                          Cambiar Rol
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal para Asignar Rol */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0A182D] border border-cyan-500/40 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-6 relative overflow-hidden"
            >
              <div className="flex items-start justify-between border-b border-gray-800 pb-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
                    Asignación de Permisos
                  </span>
                  <h3 className="text-xl font-extrabold text-white mt-1">Configurar Rol de Empleado</h3>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
                  {errorMsg}
                </div>
              )}

              {/* Paso 1: Seleccionar Usuario */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-300 uppercase">
                  1. Buscar Usuario / Broker
                </label>
                {selectedUser ? (
                  <div className="p-3 bg-[#05101F] border border-cyan-500/40 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-xs">{selectedUser.displayName}</p>
                      <p className="text-[11px] text-gray-400">{selectedUser.email}</p>
                    </div>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="text-xs text-red-400 hover:underline font-bold"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Buscar por nombre o correo..."
                      className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                    />
                    <div className="max-h-36 overflow-y-auto space-y-1 bg-[#05101F] p-2 rounded-xl border border-gray-800 divide-y divide-gray-900">
                      {candidateList.map((b) => (
                        <div
                          key={b.uid}
                          onClick={() => setSelectedUser(b)}
                          className="p-2 hover:bg-[#0A182D] rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <p className="font-bold text-white">{b.displayName}</p>
                            <p className="text-[11px] text-gray-400">{b.email}</p>
                          </div>
                          <span className="text-[10px] text-cyan-400 font-mono">{b.role || "broker"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Paso 2: Seleccionar Rol */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-300 uppercase">
                  2. Asignar Nivel de Rol
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="admin">👑 SuperAdmin / Director (Acceso Total)</option>
                  <option value="underwriter_mca">💳 Underwriter Fondeo MCA (James / Cliq)</option>
                  <option value="specialist_real_estate">🏠 Especialista Real Estate & Hipotecas</option>
                  <option value="specialist_insurance">🛡️ Especialista de Seguros</option>
                  <option value="specialist_corporate">🏢 Especialista Corporativo & Taxes (RL)</option>
                  <option value="support_agent">🎧 Agente de Soporte & Operaciones</option>
                  <option value="broker">👤 Broker Estándar (Revocar permisos especiales)</option>
                </select>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAssignRole}
                  disabled={submitting || !selectedUser}
                  className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl text-xs font-extrabold transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(0,224,240,0.3)] disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                  <span>{submitting ? "Guardando..." : "Confirmar Rol"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
