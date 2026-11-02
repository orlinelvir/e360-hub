"use client";

import { useState } from "react";
import { X, UserPlus, CheckCircle2, DollarSign, Calendar, Landmark, FileText, Phone, Mail, User } from "lucide-react";
import { TaxCase, TaxServiceType } from "../../types";

interface NewTaxCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaseCreated: (newCase: TaxCase) => void;
}

const SERVICE_LABELS: Record<TaxServiceType, string> = {
  "1040_personal": "1040 Personal (W-2 / 1099)",
  "schedule_c": "1040 con Schedule C (Independiente / Sole Prop)",
  "1120_corp": "Form 1120 (Corporación C)",
  "1120s_scorp": "Form 1120-S (Corporación S)",
  "1065_partnership": "Form 1065 (Partnership / Sociedad)",
  "amendment_1040x": "Enmienda Fiscal (1040-X)",
  "itin_application": "Trámite de ITIN (Form W-7)",
};

export default function NewTaxCaseModal({ isOpen, onClose, onCaseCreated }: NewTaxCaseModalProps) {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [taxYear, setTaxYear] = useState<number>(2025);
  const [serviceType, setServiceType] = useState<TaxServiceType>("1040_personal");
  const [filingStatus, setFilingStatus] = useState<TaxCase["filingStatus"]>("single");
  const [agreedFee, setAgreedFee] = useState<number>(350);
  const [bankProduct, setBankProduct] = useState<boolean>(true);
  const [bankPartner, setBankPartner] = useState<TaxCase["bankPartner"]>("sbtpg");
  const [refundAdvanceRequested, setRefundAdvanceRequested] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!clientName.trim()) {
      setError("El nombre del cliente es obligatorio.");
      return;
    }
    if (!clientPhone.trim() && !clientEmail.trim()) {
      setError("Ingresa al menos un teléfono o correo de contacto.");
      return;
    }

    setIsSubmitting(true);

    const newCase: TaxCase = {
      id: `TC-${taxYear}-${Math.floor(100 + Math.random() * 900)}`,
      brokerId: "current_broker",
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim() || "sin-correo@e360.com",
      clientPhone: clientPhone.trim() || "No especificado",
      taxYear,
      serviceType,
      stage: "new",
      filingStatus,
      agreedFee: Number(agreedFee) || 0,
      bankProduct,
      bankPartner: bankProduct ? bankPartner : "none",
      refundAdvanceRequested: bankProduct && refundAdvanceRequested,
      documentsCount: 0,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTimeout(() => {
      onCaseCreated(newCase);
      setIsSubmitting(false);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0A182D] border border-cyan-500/30 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[#05101F]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <UserPlus size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Nuevo Caso Fiscal (Expediente)</h3>
              <p className="text-xs text-gray-400">Registra un cliente para la temporada de taxes 2025-2026</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-gray-300">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 font-medium">
              {error}
            </div>
          )}

          {/* Datos del Cliente */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <User size={13} /> Datos del Contribuyente
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase font-semibold text-gray-400 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej. Juan Carlos Morales"
                  className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-600 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-gray-400 mb-1 flex items-center gap-1">
                  <Phone size={11} /> Teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+1 (305) 555-0123"
                  className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-600 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-gray-400 mb-1 flex items-center gap-1">
                  <Mail size={11} /> Correo Electrónico
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="cliente@gmail.com"
                  className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-600 outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Parámetros de la Declaración */}
          <div className="space-y-3 pt-2 border-t border-gray-800/80">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <FileText size={13} /> Parámetros Fiscales
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-semibold text-gray-400 mb-1 flex items-center gap-1">
                  <Calendar size={11} /> Año Fiscal
                </label>
                <select
                  value={taxYear}
                  onChange={(e) => setTaxYear(Number(e.target.value))}
                  className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2.5 text-white outline-none cursor-pointer"
                >
                  <option value={2025}>2025 (Año Actual)</option>
                  <option value={2024}>2024 (Año Previo)</option>
                  <option value={2023}>2023</option>
                  <option value={2022}>2022</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase font-semibold text-gray-400 mb-1">Tipo de Declaración / Servicio</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as TaxServiceType)}
                  className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2.5 text-white outline-none cursor-pointer"
                >
                  {Object.entries(SERVICE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-gray-400 mb-1">Estado Civil (Filing Status)</label>
                <select
                  value={filingStatus}
                  onChange={(e) => setFilingStatus(e.target.value as TaxCase["filingStatus"])}
                  className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2.5 text-white outline-none cursor-pointer"
                >
                  <option value="single">Single (Soltero)</option>
                  <option value="married_joint">Married Filing Jointly (Casados)</option>
                  <option value="head_of_household">Head of Household (Jefe de Familia)</option>
                  <option value="married_separate">Married Filing Separately</option>
                  <option value="qualifying_widow">Qualifying Surviving Spouse</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-gray-400 mb-1 flex items-center gap-1">
                  <DollarSign size={11} /> Honorario Acordado ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="25"
                  value={agreedFee}
                  onChange={(e) => setAgreedFee(Number(e.target.value))}
                  className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white font-bold outline-none"
                />
              </div>
            </div>
          </div>

          {/* Integración Bancaria */}
          <div className="space-y-3 pt-2 border-t border-gray-800/80">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Landmark size={13} /> Producto Bancario (Cobro del Reembolso)
              </h4>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bankProduct}
                  onChange={(e) => setBankProduct(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 bg-[#05101F] border-gray-700 focus:ring-0 cursor-pointer"
                />
                <span className="text-[11px] font-semibold text-gray-300">Descontar honorarios del reembolso</span>
              </label>
            </div>

            {bankProduct && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-blue-950/20 border border-blue-900/40 rounded-xl">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-gray-400 mb-1">Banco Fiscal Asociado</label>
                  <select
                    value={bankPartner}
                    onChange={(e) => setBankPartner(e.target.value as TaxCase["bankPartner"])}
                    className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                  >
                    <option value="sbtpg">Santa Barbara TPG (SBTPG)</option>
                    <option value="refund_advantage">Refund Advantage</option>
                    <option value="republic">Republic Bank</option>
                    <option value="eps">EPS Financial</option>
                  </select>
                </div>

                <div className="flex items-center pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={refundAdvanceRequested}
                      onChange={(e) => setRefundAdvanceRequested(e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-500 bg-[#05101F] border-gray-700 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-[11px] text-gray-300">
                      Solicitar <strong>Adelanto de Reembolso</strong> para el cliente
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Notas */}
          <div className="space-y-1.5 pt-2 border-t border-gray-800/80">
            <label className="block text-[10px] uppercase font-semibold text-gray-400">Notas Iniciales / Documentación</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Recibidos 2 W-2 de Texas, 1 dependiente con ITIN. Pendiente carta de soporte escolar..."
              className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl p-3 text-white placeholder-gray-600 outline-none resize-none"
            />
          </div>

          {/* Footer buttons */}
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
              <span>{isSubmitting ? "Creando..." : "Crear Expediente Fiscal"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
