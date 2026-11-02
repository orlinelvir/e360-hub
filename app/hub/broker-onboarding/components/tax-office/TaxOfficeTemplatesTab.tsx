"use client";

import { useState } from "react";
import { FileText, Copy, Check, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";
import { TAX_TEMPLATES_DATA } from "./mock-tax-data";

export default function TaxOfficeTemplatesTab() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (tplId: string) => {
    const link = `https://hub.emprende360.com/tax-forms/${tplId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(tplId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
          Plantillas y Formularios Digitales para Clientes
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Envía estos enlaces a tus clientes para captar su información y cumplir los requisitos del IRS sin papeleo físico.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TAX_TEMPLATES_DATA.map((tpl) => (
          <div
            key={tpl.id}
            className="p-5 rounded-2xl bg-[#0A182D]/90 border border-gray-800 hover:border-gray-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">{tpl.code}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  {tpl.badge}
                </span>
              </div>

              <h4 className="font-extrabold text-white text-base mt-2">{tpl.title}</h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{tpl.description}</p>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-800 flex items-center justify-between">
              <span className="text-[11px] text-gray-500 font-mono">{tpl.fieldsCount} campos requeridos</span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyLink(tpl.id)}
                  className="px-3 py-1.5 rounded-xl border border-gray-700 text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedId === tpl.id ? (
                    <>
                      <Check size={13} className="text-emerald-400" />
                      <span className="text-emerald-400">Enlace Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copiar Enlace</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
