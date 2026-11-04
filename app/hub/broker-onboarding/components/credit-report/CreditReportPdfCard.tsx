"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { CreditReportAnalysis } from "../../types";
import { buildClientPdf } from "./credit-report-utils";

interface CreditReportPdfCardProps {
  analysis: CreditReportAnalysis;
  brokerName: string;
}

export default function CreditReportPdfCard({ analysis, brokerName }: CreditReportPdfCardProps) {
  const [clientName, setClientName] = useState("");
  const [preparedBy, setPreparedBy] = useState(brokerName || "");
  const [status, setStatus] = useState("");

  function handleGenerate() {
    setStatus("");
    try {
      const doc = buildClientPdf(analysis, clientName.trim(), preparedBy.trim());
      const slug = (clientName.trim() || "cliente").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cliente";
      doc.save(`resumen-credito-${slug}.pdf`);
      setStatus("PDF generado.");
    } catch {
      setStatus("No se pudo generar el PDF. Inténtalo de nuevo.");
    }
  }

  return (
    <section className="bg-[#0A182D]/80 border border-gray-800 rounded-2xl p-6 space-y-3">
      <h2 className="text-lg font-extrabold text-white">PDF para el cliente</h2>
      <p className="text-xs text-gray-500">Incluye los puntajes, los elementos negativos, qué vamos a hacer y qué esperar. No incluye precios.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Nombre del cliente (opcional)"
          className="bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none"
        />
        <input
          type="text"
          value={preparedBy}
          onChange={(e) => setPreparedBy(e.target.value)}
          placeholder="Preparado por (opcional)"
          className="bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none"
        />
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        className="px-4 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
      >
        <Download size={14} />
        <span>Generar PDF para el cliente</span>
      </button>
      {status && <p className="text-xs text-gray-400">{status}</p>}
    </section>
  );
}
