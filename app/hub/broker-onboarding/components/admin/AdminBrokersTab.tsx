"use client";

import { useState, useMemo } from "react";
import { Search, Mail, Phone, CheckCircle2, Loader2 } from "lucide-react";

export interface BrokerItem {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  tier: string;
  role: string;
  ghlConnected: boolean;
  ghlLocationId: string;
  createdAt: string;
  totalClients: number;
  totalVolume: number;
  pendingSyncCount: number;
}

interface AdminBrokersTabProps {
  brokers: BrokerItem[];
  loading: boolean;
}

export default function AdminBrokersTab({ brokers, loading }: AdminBrokersTabProps) {
  const [search, setSearch] = useState<string>("");

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return brokers;
    const q = search.toLowerCase();
    return brokers.filter(
      (b) =>
        b.displayName.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        b.uid.toLowerCase().includes(q) ||
        b.tier.toLowerCase().includes(q)
    );
  }, [brokers, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar broker por nombre, email o tier..."
            className="w-full bg-[#05101F] border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <p className="text-xs text-gray-400 self-end sm:self-center">
          Total: <span className="text-cyan-400 font-bold">{filtered.length}</span> brokers
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm flex items-center justify-center gap-3">
          <Loader2 size={18} className="animate-spin text-cyan-400" />
          <span>Cargando lista de brokers...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-gray-500 bg-[#0A182D]/40 border border-gray-800 rounded-2xl">
          No se encontraron brokers registrados.
        </div>
      ) : (
        <div className="bg-[#0A182D]/50 border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#05101F] text-gray-400 uppercase font-mono text-[10px] tracking-wider border-b border-gray-800">
                <tr>
                  <th className="p-4">Broker / Contacto</th>
                  <th className="p-4">Tier & Rol</th>
                  <th className="p-4">CRM GoHighLevel</th>
                  <th className="p-4 text-center">Clientes</th>
                  <th className="p-4 text-right">Volumen</th>
                  <th className="p-4 text-center">Fecha Alta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filtered.map((b) => (
                  <tr key={b.uid} className="hover:bg-[#05101F]/80 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-white text-sm">{b.displayName}</p>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Mail size={12} /> {b.email || "(sin email)"}
                      </p>
                      {b.phone && (
                        <p className="text-[11px] text-gray-500 flex items-center gap-1">
                          <Phone size={12} /> {b.phone}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="inline-block px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-md font-bold text-[10px]">
                        {b.tier}
                      </span>
                      {b.role === "admin" && (
                        <span className="ml-1 inline-block px-1.5 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-[9px] font-bold">
                          ADMIN
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {b.ghlConnected ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-md text-[10px] font-bold">
                          <CheckCircle2 size={12} /> Conectado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-800 text-gray-400 border border-gray-700 rounded-md text-[10px]">
                          Sin conectar
                        </span>
                      )}
                      {b.ghlLocationId && (
                        <p className="text-[9px] font-mono text-gray-500 mt-1 truncate max-w-[120px]">{b.ghlLocationId}</p>
                      )}
                    </td>
                    <td className="p-4 text-center font-bold text-white text-sm">
                      {b.totalClients}
                      {b.pendingSyncCount > 0 && (
                        <span className="block text-[10px] text-amber-400 font-mono">({b.pendingSyncCount} pend.)</span>
                      )}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-emerald-400 text-sm">
                      {formatMoney(b.totalVolume)}
                    </td>
                    <td className="p-4 text-center text-gray-500 font-mono text-[11px]">
                      {b.createdAt || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
