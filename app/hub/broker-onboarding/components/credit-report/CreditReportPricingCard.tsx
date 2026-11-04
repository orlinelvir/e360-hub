"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { CreditReportAnalysis, CreditReportIssue } from "../../types";
import { PRECIOS, TierKey, recommendTier, initialCounts, money } from "./credit-report-utils";

interface CreditReportPricingCardProps {
  analysis: CreditReportAnalysis;
  problems: CreditReportIssue[];
}

export default function CreditReportPricingCard({ analysis, problems }: CreditReportPricingCardProps) {
  const init = initialCounts(analysis, problems);
  const [neg, setNeg] = useState(init.neg);
  const [col, setCol] = useState(init.col);
  const [thin, setThin] = useState(init.thin);
  const [manualTier, setManualTier] = useState<TierKey | "auto">("auto");

  const key: TierKey = manualTier === "auto" ? recommendTier(neg, col, thin) : manualTier;
  const isManual = manualTier !== "auto";

  function tierBody() {
    if (key === "ninguno") {
      return <p className="text-sm text-gray-300">No se encontraron elementos negativos. Este cliente no necesita reparación; considera dar seguimiento a la utilización o construir historial.</p>;
    }
    const T = PRECIOS[key];
    let why: string;
    if (key === "n1") why = `${neg} elemento(s) negativo(s) en total: entra en el Nivel 1.`;
    else if (key === "n2") why = `${neg} elementos negativos y ${col} colección(es): entra en el Nivel 2.`;
    else if (key === "n3")
      why = `${neg > 10 ? `Hay más de 10 elementos negativos (${neg}). ` : ""}${col > 2 ? `Hay más de 2 colecciones (${col}). ` : ""}Requiere negociar con las compañías de cobro y disputar.`;
    else why = "El reporte no tiene suficiente historial: hay que construirlo antes o junto con la reparación.";

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <b className="text-lg font-serif text-white">{T.nombre}</b>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">{T.rango}</span>
          {isManual && <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Nivel elegido manualmente</span>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl border border-gray-800 bg-[#05101F]">
            <b className="block text-xl font-black text-white">{T.evaluacion == null ? "Por definir" : money(T.evaluacion)}</b>
            <span className="text-[11px] text-gray-500">Evaluación inicial</span>
          </div>
          <div className="p-3 rounded-xl border border-gray-800 bg-[#05101F]">
            <b className="block text-xl font-black text-white">{T.mensual == null ? "Por definir" : `${money(T.mensual)} al mes`}</b>
            <span className="text-[11px] text-gray-500">Mensualidad</span>
          </div>
          <div className="p-3 rounded-xl border border-gray-800 bg-[#05101F]">
            <b className="block text-xl font-black text-white">{T.meses}</b>
            <span className="text-[11px] text-gray-500">Duración típica</span>
          </div>
        </div>
        <p className="text-sm text-gray-300"><b className="text-white">Por qué: </b>{why}</p>
        {T.nota && <p className="text-xs text-gray-500">{T.nota}</p>}
        {key === "n3" && T.evaluacion == null && (
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300">
            El precio del Nivel 3 todavía no está cargado en la herramienta. Confírmalo con E360 antes de cotizar.
          </div>
        )}
        {thin && key !== "cr" && neg > 0 && (
          <div className="p-2.5 bg-slate-500/10 border border-gray-700 rounded-lg text-xs text-gray-300">
            Además de los elementos negativos, el historial es insuficiente. El paquete de construcción de crédito es {money(PRECIOS.cr.evaluacion)} de evaluación
            y {money(PRECIOS.cr.mensual)} al mes, por unos 6 meses. Define con tu equipo cómo combinar ambos; la herramienta no suma precios automáticamente.
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="bg-[#0A182D]/80 border border-gray-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-extrabold text-white">Recomendación de cobro</h2>
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Lock size={10} /> Solo para el broker
        </span>
      </div>
      <p className="text-xs text-gray-500">Se calcula con los conteos del reporte. Puedes corregirlos si no coinciden con lo que ves.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <label className="flex flex-col gap-1 text-xs text-gray-400">
          Elementos negativos
          <input
            type="number"
            min={0}
            value={neg}
            onChange={(e) => setNeg(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="bg-[#05101F] border border-gray-800 rounded-lg px-2.5 py-2 text-white outline-none focus:border-cyan-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-400">
          Colecciones
          <input
            type="number"
            min={0}
            value={col}
            onChange={(e) => setCol(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="bg-[#05101F] border border-gray-800 rounded-lg px-2.5 py-2 text-white outline-none focus:border-cyan-400"
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-300 pt-5">
          <input type="checkbox" checked={thin} onChange={(e) => setThin(e.target.checked)} className="w-4 h-4 rounded text-cyan-500 bg-[#05101F] border-gray-700" />
          Historial insuficiente
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-400">
          Nivel
          <select
            value={manualTier}
            onChange={(e) => setManualTier(e.target.value as TierKey | "auto")}
            className="bg-[#05101F] border border-gray-800 rounded-lg px-2.5 py-2 text-white outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="auto">Usar la recomendación</option>
            <option value="n1">Nivel 1</option>
            <option value="n2">Nivel 2</option>
            <option value="n3">Nivel 3</option>
            <option value="cr">Construcción de crédito</option>
          </select>
        </label>
      </div>

      {tierBody()}

      <p className="text-[11px] text-gray-500 pt-2 border-t border-gray-800">
        Esto no aparece en el PDF del cliente. Antes de cobrar, confirma con el contrato de E360 y con tu asesor legal cuándo se puede cobrar cada concepto: la ley
        CROA no permite cobrar por servicios antes de que se realicen.
      </p>
    </section>
  );
}
