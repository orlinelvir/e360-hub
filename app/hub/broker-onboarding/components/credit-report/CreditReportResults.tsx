"use client";

import { useState } from "react";
import { Copy, Download, Check, RotateCcw } from "lucide-react";
import { CreditReportAnalysis, CreditReportIssue } from "../../types";
import { BANDS, TIPO_LABELS, DISPUTABLE_LABELS, IMPACT_LABELS, money, pct, summaryText } from "./credit-report-utils";
import CreditReportPricingCard from "./CreditReportPricingCard";
import CreditReportPdfCard from "./CreditReportPdfCard";

interface CreditReportResultsProps {
  analysis: CreditReportAnalysis;
  notes: string[];
  brokerName: string;
  onNewAnalysis: () => void;
}

function ScoreRuler({ name, score }: { name: string; score: number | null }) {
  const pinLeft = typeof score === "number" && score >= 300 && score <= 850 ? ((score - 300) / 550) * 100 : null;
  return (
    <div className="grid grid-cols-[72px_1fr_44px] sm:grid-cols-[92px_1fr_48px] items-center gap-2.5">
      <span className="text-xs font-bold text-gray-300">{name}</span>
      <div className="relative h-3 rounded-md flex overflow-visible">
        {BANDS.map((b) => (
          <i key={b[3]} style={{ width: `${((b[1] - b[0] + 1) / 551) * 100}%`, background: b[2] }} className="block h-full first:rounded-l-md last:rounded-r-md" />
        ))}
        {pinLeft !== null && (
          <span
            style={{ left: `${pinLeft}%` }}
            className="absolute -top-1 w-1 h-5 bg-white rounded -translate-x-1/2 shadow-[0_0_0_2px_rgba(10,24,45,1)]"
          />
        )}
      </div>
      <span className="text-right font-serif font-bold text-base text-white">{score ?? "—"}</span>
    </div>
  );
}

