"use client";

import { useState, useEffect, useCallback } from "react";
import { DollarSign, Loader2, Save, CalendarDays } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

interface PayrollRow {
  staffUid: string;
  staffName: string;
  periodStart: string;
  periodEnd: string;
  hoursLogged: number;
  hourlyRate: number;
  expectedPay: number;
  actualPaid?: number;
  paidAt?: string;
  notes?: string;
}

function todayISODate() {
  return new Date().toISOString().split("T")[0];
}

// Lunes de hace 14 días — por defecto mostramos las últimas 2 semanas, el
// periodo quincenal más común, sin forzar al admin a escogerlo manualmente
// cada vez que abre la pestaña.
function defaultPeriodStart(): string {
  const d = new Date();
  d.setDate(d.getDate() - 14);
  return d.toISOString().split("T")[0];
}

const formatMoney = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(val);

export default function AdminPayrollTab() {
  const { user } = useAuth();
  const [periodStart, setPeriodStart] = useState(defaultPeriodStart());
  const [periodEnd, setPeriodEnd] = useState(todayISODate());
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savingUid, setSavingUid] = useState<string | null>(null);
  const [draftPaid, setDraftPaid] = useState<Record<string, string>>({});
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

  const fetchPayroll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/payroll?periodStart=${periodStart}&periodEnd=${periodEnd}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar nómina");
      setRows(data.rows || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [user, periodStart, periodEnd]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayroll();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchPayroll]);

  const handleSaveActualPaid = async (row: PayrollRow) => {
    if (!user) return;
    const raw = draftPaid[row.staffUid];
    const actualPaid = raw !== undefined ? Number(raw) : row.actualPaid;
    if (actualPaid === undefined || Number.isNaN(actualPaid)) return;

    setSavingUid(row.staffUid);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          staffUid: row.staffUid,
          periodStart,
          periodEnd,
          actualPaid,
          notes: draftNotes[row.staffUid] ?? row.notes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      setRows((prev) => prev.map((r) => (r.staffUid === row.staffUid ? { ...r, actualPaid: data.record.actualPaid, paidAt: data.record.paidAt, notes: data.record.notes } : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSavingUid(null);
    }
  };

  const totalExpected = rows.reduce((acc, r) => acc + r.expectedPay, 0);
  const totalActual = rows.reduce((acc, r) => acc + (r.actualPaid || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-extrabold text-white flex items-center gap-2">
          <DollarSign size={18} className="text-cyan-400" />
          Nómina de Staff por Hora
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Horas registradas × tarifa acordada, comparado contra lo realmente pagado. Solo incluye empleados con contrato &ldquo;Por Hora&rdquo;.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">{error}</div>
      )}

      <div className="flex flex-wrap items-end gap-3 p-4 rounded-2xl bg-[#0A182D]/60 border border-gray-800">
        <CalendarDays size={16} className="text-cyan-400 mb-2.5" />
        <div>
          <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Desde</label>
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="bg-[#05101F] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Hasta</label>
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="bg-[#05101F] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
          />
        </div>
        <button
          onClick={fetchPayroll}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold rounded-xl text-xs transition-colors"
        >
          Recalcular
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
          <span className="text-[10px] uppercase font-bold text-gray-400">Total esperado (periodo)</span>
          <p className="text-2xl font-black text-white mt-1">{formatMoney(totalExpected)}</p>
        </div>
        <div className="p-5 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
          <span className="text-[10px] uppercase font-bold text-gray-400">Total confirmado como pagado</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{formatMoney(totalActual)}</p>
        </div>
      </div>

      <div className="bg-[#0A182D]/50 border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm flex items-center justify-center gap-3">
            <Loader2 size={18} className="animate-spin text-cyan-400" />
            <span>Calculando nómina...</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-gray-500">No hay empleados con contrato por hora configurado todavía.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#05101F] text-gray-400 uppercase font-mono text-[10px] tracking-wider border-b border-gray-800">
                <tr>
                  <th className="p-4">Empleado</th>
                  <th className="p-4">Horas</th>
                  <th className="p-4">Tarifa</th>
                  <th className="p-4">Esperado</th>
                  <th className="p-4">Pagado</th>
                  <th className="p-4">Variación</th>
                  <th className="p-4">Notas</th>
                  <th className="p-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {rows.map((row) => {
                  const paidValue = draftPaid[row.staffUid] ?? (row.actualPaid != null ? String(row.actualPaid) : "");
                  const variance = row.actualPaid != null ? row.actualPaid - row.expectedPay : undefined;
                  return (
                    <tr key={row.staffUid} className="hover:bg-[#05101F]/80 transition-colors">
                      <td className="p-4 font-bold text-white">{row.staffName}</td>
                      <td className="p-4 font-mono">{row.hoursLogged.toFixed(1)}h</td>
                      <td className="p-4 font-mono">${row.hourlyRate.toFixed(2)}/hr</td>
                      <td className="p-4 font-bold text-white">{formatMoney(row.expectedPay)}</td>
                      <td className="p-4">
                        <input
                          type="number"
                          step="0.01"
                          value={paidValue}
                          onChange={(e) => setDraftPaid((prev) => ({ ...prev, [row.staffUid]: e.target.value }))}
                          placeholder="0.00"
                          className="w-24 bg-[#05101F] border border-gray-800 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-cyan-500"
                        />
                      </td>
                      <td className="p-4 font-bold">
                        {variance === undefined ? (
                          <span className="text-gray-500">—</span>
                        ) : (
                          <span className={variance === 0 ? "text-gray-400" : variance > 0 ? "text-emerald-400" : "text-red-400"}>
                            {variance > 0 ? "+" : ""}
                            {formatMoney(variance)}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <input
                          type="text"
                          value={draftNotes[row.staffUid] ?? row.notes ?? ""}
                          onChange={(e) => setDraftNotes((prev) => ({ ...prev, [row.staffUid]: e.target.value }))}
                          placeholder="Opcional"
                          className="w-32 bg-[#05101F] border border-gray-800 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-cyan-500"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleSaveActualPaid(row)}
                          disabled={savingUid === row.staffUid}
                          className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 mx-auto"
                        >
                          {savingUid === row.staffUid ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                          <span>Guardar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
