"use client";

import { useState } from "react";
import { X, UserPlus, Loader2, CreditCard, ExternalLink, Upload, CheckCircle2, ChevronRight, ChevronLeft, Lock } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

interface CreditRepairIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const FEE_PAYMENT_LINK = "https://link.fastpaydirect.com/payment-link/6a8688d6f9c8c807930b9166";
const OFFICIAL_FORM_LINK = "https://api.leadconnectorhq.com/widget/form/hXr9MAZMR8AHID3LC5cg";

const CRC_PLATFORMS = ["IdentityIQ", "SmartCredit", "MyFreeScoreNow", "MyScoreIQ", "PrivacyGuard", "Otro"];

export default function CreditRepairIntakeModal({ isOpen, onClose, onSuccess }: CreditRepairIntakeModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [hasPaidConfirmed, setHasPaidConfirmed] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [hasExistingSubscription, setHasExistingSubscription] = useState<boolean | null>(null);
  const [existingPlatform, setExistingPlatform] = useState(CRC_PLATFORMS[0]);
  const [idType, setIdType] = useState<"ssn" | "itin">("ssn");
  const [credentialEmail, setCredentialEmail] = useState("");
  const [credentialPassword, setCredentialPassword] = useState("");
  const [credentialToken, setCredentialToken] = useState("");
  const [last4Ssn, setLast4Ssn] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setStep(1);
    setProofFile(null);
    setHasPaidConfirmed(false);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setNotes("");
    setHasExistingSubscription(null);
    setExistingPlatform(CRC_PLATFORMS[0]);
    setIdType("ssn");
    setCredentialEmail("");
    setCredentialPassword("");
    setCredentialToken("");
    setLast4Ssn("");
    setError("");
    setWarning("");
    setSuccess(false);
    onClose();
  };

  const canAdvanceToStep2 = hasPaidConfirmed && Boolean(proofFile);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setWarning("");

    if (hasExistingSubscription === null) {
      setError("Indica si el cliente ya tiene una suscripción activa compatible con Credit Repair Cloud.");
      return;
    }
    if (!proofFile) {
      setError("Falta el comprobante de pago del fee.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (!user) {
        throw new Error("No hay sesión activa");
      }

      const token = await user.getIdToken();

      const body = new FormData();
      body.append("firstName", firstName);
      body.append("lastName", lastName);
      body.append("email", email);
      body.append("phone", phone);
      body.append("notes", notes);
      body.append("hasExistingSubscription", String(hasExistingSubscription));
      body.append("existingPlatform", hasExistingSubscription ? existingPlatform : "");
      body.append("idType", idType);
      body.append("credentialEmail", credentialEmail);
      body.append("credentialPassword", idType === "ssn" ? credentialPassword : "");
      body.append("credentialToken", idType === "itin" ? credentialToken : "");
      body.append("last4Ssn", idType === "ssn" ? last4Ssn : "");
      body.append("proof", proofFile);

      const response = await fetch("/api/services/credit-repair-intake", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al procesar la solicitud");
      }

      if (data.warning) setWarning(data.warning);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        resetAndClose();
      }, data.warning ? 5000 : 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0A182D] border border-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#0A182D] border-b border-gray-800 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Admitir Cliente — Reparación de Crédito</h2>
            <p className="text-sm text-gray-400 mt-1">Paso {step} de 2 · {step === 1 ? "Pago del fee" : "Datos y acceso a historial crediticio"}</p>
          </div>
          <button onClick={resetAndClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {step === 1 && (
          <div className="p-6 space-y-5">
            <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm">
                <CreditCard size={18} />
                <span>Fee de $10 requerido antes de continuar</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                El cliente debe pagar el fee de $10 usando el enlace oficial de E360 antes de llenar el formulario.
                Este mismo fee se repite en cada ronda mensual de seguimiento.
              </p>
              <a
                href={FEE_PAYMENT_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg text-xs transition-colors"
              >
                <span>Abrir Enlace de Pago ($10)</span>
                <ExternalLink size={14} />
              </a>
            </div>

            <label className="flex items-start gap-3 p-3 bg-[#05101F] border border-gray-800 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={hasPaidConfirmed}
                onChange={(e) => setHasPaidConfirmed(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-xs text-gray-300">El cliente ya pagó el fee de $10 usando el enlace de arriba.</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Comprobante de pago *
              </label>
              <label className="flex items-center gap-3 px-4 py-3 bg-[#05101F] border border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-cyan-500 transition-colors">
                <Upload size={18} className="text-gray-500 shrink-0" />
                <span className="text-xs text-gray-400 truncate">
                  {proofFile ? proofFile.name : "Sube una captura o PDF del pago (máx. 4MB)"}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  className="hidden"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={resetAndClose}
                className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!canAdvanceToStep2}
                onClick={() => setStep(2)}
                className="flex-1 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Continuar al Formulario</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nombre *</label>
                <input
                  type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2 bg-[#05101F] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="Juan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Apellido</label>
                <input
                  type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2 bg-[#05101F] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="Pérez"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-[#05101F] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="juan@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Teléfono</label>
                <input
                  type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 bg-[#05101F] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <a
              href={OFFICIAL_FORM_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 bg-[#05101F] border border-gray-800 rounded-lg text-xs text-cyan-400 hover:border-cyan-500/50 transition-colors"
            >
              <span>Recuerda también completar el formulario oficial de aplicación en GHL</span>
              <ExternalLink size={14} className="shrink-0" />
            </a>

            <div className="p-4 bg-[#05101F] border border-gray-800 rounded-lg space-y-3">
              <p className="text-sm font-medium text-gray-300">
                ¿El cliente ya tiene una suscripción activa compatible con Credit Repair Cloud?
              </p>
              <p className="text-[11px] text-gray-500">Plataformas compatibles: IdentityIQ, SmartCredit, MyFreeScoreNow, MyScoreIQ, PrivacyGuard.</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setHasExistingSubscription(true)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold border transition-colors ${
                    hasExistingSubscription === true ? "bg-cyan-500 text-black border-cyan-400" : "bg-transparent text-gray-400 border-gray-700"
                  }`}
                >
                  Sí, ya tiene
                </button>
                <button
                  type="button"
                  onClick={() => setHasExistingSubscription(false)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold border transition-colors ${
                    hasExistingSubscription === false ? "bg-cyan-500 text-black border-cyan-400" : "bg-transparent text-gray-400 border-gray-700"
                  }`}
                >
                  No, hay que crearla
                </button>
              </div>

              {hasExistingSubscription === true && (
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">Plataforma</label>
                  <select
                    value={existingPlatform}
                    onChange={(e) => setExistingPlatform(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0A182D] border border-gray-700 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                  >
                    {CRC_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              )}
            </div>

            {hasExistingSubscription !== null && (
              <div className="p-4 bg-[#05101F] border border-amber-500/20 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
                  <Lock size={14} />
                  <span>Acceso al historial crediticio (se guarda cifrado)</span>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIdType("ssn")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                      idType === "ssn" ? "bg-cyan-500 text-black border-cyan-400" : "bg-transparent text-gray-400 border-gray-700"
                    }`}
                  >
                    Tiene SSN
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdType("itin")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                      idType === "itin" ? "bg-cyan-500 text-black border-cyan-400" : "bg-transparent text-gray-400 border-gray-700"
                    }`}
                  >
                    Tiene ITIN
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">
                    Correo {idType === "itin" ? "de MyFreeScoreNow" : "de la plataforma"} *
                  </label>
                  <input
                    type="email" required value={credentialEmail} onChange={(e) => setCredentialEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0A182D] border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                {idType === "ssn" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1.5">Contraseña *</label>
                      <input
                        type="password" required value={credentialPassword} onChange={(e) => setCredentialPassword(e.target.value)}
                        className="w-full px-4 py-2 bg-[#0A182D] border border-gray-700 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1.5">Últimos 4 del SSN *</label>
                      <input
                        type="text" required maxLength={4} pattern="[0-9]{4}" value={last4Ssn}
                        onChange={(e) => setLast4Ssn(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        className="w-full px-4 py-2 bg-[#0A182D] border border-gray-700 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                        placeholder="1234"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Token de MyFreeScoreNow *</label>
                    <input
                      type="text" required value={credentialToken} onChange={(e) => setCredentialToken(e.target.value)}
                      className="w-full px-4 py-2 bg-[#0A182D] border border-gray-700 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Notas Adicionales</label>
              <textarea
                value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                className="w-full px-4 py-2 bg-[#05101F] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none resize-none"
                placeholder="Información adicional sobre el caso..."
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
            {success && !warning && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-400">✓ Cliente admitido, comprobante guardado y sincronizado con el CRM.</p>
              </div>
            )}
            {success && warning && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-sm text-amber-400">⚠️ {warning}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <ChevronLeft size={16} />
                <span>Atrás</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    <span>Admitir Cliente</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {success && (
          <div className="px-6 pb-6 flex items-center gap-2 text-emerald-400 text-xs">
            <CheckCircle2 size={14} />
            <span>Comprobante guardado para verificación de la ronda 1 del fee.</span>
          </div>
        )}
      </div>
    </div>
  );
}