export default function CreditReportResults({ analysis, notes, brokerName, onNewAnalysis }: CreditReportResultsProps) {
  const [copied, setCopied] = useState(false);
  const problems = [...(analysis.problemas || [])].sort((a, b) => (a.prioridad || 99) - (b.prioridad || 99));
  const util = analysis.utilizacion || { porcentaje_global: null, tarjetas: [], recomendacion: null, explicacion_cliente: null };
  const scores = analysis.scores || [];
  const altoCount = problems.filter((p) => p.impacto === "alto").length;
  const dispCount = problems.filter((p) => p.disputable === "si" || p.disputable === "posible").length;

  async function handleCopy() {
    const text = summaryText(analysis);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard no disponible — sin acción adicional
    }
  }

  function handleDownloadTxt() {
    const blob = new Blob([summaryText(analysis)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resumen-reporte-credito.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {notes.map((n, i) => (
        <div key={i} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
          {n}
        </div>
      ))}

      {/* Diagnóstico */}
      <section className="bg-[#0A182D]/80 border border-gray-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-extrabold text-white">Diagnóstico</h2>
        <div className="space-y-3">
          {["Equifax", "Experian", "TransUnion"].map((name) => {
            const f = scores.find((s) => s.buro.toLowerCase() === name.toLowerCase());
            return <ScoreRuler key={name} name={name} score={f && typeof f.score === "number" ? f.score : null} />;
          })}
        </div>
        <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[11px] text-gray-500">
          {BANDS.map((b) => (
            <span key={b[3]} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: b[2] }} />
              {b[3]} {b[0]}–{b[1]}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-2.5 rounded-lg border border-gray-800 bg-[#05101F]">
            <b className="block text-xl font-black text-white">{problems.length}</b>
            <span className="text-[11px] text-gray-500">elementos a trabajar</span>
          </div>
          <div className="p-2.5 rounded-lg border border-gray-800 bg-[#05101F]">
            <b className="block text-xl font-black text-white">{altoCount}</b>
            <span className="text-[11px] text-gray-500">de impacto alto</span>
          </div>
          <div className="p-2.5 rounded-lg border border-gray-800 bg-[#05101F]">
            <b className="block text-xl font-black text-white">{dispCount}</b>
            <span className="text-[11px] text-gray-500">para disputar o verificar</span>
          </div>
          <div className="p-2.5 rounded-lg border border-gray-800 bg-[#05101F]">
            <b className="block text-xl font-black text-white">{pct(util.porcentaje_global)}</b>
            <span className="text-[11px] text-gray-500">utilización global</span>
          </div>
        </div>
        {analysis.resumen_para_el_broker && <p className="text-sm text-gray-300 pt-1">{analysis.resumen_para_el_broker}</p>}
      </section>

      {/* Cómo explicárselo al cliente */}
      <section className="bg-[#0A182D]/80 border border-gray-800 rounded-2xl p-6 space-y-3">
        <h2 className="text-lg font-extrabold text-white">Cómo explicárselo al cliente</h2>
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
          <p className="text-sm text-gray-200">{analysis.explicacion_para_el_cliente}</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? "Copiado" : "Copiar resumen para el cliente"}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadTxt}
            className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={13} />
            <span>Descargar resumen (.txt)</span>
          </button>
        </div>
      </section>

      {/* Problemas */}
      <section className="bg-[#0A182D]/80 border border-gray-800 rounded-2xl p-6 space-y-3">
        <h2 className="text-lg font-extrabold text-white">Qué está afectando este crédito</h2>
        {problems.length === 0 ? (
          <p className="text-sm text-gray-500">No se encontraron elementos negativos en el reporte.</p>
        ) : (
          <div className="space-y-3">
            {problems.map((p, i) => (
              <IssueCard key={i} p={p} />
            ))}
          </div>
        )}
      </section>

      <CreditReportPricingCard analysis={analysis} problems={problems} />
      <CreditReportPdfCard analysis={analysis} brokerName={brokerName} />

      {/* Utilización */}
      {(util.tarjetas?.length > 0 || util.recomendacion) && (
        <section className="bg-[#0A182D]/80 border border-gray-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-lg font-extrabold text-white">Utilización de tarjetas</h2>
          {util.tarjetas?.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[520px]">
                <thead>
                  <tr className="border-b border-gray-800 text-[10px] uppercase font-bold text-gray-500">
                    <th className="py-2">Tarjeta</th>
                    <th className="py-2 text-right">Límite</th>
                    <th className="py-2 text-right">Balance</th>
                    <th className="py-2 text-right">Uso</th>
                    <th className="py-2 text-right">Pagar para 30%</th>
                    <th className="py-2 text-right">Pagar para 10%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {util.tarjetas.map((c, i) => (
                    <tr key={i} className="text-gray-300">
                      <td className="py-2.5">{c.acreedor}</td>
                      <td className="py-2.5 text-right font-mono">{money(c.limite)}</td>
                      <td className="py-2.5 text-right font-mono">{money(c.balance)}</td>
                      <td className="py-2.5 text-right font-mono">{pct(c.porcentaje)}</td>
                      <td className="py-2.5 text-right font-mono">{money(c.pagar_para_llegar_a_30)}</td>
                      <td className="py-2.5 text-right font-mono">{money(c.pagar_para_llegar_a_10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {util.recomendacion && <p className="text-sm text-gray-300">{util.recomendacion}</p>}
          {util.explicacion_cliente && (
            <div className="bg-[#05101F] rounded-lg p-3 text-xs text-gray-300">
              <b className="text-white">Para decirle al cliente: </b>
              {util.explicacion_cliente}
            </div>
          )}
        </section>
      )}

      {/* Diferencias entre burós */}
      {analysis.diferencias_entre_buros?.length > 0 && (
        <ListCard title="Diferencias entre los burós" items={analysis.diferencias_entre_buros} />
      )}

      {/* Positivo */}
      {analysis.cosas_positivas?.length > 0 && <ListCard title="Lo que está bien y hay que proteger" items={analysis.cosas_positivas} />}

      {/* Plan */}
      {analysis.plan?.length > 0 && (
        <section className="bg-[#0A182D]/80 border border-gray-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-lg font-extrabold text-white">Plan de acción, del más rápido al más lento</h2>
          {analysis.plan.map((ph, i) => (
            <div key={i} className="border border-gray-800 rounded-xl p-3.5">
              <div className="flex flex-wrap justify-between gap-2 mb-1">
                <b className="font-serif text-white">
                  {ph.fase}
                  {ph.titulo ? `: ${ph.titulo}` : ""}
                </b>
                <span className="text-[11px] text-gray-500">{ph.tiempo}</span>
              </div>
              <ol className="list-decimal ml-4 space-y-0.5 text-sm text-gray-300">
                {ph.pasos.map((s, j) => (
                  <li key={j}>{s}</li>
                ))}
              </ol>
            </div>
          ))}
        </section>
      )}

      {/* Tradelines */}
      {(analysis.tradelines?.motivo || analysis.tradelines?.precaucion) && (
        <section className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 space-y-2">
          <h3 className="font-extrabold text-amber-400">Tradelines (cuenta como usuario autorizado)</h3>
          <p className="text-sm text-gray-200">
            {analysis.tradelines.conviene ? "Podría ayudar en este caso. " : "No parece necesario en este caso. "}
            {analysis.tradelines.motivo}
          </p>
          {analysis.tradelines.precaucion && <p className="text-sm text-gray-300">Precaución: {analysis.tradelines.precaucion}</p>}
          <p className="text-xs text-gray-500">Es una estrategia opcional y complementaria. No garantiza resultados y no debe presentarse como una solución segura.</p>
        </section>
      )}

      {/* Qué no prometer */}
      <section className="bg-[#0A182D]/80 border border-gray-800 rounded-2xl p-6 space-y-3">
        <h2 className="text-lg font-extrabold text-white">Qué no prometer</h2>
        <ul className="list-disc ml-4 space-y-1 text-sm text-gray-300">
          {[
            "No se puede garantizar que un elemento sea eliminado ni cuántos puntos subirá el score.",
            "No se disputa información que es correcta.",
            "Cada ronda de disputas toma alrededor de 30 días.",
            ...(analysis.no_prometer || [])
          ].map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
        {analysis.expectativa_realista && (
          <p className="text-sm text-gray-300 pt-1">
            <b className="text-white">Expectativa realista: </b>
            {analysis.expectativa_realista}
          </p>
        )}
      </section>

      <p className="text-[11px] text-gray-600 leading-relaxed">
        Herramienta educativa de Emprende 360. El análisis lo genera una IA a partir del reporte que subiste y puede contener errores: confirma cada punto con el
        reporte original y con el cliente. No es asesoría legal ni garantiza resultados. Los servicios de reparación de crédito deben cumplir con la ley CROA.
      </p>

      <button
        type="button"
        onClick={onNewAnalysis}
        className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
      >
        <RotateCcw size={13} />
        <span>Analizar otro reporte</span>
      </button>
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="bg-[#0A182D]/80 border border-gray-800 rounded-2xl p-6 space-y-2">
      <h2 className="text-lg font-extrabold text-white">{title}</h2>
      <ul className="list-disc ml-4 space-y-1 text-sm text-gray-300">
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </section>
  );
}

function IssueCard({ p }: { p: CreditReportIssue }) {
  const impact = IMPACT_LABELS[p.impacto] ? p.impacto : "bajo";
  const borderColor = impact === "alto" ? "border-l-red-500" : impact === "medio" ? "border-l-amber-500" : "border-l-gray-600";
  const dispClass =
    p.disputable === "si"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : p.disputable === "posible"
        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
        : "bg-red-500/10 text-red-400 border-red-500/20";

  return (
    <div className={`border border-gray-800 border-l-4 ${borderColor} rounded-xl p-4 bg-[#05101F]`}>
      <div className="flex flex-wrap items-center gap-2 mb-1.5">
        <span className="font-bold text-white">{p.acreedor || "Elemento del reporte"}</span>
        {p.cuenta_ultimos4 && <span className="text-xs text-gray-500">…{p.cuenta_ultimos4}</span>}
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">{TIPO_LABELS[p.tipo] || "Otro"}</span>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">{IMPACT_LABELS[impact]}</span>
        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${dispClass}`}>{DISPUTABLE_LABELS[p.disputable] || "Revisar"}</span>
      </div>
      {p.buros?.length > 0 && <p className="text-xs text-gray-500 mb-1">Aparece en: {p.buros.join(", ")}</p>}
      {p.detalle && (
        <p className="text-sm text-gray-300 mt-1">
          <b className="text-white">Qué dice el reporte: </b>
          {p.detalle}
        </p>
      )}
      {p.motivo && (
        <p className="text-sm text-gray-300 mt-1">
          <b className="text-white">Por qué: </b>
          {p.motivo}
        </p>
      )}
      {p.accion && (
        <p className="text-sm text-gray-300 mt-1">
          <b className="text-white">Qué hacer: </b>
          {p.accion}
        </p>
      )}
      {p.verificar_con_cliente && (
        <p className="text-sm text-gray-300 mt-1">
          <b className="text-white">Preguntar al cliente: </b>
          {p.verificar_con_cliente}
        </p>
      )}
      {p.explicacion_cliente && (
        <div className="mt-2 bg-[#0A182D] rounded-lg p-2.5 text-xs text-gray-300">
          <b className="text-white">Para decirle al cliente: </b>
          {p.explicacion_cliente}
        </div>
      )}
    </div>
  );
}
