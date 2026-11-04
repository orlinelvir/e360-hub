"use client";

import { useState } from "react";
import { Download, CheckCircle2, Clock, Plus } from "lucide-react";
import { TaxCommissionItem, NewTaxCommissionInput } from "../../types";
import NewTaxCommissionModal from "./NewTaxCommissionModal";

interface TaxOfficeCommissionsTabProps {
  commissions: TaxCommissionItem[];
  onAddCommission: (input: NewTaxCommissionInput) => Promise<boolean>;
}

export default function TaxOfficeCommissionsTab({ commissions, onAddCommission }: TaxOfficeCommissionsTabProps) {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  const totalGross = commissions.reduce((acc, curr) => acc + curr.grossVolume, 0);
  const totalNet = commissions.reduce((acc, curr) => acc + curr.netCommission, 0);
  const totalE360Deductions = commissions.reduce((acc, curr) => acc + curr.e360FeeDeduction, 0);

  const handleExportCSV = () => {
    const headers = ["Preparador", "Correo", "Declaraciones", "Volumen Bruto", "Split %", "Deducción Fee E360 ($60/decl)", "Comisión Neta", "Estado"];
    const rows = commissions.map((c) => [
      c.preparerName,
      c.preparerEmail,
      c.totalReturns,
      c.grossVolume,
      `${c.splitPercentage}%`,
      c.e360FeeDeduction,
      c.netCommission,
      c.status,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_comisiones_tax_2025_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Resumen Superior */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
          <span className="text-[10px] uppercase font-bold text-gray-400">Volumen Bruto de Oficina</span>
          <p className="text-2xl font-black text-white mt-1">{formatMoney(totalGross)}</p>
          <span className="text-[11px] text-gray-500">106 declaraciones auditadas</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
          <span className="text-[10px] uppercase font-bold text-gray-400">Comisiones Netas a Repartir</span>
          <p className="text-2xl font-black text-cyan-400 mt-1">{formatMoney(totalNet)}</p>
          <span className="text-[11px] text-cyan-500/80">Pago a preparadores y colaboradores</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
          <span className="text-[10px] uppercase font-bold text-gray-400">Retención de Fees E360</span>
          <p className="text-2xl font-black text-amber-400 mt-1">{formatMoney(totalE360Deductions)}</p>
          <span className="text-[11px] text-amber-500/80">Deducción de $60/decl (Camino Mentoría)</span>
        </div>
      </div>

      {/* Tabla de Preparadores */}
      <div className="p-6 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
              Reparto de Comisiones por Preparador
            </h3>
            <p className="text-xs text-gray-400">Reporte para cálculo de nómina y 1099-NEC de colaboradores</p>
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
              className="px-4 py-2.5 bg-[#05101F] hover:bg-gray-800 border border-cyan-500/40 text-cyan-300 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download size={15} />
              <span>{downloadSuccess ? "Reporte Descargado" : "Exportar CSV (1099-NEC)"}</span>
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
              {commissions.map((c) => (
                <tr key={c.id} className="hover:bg-gray-900/40 transition-colors">
                  <td className="py-3.5 pl-2 font-bold text-white">
                    <div>{c.preparerName}</div>
                    <div className="text-[10px] text-gray-500 font-normal">{c.preparerEmail}</div>
                  </td>
                  <td className="py-3.5 font-mono text-gray-300 font-semibold">{c.totalReturns} decl.</td>
                  <td className="py-3.5 font-bold text-gray-200">{formatMoney(c.grossVolume)}</td>
                  <td className="py-3.5 font-bold text-cyan-400">{c.splitPercentage}%</td>
                  <td className="py-3.5 font-mono text-amber-400 font-semibold">
                    {c.e360FeeDeduction > 0 ? `-${formatMoney(c.e360FeeDeduction)}` : "$0 (Autónomo)"}
                  </td>
                  <td className="py-3.5 font-black text-emerald-400 text-sm">
                    {formatMoney(c.netCommission)}
                  </td>
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

      <NewTaxCommissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCommissionCreated={onAddCommission}
      />
    </div>
  );
}
