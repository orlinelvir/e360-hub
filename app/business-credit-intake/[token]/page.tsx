"use client";

import { useEffect, useState, use } from "react";
import { CheckCircle2, Loader2, FileWarning } from "lucide-react";

interface FormState {
  ownerFullName: string;
  ownerAddress: string;
  ownerCity: string;
  ownerState: string;
  ownerZip: string;
  businessLegalName: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessZip: string;
  ein: string;
  contactEmail: string;
  contactPhone: string;
}

const EMPTY_FORM: FormState = {
  ownerFullName: "",
  ownerAddress: "",
  ownerCity: "",
  ownerState: "",
  ownerZip: "",
  businessLegalName: "",
  businessAddress: "",
  businessCity: "",
  businessState: "",
  businessZip: "",
  ein: "",
  contactEmail: "",
  contactPhone: ""
};

export default function PublicBusinessCreditIntakePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [checking, setChecking] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/business-credit-intake/public/${token}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) setLoadError(data.error || "Este link no está disponible.");
      } catch {
        if (!cancelled) setLoadError("No se pudo verificar el link. Intenta de nuevo más tarde.");
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const setField = (field: keyof FormState, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/business-credit-intake/public/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "No se pudo enviar el formulario.");
      } else {
        setIsSubmitted(true);
      }
    } catch {
      setSubmitError("No se pudo enviar el formulario. Verifica tu conexión e intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#f5f1e6] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#0A182D]" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#f5f1e6] flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-3">
          <FileWarning size={36} className="mx-auto text-amber-500" />
          <p className="text-gray-700 font-semibold">{loadError}</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#f5f1e6] flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-3 bg-white rounded-2xl shadow-lg p-8">
          <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
          <h1 className="text-lg font-bold text-[#0A182D]">¡Gracias!</h1>
          <p className="text-sm text-gray-600">
            Recibimos la información de tu negocio correctamente. Tu asesor se pondrá en contacto contigo para continuar con el trámite.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f1e6] py-10 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-[#0A182D] px-8 py-6 text-center">
          <span className="text-white font-extrabold text-xl tracking-wide">EMPRENDE 360</span>
        </div>
        <div className="h-1 bg-[#D4AF37]" />

        <div className="px-8 py-6 border-b border-gray-100">
          <h1 className="text-lg font-bold text-[#0A182D]">Business Credit Program</h1>
          <p className="text-sm text-gray-600 mt-1">
            Necesitamos estos datos para tramitar tu número D-U-N-S y abrir tus vendor accounts. Solo tu asesor y el equipo de Emprende 360 verán esta información.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Datos del propietario</h2>
            <TextField label="Nombre completo del propietario" value={form.ownerFullName} onChange={(v) => setField("ownerFullName", v)} />
            <TextField label="Dirección personal" value={form.ownerAddress} onChange={(v) => setField("ownerAddress", v)} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextField label="Ciudad" value={form.ownerCity} onChange={(v) => setField("ownerCity", v)} />
              <TextField label="Estado" value={form.ownerState} onChange={(v) => setField("ownerState", v)} />
              <TextField label="Código postal" value={form.ownerZip} onChange={(v) => setField("ownerZip", v)} />
            </div>
          </section>

          <section className="space-y-3 pt-2 border-t border-gray-100">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Datos de la empresa</h2>
            <TextField label="Nombre legal registrado de la empresa" value={form.businessLegalName} onChange={(v) => setField("businessLegalName", v)} />
            <TextField label="Dirección comercial" value={form.businessAddress} onChange={(v) => setField("businessAddress", v)} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextField label="Ciudad" value={form.businessCity} onChange={(v) => setField("businessCity", v)} />
              <TextField label="Estado" value={form.businessState} onChange={(v) => setField("businessState", v)} />
              <TextField label="Código postal" value={form.businessZip} onChange={(v) => setField("businessZip", v)} />
            </div>
            <TextField label="EIN (Federal Tax ID)" value={form.ein} onChange={(v) => setField("ein", v)} placeholder="XX-XXXXXXX" />
          </section>

          <section className="space-y-3 pt-2 border-t border-gray-100">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contacto (opcional)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Correo electrónico</label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setField("contactEmail", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0A182D]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) => setField("contactPhone", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0A182D]"
                />
              </div>
            </div>
          </section>

          {submitError && <p className="text-xs text-red-600 font-semibold">{submitError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#0A182D] hover:bg-[#13284a] text-white font-bold text-sm rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Enviando..." : "Enviar"}
          </button>
        </form>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{label}</label>
      <input
        type="text"
        required
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0A182D]"
      />
    </div>
  );
}
