"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Loader2, Mail, Phone, MapPin, Copy, Check, ChevronLeft, ChevronRight } from "lucide-react";

export interface AdminLocation {
  id: string;
  name: string;
  state: string;
  country: string;
  timezone: string;
  email: string;
  phone: string;
}

interface AdminLocationsTabProps {
  locations: AdminLocation[];
  loading: boolean;
}

const PAGE_SIZE = 50;

export default function AdminLocationsTab({ locations, loading }: AdminLocationsTabProps) {
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return locations;
    const q = search.toLowerCase();
    return locations.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q) ||
        (l.state || "").toLowerCase().includes(q) ||
        (l.email || "").toLowerCase().includes(q)
    );
  }, [locations, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0A182D]/50 border border-gray-800/80 rounded-2xl p-5">
          <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Total Subcuentas GHL</p>
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

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar por nombre, Location ID, estado o email..."
          className="w-full bg-[#0A182D]/80 border border-gray-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
        />
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm flex items-center justify-center gap-3">
          <Loader2 size={18} className="animate-spin text-cyan-400" />
          <span>Cargando subcuentas desde GoHighLevel...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-gray-500 bg-[#0A182D]/40 border border-gray-800 rounded-2xl">
          No se encontraron subcuentas en la agencia.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pageItems.map((loc) => (
              <motion.div
                key={loc.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0A182D]/60 border border-gray-800/80 hover:border-cyan-500/30 rounded-2xl p-5 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-extrabold text-white text-base leading-snug">{loc.name}</h3>
                    <button
                      onClick={() => copyId(loc.id)}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-cyan-400 border border-gray-800 rounded-lg text-[10px] font-mono transition-colors shrink-0"
                      title="Copiar Location ID"
                    >
                      {copiedId === loc.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{loc.id.substring(0, 8)}...</span>
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-400 mt-3">
                    {loc.email && (
                      <p className="flex items-center gap-2 truncate">
                        <Mail size={13} className="text-gray-500 shrink-0" />
                        <span className="truncate">{loc.email}</span>
                      </p>
                    )}
                    {loc.phone && (
                      <p className="flex items-center gap-2">
                        <Phone size={13} className="text-gray-500 shrink-0" />
                        <span>{loc.phone}</span>
                      </p>
                    )}
                    {(loc.state || loc.country) && (
                      <p className="flex items-center gap-2">
                        <MapPin size={13} className="text-gray-500 shrink-0" />
                        <span>{[loc.state, loc.country].filter(Boolean).join(", ")}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-900 text-[10px] text-gray-500 font-mono">
                  Location ID: <span className="text-gray-400 select-all">{loc.id}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-800 text-xs text-gray-400">
              <p>
                Mostrando {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, filtered.length)} de {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="font-mono text-cyan-400 font-bold px-2">{currentPage} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
