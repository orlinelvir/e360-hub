"use client";

import { Loader2, MessageSquare, Edit3, Ticket, MapPin, AlertTriangle } from "lucide-react";

export interface StaffActivityItem {
  uid: string;
  name: string;
  email: string;
  role: string;
  lastLogin?: { at: string; city?: string; region?: string; country?: string } | null;
  caseNotes: number;
  statusChanges: number;
  ticketReplies: number;
}

export interface BacklogByCluster {
  [cluster: string]: { pendingDocs: number; inReview: number; staleCases: string[] };
}

interface AdminStaffActivityTabProps {
  staff: StaffActivityItem[];
  backlogByCluster: BacklogByCluster;
  windowDays: number;
  loading: boolean;
  onChangeWindow: (days: number) => void;
}

const CLUSTER_LABELS: Record<string, string> = {
  fondeo_rapido: "Fondeo Rápido",
  real_estate: "Real Estate & Hipotecas",
  credit_repair: "Reparación de Crédito",
  seguros: "Seguros & Pólizas",
  corporativo: "Corporativo (LLC, Taxes)"
};

export default function AdminStaffActivityTab({ staff, backlogByCluster, windowDays, loading, onChangeWindow }: AdminStaffActivityTabProps) {
  const formatLastLogin = (login: StaffActivityItem["lastLogin"]) => {
    if (!login?.at) return "Sin registro";
    const date = new Date(login.at).toLocaleString("es-US", { dateStyle: "medium", timeStyle: "short" });
    const location = [login.city, login.region, login.country].filter(Boolean).join(", ") || "Ubicación desconocida";
    return { date, location };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Actividad del Staff</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Notas de caso, cambios de estado y respuestas de ticket reales dentro del Hub — complementa (no reemplaza) otras métricas como llamadas.
          </p>
        </div>
        <select
          value={windowDays}
          onChange={(e) => onChangeWindow(Number(e.target.value))}
          className="bg-[#05101F] border border-gray-800 rounded-xl py-2 px-3 text-xs text-gray-300 focus:outline-none focus:border-cyan-500"
        >
          <option value={7}>Últimos 7 días</option>
          <option value={30}>Últimos 30 días</option>
          <option value={90}>Últimos 90 días</option>
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm flex items-center justify-center gap-3">
          <Loader2 size={18} className="animate-spin text-cyan-400" />
          <span>Cargando actividad...</span>
        </div>
      ) : (
        <>
          <div className="bg-[#0A182D]/50 border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#05101F] text-gray-400 uppercase font-mono text-[10px] tracking-wider border-b border-gray-800">
                  <tr>
                    <th className="p-4">Staff</th>
                    <th className="p-4 text-center"><MessageSquare size={12} className="inline mr-1" />Notas</th>
                    <th className="p-4 text-center"><Edit3 size={12} className="inline mr-1" />Cambios de Estado</th>
                    <th className="p-4 text-center"><Ticket size={12} className="inline mr-1" />Respuestas Ticket</th>
                    <th className="p-4">Último Inicio de Sesión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {staff.map((s) => {
                    const login = formatLastLogin(s.lastLogin);
                    return (
                      <tr key={s.uid} className="hover:bg-[#05101F]/80 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-white text-sm">{s.name}</p>
                          <p className="text-[11px] text-gray-500">{s.email} · {s.role}</p>
                        </td>
                        <td className="p-4 text-center font-mono font-bold text-white">{s.caseNotes}</td>
                        <td className="p-4 text-center font-mono font-bold text-white">{s.statusChanges}</td>
                        <td className="p-4 text-center font-mono font-bold text-white">{s.ticketReplies}</td>
                        <td className="p-4">
                          {typeof login === "string" ? (
                            <span className="text-gray-500">{login}</span>
                          ) : (
                            <div>
                              <span className="text-gray-300">{login.date}</span>
                              <span className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                                <MapPin size={11} /> {login.location}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {Object.keys(backlogByCluster).length > 0 && (
            <div className="bg-[#0A182D]/50 border border-gray-800 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-400" /> Backlog Actual por Vertical
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(backlogByCluster).map(([cluster, data]) => (
                  <div key={cluster} className="bg-[#05101F] border border-gray-800 rounded-xl p-3 text-xs">
                    <p className="font-bold text-white mb-1">{CLUSTER_LABELS[cluster] || cluster}</p>
                    <p className="text-gray-400">Pendiente de Documentos: <span className="text-white font-bold">{data.pendingDocs}</span></p>
                    <p className="text-gray-400">En Revisión: <span className="text-white font-bold">{data.inReview}</span></p>
                    {data.staleCases.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-800">
                        <p className="text-[10px] text-amber-400 font-bold uppercase mb-1">Atrasados (&gt;3 días)</p>
                        {data.staleCases.map((c, i) => (
                          <p key={i} className="text-[11px] text-gray-500">{c}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
