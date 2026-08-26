"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Search,
  RefreshCw,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Mail,
  Phone,
  Copy,
  Check,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

interface AdminLocation {
  id: string;
  name: string;
  state: string;
  country: string;
  timezone: string;
  email: string;
  phone: string;
}

const PAGE_SIZE = 50;

export default function AdminPanelSection() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLocations = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/locations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al cargar las subcuentas.");
      }
      setLocations(data.locations || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchLocations, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return locations;
    const q = searchQuery.toLowerCase();
    return locations.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q) ||
        (l.state || "").toLowerCase().includes(q) ||
        (l.email || "").toLowerCase().includes(q)
    );
  }, [locations, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Building2 size={24} className="text-cyan-400" />
            Panel Admin 360
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Visibilidad total de las subcuentas de la agencia E360 en GoHighLevel.
          </p>
        </div>
        <button
          onClick={fetchLocations}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold rounded-xl text-xs transition-colors shrink-0 shadow-[0_0_15px_rgba(0,224,240,0.15)] disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          <span>{loading ? "Cargando..." : "Actualizar"}</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0A182D]/50 border border-gray-800/80 rounded-2xl p-5">
          <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Total subcuentas</p>
          <p className="text-3xl font-extrabold text-white mt-1">{locations.length}</p>
        </div>
        <div className="bg-[#0A182D]/50 border border-gray-800/80 rounded-2xl p-5">
          <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Filtradas</p>
          <p className="text-3xl font-extrabold text-cyan-400 mt-1">{filtered.length}</p>
        </div>
        <div className="bg-[#0A182D]/50 border border-gray-800/80 rounded-2xl p-5">
          <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Página</p>
          <p className="text-3xl font-extrabold text-white mt-1">
            {currentPage}<span className="text-gray-500 text-lg"> / {totalPages}</span>
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          placeholder="Buscar por nombre, Location ID, estado o email..."
          className="w-full bg-[#0A182D]/80 border border-gray-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && locations.length === 0 && (
        <div className="bg-[#0A182D]/30 border border-gray-800/80 rounded-3xl p-16 text-center">
          <Loader2 size={36} className="mx-auto text-cyan-400 animate-spin mb-3" />
          <p className="text-sm text-gray-400">Cargando subcuentas de la agencia...</p>
        </div>
      )}

      {/* Table */}
      {!loading && pageItems.length > 0 && (
        <div className="bg-[#0A182D]/40 border border-gray-800/80 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-800/80 bg-[#05101F]/60">
                  <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-bold">Subcuenta</th>
                  <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-bold">Ubicación</th>
                  <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-bold">Contacto</th>
                  <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-bold">Location ID</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((loc) => (
                  <motion.tr
                    key={loc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-gray-900/60 hover:bg-[#0A182D]/70 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-white">{loc.name}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="flex items-center gap-1.5 text-gray-400 text-xs">
                        <MapPin size={13} className="text-gray-500" />
                        {[loc.state, loc.country].filter(Boolean).join(", ") || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5 text-xs">
                        {loc.email && (
                          <p className="flex items-center gap-1.5 text-gray-400">
                            <Mail size={12} className="text-gray-500" /> {loc.email}
                          </p>
                        )}
                        {loc.phone && (
                          <p className="flex items-center gap-1.5 text-gray-400">
                            <Phone size={12} className="text-gray-500" /> {loc.phone}
                          </p>
                        )}
                        {!loc.email && !loc.phone && <span className="text-gray-600">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => copyId(loc.id)}
                        className="flex items-center gap-1.5 font-mono text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <span className="max-w-[140px] truncate">{loc.id}</span>
                        {copiedId === loc.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} className="text-gray-500" />}
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800/80 bg-[#05101F]/40">
            <p className="text-xs text-gray-500">
              Mostrando {pageItems.length} de {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-2 rounded-lg bg-[#0A182D] border border-gray-800 text-gray-400 hover:text-white disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-lg bg-[#0A182D] border border-gray-800 text-gray-400 hover:text-white disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && locations.length > 0 && (
        <div className="bg-[#0A182D]/30 border border-gray-800/80 rounded-3xl p-12 text-center">
          <AlertCircle size={36} className="mx-auto text-gray-600 mb-3" />
          <p className="text-sm text-gray-400">Sin resultados para esa búsqueda.</p>
        </div>
      )}
    </div>
  );
}
