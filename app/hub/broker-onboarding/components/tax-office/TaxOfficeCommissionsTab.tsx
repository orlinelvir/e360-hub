"use client";

import { useMemo, useState } from "react";
import { Download, CheckCircle2, Clock, Plus, FileText } from "lucide-react";
import { TaxCommissionItem, NewTaxCommissionInput } from "../../types";
import NewTaxCommissionModal from "./NewTaxCommissionModal";

interface TaxOfficeCommissionsTabProps {
  commissions: TaxCommissionItem[];
  onAddCommission: (input: NewTaxCommissionInput) => Promise<boolean>;
}

type SubView = "report" | "1099";

export default function TaxOfficeCommissionsTab({ commissions, onAddCommission }: TaxOfficeCommissionsTabProps) {
  const [view, setView] = useState<SubView>("report");
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [collaboratorFilter, setCollaboratorFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  // El modelo de comisiones no guarda una fecha de "período" por registro,
  // solo lastPayoutDate (cuando ya se pagó) — por eso el rango de fechas
  // solo filtra lo YA pagado; lo pendiente (sin fecha todavía) siempre se
  // muestra, porque no hay forma de saber a qué período pertenece aún.
  const filteredCommissions = useMemo(() => {
    return commissions.filter((c) => {
      if (collaboratorFilter !== "all" && c.preparerEmail !== collaboratorFilter) return false;
      if ((fromDate || toDate) && c.lastPayoutDate) {
        if (fromDate && c.lastPayoutDate < fromDate) return false;
        if (toDate && c.lastPayoutDate > toDate) return false;
      }
      return true;
    });
  }, [commissions, collaboratorFilter, fromDate, toDate]);

  const totalGross = filteredCommissions.reduce((acc, curr) => acc + curr.grossVolume, 0);
  const totalNet = filteredCommissions.reduce((acc, curr) => acc + curr.netCommission, 0);
  const totalE360Deductions = filteredCommissions.reduce((acc, curr) => acc + curr.e360FeeDeduction, 0);
  const totalPaidOut = filteredCommissions.filter((c) => c.status === "paid").reduce((acc, c) => acc + c.netCommission, 0);
  const totalBalanceRemaining = filteredCommissions.filter((c) => c.status === "pending").reduce((acc, c) => acc + c.netCommission, 0);

  const collaborators = useMemo(() => {
    const map = new Map<string, string>();
    commissions.forEach((c) => map.set(c.preparerEmail, c.preparerName));
    return Array.from(map.entries());
  }, [commissions]);

  const yearly1099 = useMemo(() => {
    const map = new Map<string, { preparerName: string; preparerEmail: string; totalPaid: number; payouts: number }>();
    commissions
      .filter((c) => c.status === "paid")
      .forEach((c) => {
        const existing = map.get(c.preparerEmail) || { preparerName: c.preparerName, preparerEmail: c.preparerEmail, totalPaid: 0, payouts: 0 };
        existing.totalPaid += c.netCommission;
        existing.payouts += 1;
        map.set(c.preparerEmail, existing);
      });
    return Array.from(map.values());
  }, [commissions]);

  // Escapa cada celda para CSV real: comillas dobles si el valor trae comas,
  // comillas o saltos de línea, y un apóstrofe de escape si empieza con
  // =, +, -, @ (previene que Excel/Sheets lo interprete como fórmula —
  // "CSV formula injection" — si alguien pone eso como nombre de preparador).
  const escapeCsvCell = (value: string | number): string => {
    const str = String(value);
    const needsFormulaGuard = /^[=+\-@]/.test(str);
    const safe = needsFormulaGuard ? `'${str}` : str;
    if (/[",\n]/.test(safe)) {
      return `"${safe.replace(/"/g, '""')}"`;
    }
    return safe;
  };

  const handleExportCSV = () => {
    const headers = ["Preparador", "Correo", "Declaraciones", "Volumen Bruto", "Split %", "Deducción Fee E360 ($60/decl)", "Comisión Neta", "Estado"];
    const rows = filteredCommissions.map((c) => [c.preparerName, c.preparerEmail, c.totalReturns, c.grossVolume, `${c.splitPercentage}%`, c.e360FeeDeduction, c.netCommission, c.status]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.map(escapeCsvCell).join(","), ...rows.map((row) => row.map(escapeCsvCell).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_comisiones_tax_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleExportPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const { autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("Reporte de Comisiones — Oficina Virtual E360", 14, 18);
    doc.setFontSize(9);
    doc.text(`Generado: ${new Date().toLocaleDateString("es-US")}`, 14, 25);

    autoTable(doc, {
      startY: 32,
      head: [["Preparador", "Declaraciones", "Volumen Bruto", "Split %", "Fee E360", "Comisión Neta", "Estado"]],
      body: filteredCommissions.map((c) => [
        c.preparerName,
        String(c.totalReturns),
        formatMoney(c.grossVolume),
        `${c.splitPercentage}%`,
        formatMoney(c.e360FeeDeduction),
        formatMoney(c.netCommission),
        c.status === "paid" ? "Pagado" : "Pendiente"
      ]),
      styles: { fontSize: 8.5 },
      headStyles: { fillColor: [10, 24, 45] }
    });

    doc.save(`reporte_comisiones_tax_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#05101F] border border-gray-800 w-fit">
        {(["report", "1099"] as SubView[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${view === v ? "bg-cyan-500/20 text-cyan-300" : "text-gray-400 hover:text-white"}`}
          >
            {v === "report" ? "Report" : "1099-NEC"}
          </button>
        ))}
      </div>

      {view === "report" ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={collaboratorFilter}
              onChange={(e) => setCollaboratorFilter(e.target.value)}
              className="bg-[#05101F] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
            >
              <option value="all">All collaborators</option>
              {collaborators.map(([email, name]) => (
                <option key={email} value={email}>
                  {name}
                </option>
              ))}
            </select>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="bg-[#05101F] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none" />
            <span className="text-gray-500 text-xs">to</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="bg-[#05101F] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
              <span className="text-[10px] uppercase font-bold text-gray-400">Earned (Net)</span>
              <p className="text-2xl font-black text-white mt-1">{formatMoney(totalNet)}</p>
              <span className="text-[11px] text-gray-500">{formatMoney(totalGross)} volumen bruto</span>
            </div>
            <div className="p-5 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
              <span className="text-[10px] uppercase font-bold text-gray-400">Paid Out</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">{formatMoney(totalPaidOut)}</p>
              <span className="text-[11px] text-emerald-500/80">Liquidado a colaboradores</span>
            </div>
            <div className="p-5 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
              <span className="text-[10px] uppercase font-bold text-gray-400">Balance Remaining</span>
              <p className="text-2xl font-black text-amber-400 mt-1">{formatMoney(totalBalanceRemaining)}</p>
              <span className="text-[11px] text-amber-500/80">{formatMoney(totalE360Deductions)} retenido por E360</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">Reparto de Comisiones por Preparador</h3>
                <p className="text-xs text-gray-400">What each collaborator earned, what was paid out and the balance remaining.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-3.5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(0,224,240,0.25)] flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Nueva Comisión</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-2.5 bg-[#05101F] hover:bg-gray-800 border border-cyan-500/40 text-cyan-300 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download size={15} />
                  <span>{downloadSuccess ? "Descargado" : "Export CSV"}</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="px-3.5 py-2.5 bg-[#05101F] hover:bg-gray-800 border border-gray-700 text-gray-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <FileText size={15} />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-800 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    <th className="py-3 pl-2">Preparador</th>
                    <th className="py-3">Declaraciones</th>
                    <th className="py-3">Volumen Bruto</th>
                    <th className="py-3">Split %</th>
                    <th className="py-3">Fee E360 ($60)</th>
                    <th className="py-3">Comisión Neta</th>
                    <th className="py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {filteredCommissions.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-900/40 transition-colors">
                      <td className="py-3.5 pl-2 font-bold text-white">
                        <div>{c.preparerName}</div>
                        <div className="text-[10px] text-gray-500 font-normal">{c.preparerEmail}</div>
                      </td>
                      <td className="py-3.5 font-mono text-gray-300 font-semibold">{c.totalReturns} decl.</td>
                      <td className="py-3.5 font-bold text-gray-200">{formatMoney(c.grossVolume)}</td>
                      <td className="py-3.5 font-bold text-cyan-400">{c.splitPercentage}%</td>
                      <td className="py-3.5 font-mono text-amber-400 font-semibold">{c.e360FeeDeduction > 0 ? `-${formatMoney(c.e360FeeDeduction)}` : "$0 (Autónomo)"}</td>
                      <td className="py-3.5 font-black text-emerald-400 text-sm">{formatMoney(c.netCommission)}</td>
                      <td className="py-3.5">
                        {c.status === "paid" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 size={11} /> Liquidado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock size={11} /> Pendiente
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="p-6 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-white mb-1">1099-NEC — Compensación anual pagada</h3>
          <p className="text-xs text-gray-400 mb-4">Total pagado a cada colaborador no-empleado durante el año, para reporte fiscal 1099-NEC.</p>
          {yearly1099.length === 0 ? (
            <p className="text-xs text-gray-500 italic py-6 text-center">Todavía no hay comisiones liquidadas este año.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  <th className="py-3 pl-2">Colaborador</th>
                  <th className="py-3">Pagos realizados</th>
                  <th className="py-3">Total pagado (año)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {yearly1099.map((p) => (
                  <tr key={p.preparerEmail} className="hover:bg-gray-900/40 transition-colors">
                    <td className="py-3.5 pl-2 font-bold text-white">
                      <div>{p.preparerName}</div>
                      <div className="text-[10px] text-gray-500 font-normal">{p.preparerEmail}</div>
                    </td>
                    <td className="py-3.5 text-gray-300">{p.payouts}</td>
                    <td className="py-3.5 font-black text-emerald-400">{formatMoney(p.totalPaid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <NewTaxCommissionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCommissionCreated={onAddCommission} />
    </div>
  );
}
