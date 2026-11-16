"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Clock, Plus, DollarSign, CalendarClock } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { TimeEntry } from "../types";

function todayISODate() {
  return new Date().toISOString().split("T")[0];
}

// Lunes de la semana calendario a la que pertenece `dateStr` (YYYY-MM-DD) —
// función de módulo para que el linter de pureza de React no trate new Date()
// como parte del render, igual que el resto de generadores de fecha del Hub.
function startOfWeek(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // domingo (0) retrocede 6 días hasta el lunes anterior
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

function startOfMonth(dateStr: string): string {
  return `${dateStr.slice(0, 7)}-01`;
}

const formatMoney = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(val);

export default function MisHorasSection() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [contractType, setContractType] = useState<string | undefined>(undefined);
  const [hourlyRateUSD, setHourlyRateUSD] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState(todayISODate());
  const [hoursWorked, setHoursWorked] = useState<number | "">("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadEntries = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/staff/time-entries", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        setEntries(data.entries || []);
        setContractType(data.contractType);
        setHourlyRateUSD(data.hourlyRateUSD);
      }
    } catch (err) {
      console.error("Error cargando mis horas:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEntries();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || hoursWorked === "" || Number(hoursWorked) <= 0) return;
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/staff/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date, hoursWorked: Number(hoursWorked), note: note.trim() || undefined })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al registrar horas");
      setEntries((prev) => [data.entry, ...prev]);
      setHoursWorked("");
      setNote("");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = todayISODate();
  const weekStart = startOfWeek(today);
  const monthStart = startOfMonth(today);

  const hoursThisWeek = useMemo(() => entries.filter((e) => e.date >= weekStart).reduce((acc, e) => acc + e.hoursWorked, 0), [entries, weekStart]);
  const hoursThisMonth = useMemo(() => entries.filter((e) => e.date >= monthStart).reduce((acc, e) => acc + e.hoursWorked, 0), [entries, monthStart]);
  const isHourly = contractType === "hourly" && typeof hourlyRateUSD === "number";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <Clock size={20} className="text-cyan-400" />
          Mis Horas
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">Registra tus horas trabajadas y consulta tu estimado de pago.</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
          <span className="text-[10px] uppercase font-bold text-gray-400">Esta semana</span>
          <p className="text-2xl font-black text-white mt-1">{hoursThisWeek.toFixed(1)}h</p>
        </div>
        <div className="p-5 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
          <span className="text-[10px] uppercase font-bold text-gray-400">Este mes</span>
          <p className="text-2xl font-black text-white mt-1">{hoursThisMonth.toFixed(1)}h</p>
        </div>
        <div className="p-5 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
          <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1.5">
            <DollarSign size={12} />
            Estimado de esta semana
          </span>
          {isHourly ? (
            <>
              <p className="text-2xl font-black text-emerald-400 mt-1">{formatMoney(hoursThisWeek * (hourlyRateUSD as number))}</p>
              <span className="text-[11px] text-gray-500">${hourlyRateUSD}/hr × {hoursThisWeek.toFixed(1)}h</span>
            </>
          ) : (
            <p className="text-xs text-gray-500 italic mt-2">
              {contractType ? "No aplica — contrato no es por hora." : "Tu tarifa por hora aún no está configurada."}
            </p>
          )}
        </div>
      </div>

      {/* Formulario de registro */}
      <div className="p-6 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-white mb-4">Registrar horas de hoy</h3>
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">{errorMsg}</div>
        )}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Fecha</label>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Horas trabajadas</label>
            <input
              type="number"
              min="0.25"
              max="24"
              step="0.25"
              required
              value={hoursWorked}
              onChange={(e) => setHoursWorked(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="8"
              className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white outline-none"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Nota (opcional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. soporte de clientes"
              className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,224,240,0.3)] flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Plus size={16} />
            <span>{isSubmitting ? "Guardando..." : "Registrar"}</span>
          </button>
        </form>
      </div>

      {/* Historial */}
      <div className="p-6 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
          <CalendarClock size={14} className="text-cyan-400" />
          Mi historial
        </h3>
        {loading ? (
          <p className="text-xs text-gray-500 italic py-4 text-center">Cargando...</p>
        ) : entries.length === 0 ? (
          <p className="text-xs text-gray-500 italic py-4 text-center">Todavía no has registrado horas.</p>
        ) : (
          <div className="divide-y divide-gray-800/60">
            {entries.map((entry) => (
              <div key={entry.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">{entry.date}</p>
                  {entry.note && <p className="text-xs text-gray-400 truncate">{entry.note}</p>}
                </div>
                <span className="text-sm font-black text-cyan-400 shrink-0">{entry.hoursWorked}h</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
