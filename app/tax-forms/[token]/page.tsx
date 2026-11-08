"use client";

import { useEffect, useState, use } from "react";
import { CheckCircle2, Loader2, FileWarning, Download } from "lucide-react";

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
}

interface FormSection {
  id: string;
  name: string;
  fields: FormField[];
}

interface FormPage {
  id: string;
  name: string;
  sections: FormSection[];
}

interface PublicForm {
  name: string;
  headerText?: string;
  logoUrl?: string;
  logoSize: "sm" | "md" | "lg";
  logoAlignment: "left" | "center";
  pages: FormPage[];
  attachmentName?: string;
  hasAttachment: boolean;
}

type AnswerValue = string | number | boolean | string[];

export default function PublicTaxFormPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [form, setForm] = useState<PublicForm | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/tax-forms/${token}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setLoadError(data.error || "Este formulario no está disponible.");
        } else {
          setForm(data.form);
        }
      } catch {
        if (!cancelled) setLoadError("No se pudo cargar el formulario. Intenta de nuevo más tarde.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const setAnswer = (fieldId: string, value: AnswerValue) => setAnswers((prev) => ({ ...prev, [fieldId]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tax-forms/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName, clientEmail, answers })
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

  if (!form) {
    return (
      <div className="min-h-screen bg-[#f5f1e6] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#0A182D]" />
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#f5f1e6] flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-3 bg-white rounded-2xl shadow-lg p-8">
          <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
          <h1 className="text-lg font-bold text-[#0A182D]">¡Gracias!</h1>
          <p className="text-sm text-gray-600">Tu formulario fue recibido correctamente. Nos pondremos en contacto contigo pronto.</p>
        </div>
      </div>
    );
  }

  const logoWidth = form.logoSize === "sm" ? 100 : form.logoSize === "lg" ? 220 : 160;

  return (
    <div className="min-h-screen bg-[#f5f1e6] py-10 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-[#0A182D] px-8 py-6" style={{ textAlign: form.logoAlignment }}>
          {form.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.logoUrl} alt={form.name} style={{ width: logoWidth, display: "inline-block" }} />
          ) : (
            <span className="text-white font-extrabold text-xl tracking-wide">EMPRENDE 360</span>
          )}
        </div>
        <div className="h-1 bg-[#D4AF37]" />

        <div className="px-8 py-6 border-b border-gray-100">
          <h1 className="text-lg font-bold text-[#0A182D]">{form.name}</h1>
          {form.headerText && <p className="text-sm text-gray-600 mt-1">{form.headerText}</p>}
          {form.hasAttachment && (
            <a
              href={`/api/tax-forms/${token}/attachment`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A182D] underline"
            >
              <Download size={13} />
              {form.attachmentName ? `Descargar ${form.attachmentName}` : "Descargar documento adjunto"}
            </a>
          )}
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre completo</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0A182D]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Correo electrónico</label>
              <input
                type="email"
                required
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0A182D]"
              />
            </div>
          </div>

          {form.pages.map((page) => (
            <div key={page.id} className="space-y-4 pt-2 border-t border-gray-100">
              {page.sections.map((section) =>
                section.fields.map((field) => (
                  <FieldInput key={field.id} field={field} value={answers[field.id]} onChange={(v) => setAnswer(field.id, v)} />
                ))
              )}
            </div>
          ))}

          {submitError && <p className="text-xs text-red-600 font-semibold">{submitError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#0A182D] hover:bg-[#13284a] text-white font-bold text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Enviando..." : "Enviar"}
          </button>
        </form>
      </div>
    </div>
  );
}

function FieldInput({ field, value, onChange }: { field: FormField; value: AnswerValue | undefined; onChange: (value: AnswerValue) => void }) {
  const label = (
    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
      {field.label}
      {field.required && <span className="text-red-500"> *</span>}
    </label>
  );

  switch (field.type) {
    case "long_text":
      return (
        <div>
          {label}
          <textarea
            required={field.required}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0A182D] resize-none"
          />
        </div>
      );
    case "number":
    case "currency":
    case "percentage":
      return (
        <div>
          {label}
          <input
            type="number"
            required={field.required}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0A182D]"
          />
        </div>
      );
    case "email":
      return (
        <div>
          {label}
          <input
            type="email"
            required={field.required}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0A182D]"
          />
        </div>
      );
    case "phone":
      return (
        <div>
          {label}
          <input
            type="tel"
            required={field.required}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0A182D]"
          />
        </div>
      );
    case "date":
      return (
        <div>
          {label}
          <input
            type="date"
            required={field.required}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0A182D]"
          />
        </div>
      );
    case "time":
      return (
        <div>
          {label}
          <input
            type="time"
            required={field.required}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0A182D]"
          />
        </div>
      );
    case "dropdown":
      return (
        <div>
          {label}
          <select
            required={field.required}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0A182D] bg-white"
          >
            <option value="" disabled>
              Selecciona una opción
            </option>
            {(field.options || []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );
    case "multiple_choice":
    case "yes_no": {
      const options = field.type === "yes_no" ? ["Sí", "No"] : field.options || [];
      return (
        <div>
          {label}
          <div className="space-y-1.5">
            {options.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="radio" name={field.id} required={field.required} checked={value === opt} onChange={() => onChange(opt)} />
                {opt}
              </label>
            ))}
          </div>
        </div>
      );
    }
    case "checkbox_group":
    case "multi_select": {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div>
          {label}
          <div className="space-y-1.5">
            {(field.options || []).map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={(e) => onChange(e.target.checked ? [...selected, opt] : selected.filter((o) => o !== opt))}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      );
    }
    case "checkbox":
      return (
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" required={field.required} checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          {field.label}
        </label>
      );
    case "rating":
      return (
        <div>
          {label}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className={`w-8 h-8 rounded-full text-xs font-bold border cursor-pointer ${
                  Number(value) === n ? "bg-[#0A182D] text-white border-[#0A182D]" : "bg-white text-gray-500 border-gray-300"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      );
    default:
      return (
        <div>
          {label}
          <input
            type="text"
            required={field.required}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0A182D]"
          />
        </div>
      );
  }
}
