"use client";

import { useState } from "react";
import { X, UserPlus, Loader2, Upload, ExternalLink, AlertTriangle } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { resolvePipelineCluster } from "@/lib/service-routing";
import { servicesData } from "@/app/hub/broker-onboarding/data/services";

interface AdmisionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  serviceTitle: string;
  serviceCategory: string;
  onSuccess: () => void;
}

export default function AdmisionFormModal({
  isOpen,
  onClose,
  serviceId,
  serviceTitle,
  onSuccess
}: AdmisionFormModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    amount: "",
    notes: ""
  });
  const [applicationFile, setApplicationFile] = useState<File | null>(null);
  const [officialFormConfirmed, setOfficialFormConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  // Requisito de verificación de aplicaciones de Financiamiento: sin uno de estos
  // 2 pasos (formulario oficial de E360 confirmado, o PDF de la subcuenta propia del
  // broker adjunto) no hay ninguna prueba de que el cliente realmente llenó una
  // solicitud, así que se bloquea el envío hasta que se cumpla al menos uno.
  const cluster = resolvePipelineCluster(serviceId, serviceTitle);
  const isFinancingService = cluster === "fondeo_rapido" || cluster === "real_estate";
  const officialFormLink = servicesData.find((s) => s.id === serviceId)?.formLink;
  const financingGateSatisfied = !isFinancingService || officialFormConfirmed || Boolean(applicationFile);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setWarning("");

    if (!financingGateSatisfied) {
      setError("Confirma que el cliente llenó el formulario oficial de E360, o adjunta el PDF de la solicitud de tu subcuenta. Sin uno de los dos, la aplicación no puede completarse.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (!user) {
        throw new Error("No hay sesión activa");
      }

      const token = await user.getIdToken();

      const body = new FormData();
      body.append("firstName", formData.firstName);
      body.append("lastName", formData.lastName);
      body.append("email", formData.email);
      body.append("phone", formData.phone);
      body.append("notes", formData.notes);
      body.append("amount", String(formData.amount ? parseFloat(formData.amount) : 0));
      body.append("serviceId", serviceId);
      body.append("service", serviceTitle);
      body.append("officialFormConfirmed", String(officialFormConfirmed));
      if (applicationFile) {
        body.append("applicationFile", applicationFile);
      }

      const response = await fetch("/api/services/submit", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al procesar la solicitud");
      }

      const data = await response.json();
      if (data.warning) {
        setWarning(data.warning);
      }
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          amount: "",
          notes: ""
        });
        setApplicationFile(null);
        setOfficialFormConfirmed(false);
        setSuccess(false);
        setWarning("");
      }, data.warning ? 5000 : 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0A182D] border border-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#0A182D] border-b border-gray-800 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Admitir Cliente</h2>
            <p className="text-sm text-gray-400 mt-1">{serviceTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-[#05101F] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                placeholder="Juan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Apellido
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#05101F] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                placeholder="Pérez"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-[#05101F] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
              placeholder="juan@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#05101F] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Monto Solicitado (USD)
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#05101F] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
              placeholder="50000"
              min="0"
              step="1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notas Adicionales
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 bg-[#05101F] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none resize-none"
              placeholder="Información adicional sobre el cliente o caso..."
            />
          </div>

          {isFinancingService && (
            <div className="p-4 bg-[#05101F] border border-amber-500/20 rounded-lg space-y-4">
              <p className="text-sm font-medium text-gray-200">
                Verificación de la solicitud <span className="text-amber-400">*</span>
              </p>
              <p className="text-[11px] text-gray-500 -mt-2">
                Es obligatorio completar una de las 2 opciones. Sin esto, la aplicación no puede completarse.
              </p>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-300">Opción 1: Formulario oficial de E360</p>
                {officialFormLink && (
                  <a
                    href={officialFormLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-2.5 bg-[#0A182D] border border-gray-800 rounded-lg text-xs text-cyan-400 hover:border-cyan-500/50 transition-colors"
                  >
                    <span>Abrir Formulario Oficial de E360</span>
                    <ExternalLink size={14} className="shrink-0" />
                  </a>
                )}
                <label className="flex items-start gap-3 p-3 bg-[#0A182D] border border-gray-800 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={officialFormConfirmed}
                    onChange={(e) => setOfficialFormConfirmed(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span className="text-xs text-gray-300">El cliente ya llenó el formulario oficial de E360 (enlace de arriba).</span>
                </label>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <div className="h-px flex-1 bg-gray-800" />
                <span>O</span>
                <div className="h-px flex-1 bg-gray-800" />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-300">Opción 2: PDF de tu propia subcuenta</p>
                <label className="flex items-center gap-3 px-4 py-3 bg-[#0A182D] border border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-cyan-500 transition-colors">
                  <Upload size={18} className="text-gray-500 shrink-0" />
                  <span className="text-xs text-gray-400 truncate">
                    {applicationFile ? applicationFile.name : "Sube el PDF de la solicitud enviada desde tu subcuenta (máx. 8MB)"}
                  </span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setApplicationFile(e.target.files?.[0] || null)}
                  />
                </label>
                <p className="text-[11px] text-gray-500">
                  El PDF del formulario que el cliente llenó en tu propia subcuenta (con tu logo).
                </p>
              </div>

              {!financingGateSatisfied && (
                <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-300">
                    Selecciona la opción 1 o la opción 2 para poder admitir a este cliente.
                  </p>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {success && !warning && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm text-green-400">
                ✓ Cliente admitido y sincronizado con el CRM exitosamente.
              </p>
            </div>
          )}

          {success && warning && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-400">⚠️ {warning}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !financingGateSatisfied}
              className="flex-1 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Admitir Cliente
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
