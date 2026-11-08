"use client";

import { useState } from "react";
import { X, UserPlus, CheckCircle2, DollarSign, Percent, Hash } from "lucide-react";
import { NewTaxCommissionInput } from "../../types";
import { computeTaxCommission } from "@/lib/services/tax-commission-calc";

interface NewTaxCommissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCommissionCreated: (input: NewTaxCommissionInput) => Promise<boolean>;
}

export default function NewTaxCommissionModal({ isOpen, onClose, onCommissionCreated }: NewTaxCommissionModalProps) {
  const [preparerName, setPreparerName] = useState("");
  const [preparerEmail, setPreparerEmail] = useState("");
  const [totalReturns, setTotalReturns] = useState<number>(10);
  const [grossVolume, setGrossVolume] = useState<number>(3500);
  const [splitPercentage, setSplitPercentage] = useState<number>(50);
  const [underMentorship, setUnderMentorship] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const { e360FeeDeduction, netCommission } = computeTaxCommission(totalReturns, grossVolume, splitPercentage, underMentorship);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!preparerName.trim()) {
      setError("El nombre del preparador es obligatorio.");
      return;
    }
    if (!grossVolume || !splitPercentage) {
      setError("Ingresa el volumen bruto y el porcentaje de split.");
      return;
    }

    setIsSubmitting(true);
    const success = await onCommissionCreated({
      preparerName: preparerName.trim(),
      preparerEmail: preparerEmail.trim(),
      totalReturns: Number(totalReturns) || 0,
      grossVolume: Number(grossVolume) || 0,
      splitPercentage: Number(splitPercentage) || 0,
      underMentorship
    });
    setIsSubmitting(false);

    if (success) {
      onClose();
      setPreparerName("");
      setPreparerEmail("");
      setTotalReturns(10);
      setGrossVolume(3500);
      setSplitPercentage(50);
      setUnderMentorship(true);
    } else {
      setError("No se pudo registrar la comisión. Intenta de nuevo.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0A182D] border border-cyan-500/30 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[#05101F]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <UserPlus size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Nueva Comisión de Preparador</h3>
              <p className="text-xs text-gray-400">Registra el reparto de un colaborador de la oficina</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-gray-300">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase font-semibold text-gray-400 mb-1">Nombre del Preparador *</label>
              <input
                type="text"
                required
                value={preparerName}
                onChange={(e) => setPreparerName(e.target.value)}
                placeholder="Ej. María Hernández"
                className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-600 outline-none transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase font-semibold text-gray-400 mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={preparerEmail}
                onChange={(e) => setPreparerEmail(e.target.value)}
                placeholder="preparador@gmail.com"
                className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-600 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-semibold text-gray-400 mb-1 flex items-center gap-1">
                <Hash size={11} /> Declaraciones
              </label>
              <input
                type="number"
                min="0"
                value={totalReturns}
                onChange={(e) => setTotalReturns(Number(e.target.value))}
                className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-semibold text-gray-400 mb-1 flex items-center gap-1">
                <DollarSign size={11} /> Volumen Bruto ($)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={grossVolume}
                onChange={(e) => setGrossVolume(Number(e.target.value))}
                className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white font-bold outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase font-semibold text-gray-400 mb-1 flex items-center gap-1">
                <Percent size={11} /> Porcentaje de Split (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={splitPercentage}
                onChange={(e) => setSplitPercentage(Number(e.target.value))}
                className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white font-bold outline-none"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between p-3.5 bg-blue-950/20 border border-blue-900/40 rounded-xl">
              <label htmlFor="under-mentorship" className="text-[11px] font-semibold text-gray-300 cursor-pointer">
                ¿Bajo mentoría / EFIN central E360? (fee de $60/declaración)
              </label>
              <input
                id="under-mentorship"
                type="checkbox"
                checked={underMentorship}
                onChange={(e) => setUnderMentorship(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 bg-[#05101F] border-gray-700 focus:ring-0 cursor-pointer shrink-0"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#05101F] border border-gray-800 space-y-1.5">
            {underMentorship && e360FeeDeduction > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500">Fee E360 ({totalReturns} declaraciones × $60)</span>
                <span className="text-xs font-bold text-amber-400">-{formatMoney(e360FeeDeduction)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-gray-400">Comisión Neta Calculada</span>
              <span className="text-lg font-black text-emerald-400">{formatMoney(netCommission)}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold rounded-xl shadow-[0_0_20px_rgba(0,224,240,0.3)] flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              <span>{isSubmitting ? "Guardando..." : "Registrar Comisión"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
