"use client";

import { useState } from "react";
import { ArrowLeft, Sparkles, Save, UploadCloud, Plus, Trash2, ArrowUp, ArrowDown, CheckCircle2, Clock, Inbox, X } from "lucide-react";
import { TaxFormTemplate, TaxFormPage, TaxFormField, TaxFormFieldType, TaxFormSubmission } from "../../types";

interface TaxOfficeFormBuilderProps {
  form: TaxFormTemplate;
  onClose: () => void;
  onSave: (patch: Partial<TaxFormTemplate>) => Promise<boolean>;
  onPublish: () => Promise<boolean>;
  onAiAssist: (description: string) => Promise<TaxFormField[] | null>;
  onUploadAttachment: (file: File) => Promise<boolean>;
  onFetchSubmissions: () => Promise<TaxFormSubmission[]>;
}

const FIELD_TYPE_OPTIONS: { value: TaxFormFieldType; label: string }[] = [
  { value: "short_text", label: "Short text" },
  { value: "long_text", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "currency", label: "Currency" },
  { value: "percentage", label: "Percentage" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "address", label: "Address" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
  { value: "dropdown", label: "Dropdown" },
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "checkbox", label: "Checkbox" },
  { value: "checkbox_group", label: "Checkbox group" },
  { value: "yes_no", label: "Yes / No" },
  { value: "multi_select", label: "Multi-select" },
  { value: "rating", label: "Rating" },
  { value: "preparer", label: "Preparer (team member)" },
];

const CHOICE_TYPES: TaxFormFieldType[] = ["dropdown", "multiple_choice", "checkbox_group", "multi_select"];

export default function TaxOfficeFormBuilder({ form, onClose, onSave, onPublish, onAiAssist, onUploadAttachment, onFetchSubmissions }: TaxOfficeFormBuilderProps) {
  const [name, setName] = useState(form.name);
  const [headerText, setHeaderText] = useState(form.headerText || "");
  const [logoUrl, setLogoUrl] = useState(form.logoUrl || "");
  const [logoSize, setLogoSize] = useState(form.logoSize);
  const [logoAlignment, setLogoAlignment] = useState(form.logoAlignment);
  const [pages, setPages] = useState<TaxFormPage[]>(form.pages);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [submissions, setSubmissions] = useState<TaxFormSubmission[] | null>(null);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  const handleOpenSubmissions = async () => {
    setShowSubmissions(true);
    setIsLoadingSubmissions(true);
    const result = await onFetchSubmissions();
    setSubmissions(result);
    setIsLoadingSubmissions(false);
  };

  const activePage = pages[activePageIndex];
  const activeSection = activePage?.sections[0];

  const updateFields = (updater: (fields: TaxFormField[]) => TaxFormField[]) => {
    setPages((prev) =>
      prev.map((p, pIdx) =>
        pIdx !== activePageIndex
          ? p
          : { ...p, sections: p.sections.map((s, sIdx) => (sIdx === 0 ? { ...s, fields: updater(s.fields) } : s)) }
      )
    );
  };

  const addField = () => {
    updateFields((fields) => [...fields, { id: `field-${Date.now()}`, type: "short_text", label: "Nueva pregunta", required: false }]);
  };

  const removeField = (fieldId: string) => {
    updateFields((fields) => fields.filter((f) => f.id !== fieldId));
  };

  const moveField = (fieldId: string, direction: "up" | "down") => {
    updateFields((fields) => {
      const index = fields.findIndex((f) => f.id === fieldId);
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (index === -1 || newIndex < 0 || newIndex >= fields.length) return fields;
      const copy = fields.slice();
      [copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
      return copy;
    });
  };

  const patchField = (fieldId: string, patch: Partial<TaxFormField>) => {
    updateFields((fields) => fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)));
  };

  const addPage = () => {
    const newPage: TaxFormPage = { id: `page-${Date.now()}`, name: `Página ${pages.length + 1}`, sections: [{ id: `section-${Date.now()}`, name: "Sección", fields: [] }] };
    setPages((prev) => [...prev, newPage]);
    setActivePageIndex(pages.length);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave({ name, headerText, logoUrl, logoSize, logoAlignment, pages });
    setIsSaving(false);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    await handleSave();
    await onPublish();
    setIsPublishing(false);
  };

  const handleGenerate = async () => {
    if (!aiDescription.trim()) return;
    setIsGenerating(true);
    const fields = await onAiAssist(aiDescription.trim());
    setIsGenerating(false);
    if (fields && fields.length > 0) {
      updateFields((existing) => [...existing, ...fields]);
      setAiDescription("");
      setShowAiPanel(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    await onUploadAttachment(file);
    setIsUploading(false);
    e.target.value = "";
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onClose} className="p-2 rounded-xl bg-[#05101F] border border-gray-800 text-gray-400 hover:text-white cursor-pointer shrink-0">
            <ArrowLeft size={16} />
          </button>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-transparent text-base font-extrabold text-white outline-none border-b border-transparent focus:border-cyan-400 min-w-0"
          />
          <span
            className={`shrink-0 inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
              form.status === "published" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}
          >
            {form.status === "published" ? <CheckCircle2 size={10} /> : <Clock size={10} />}
            {form.status === "published" ? `Published v${form.version}` : "Draft"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {form.status === "published" && (
            <button
              onClick={handleOpenSubmissions}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#05101F] text-gray-300 border border-gray-800 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Inbox size={14} />
              <span>Submissions</span>
            </button>
          )}
          <button
            onClick={() => setShowAiPanel((prev) => !prev)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles size={14} />
            <span>AI assistant</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#05101F] text-gray-300 border border-gray-800 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save size={14} />
            <span>{isSaving ? "Saving..." : "Save draft"}</span>
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,224,240,0.3)] transition-all cursor-pointer disabled:opacity-50"
          >
            {isPublishing ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>

      {showAiPanel && (
        <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-900/40 space-y-3">
          <p className="text-xs text-purple-200 font-semibold">Describe qué necesitas capturar y la IA genera los campos por ti:</p>
          <textarea
            value={aiDescription}
            onChange={(e) => setAiDescription(e.target.value)}
            rows={2}
            placeholder="Ej. Necesito saber el número de dependientes, si tiene seguro médico, y el banco para depósito directo."
            className="w-full bg-[#05101F] border border-gray-800 focus:border-purple-400 rounded-xl px-3 py-2 text-white text-xs outline-none resize-none"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !aiDescription.trim()}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white font-extrabold text-xs rounded-xl cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? "Generando..." : "Generate fields"}
          </button>
        </div>
      )}

      <div className="p-5 rounded-2xl bg-[#0A182D]/80 border border-gray-800 space-y-4">
        <h4 className="text-[10px] uppercase font-bold text-gray-400">Form header</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Logo URL</label>
            <input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white text-xs outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Header text</label>
            <input
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white text-xs outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-gray-500">Logo size</span>
            {(["sm", "md", "lg"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setLogoSize(s)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer ${logoSize === s ? "bg-cyan-500/20 text-cyan-300" : "bg-[#05101F] text-gray-500"}`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-gray-500">Alignment</span>
            {(["left", "center"] as const).map((a) => (
              <button
                key={a}
                onClick={() => setLogoAlignment(a)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize cursor-pointer ${logoAlignment === a ? "bg-cyan-500/20 text-cyan-300" : "bg-[#05101F] text-gray-500"}`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <div className="pt-2 border-t border-gray-800">
          <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Upload document (PDF)</label>
          <div className="flex items-center gap-3">
            <label className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#05101F] text-gray-300 border border-gray-800 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 w-fit">
              <UploadCloud size={14} />
              <span>{isUploading ? "Subiendo..." : "Choose file"}</span>
              <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
            </label>
            {form.attachmentName && <span className="text-[11px] text-gray-400">📎 {form.attachmentName}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto">
        {pages.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setActivePageIndex(i)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors shrink-0 cursor-pointer ${
              activePageIndex === i ? "bg-cyan-500/20 text-cyan-300 border-cyan-400" : "bg-[#05101F] text-gray-400 border-gray-800 hover:text-white"
            }`}
          >
            {p.name}
          </button>
        ))}
        <button
          onClick={addPage}
          className="px-3 py-1.5 rounded-full text-[11px] font-bold border border-dashed border-gray-700 text-gray-400 hover:text-white cursor-pointer shrink-0 flex items-center gap-1"
        >
          <Plus size={12} />
          <span>Add page</span>
        </button>
      </div>

      <div className="p-5 rounded-2xl bg-[#0A182D]/80 border border-gray-800 space-y-3">
        {!activeSection || activeSection.fields.length === 0 ? (
          <p className="text-center text-gray-500 text-xs italic py-6">Drag a block here — o dale a &ldquo;Add field&rdquo; abajo.</p>
        ) : (
          activeSection.fields.map((f, i) => (
            <div key={f.id} className="p-3.5 rounded-xl bg-[#05101F] border border-gray-800 space-y-2.5">
              <div className="flex items-center gap-2">
                <input
                  value={f.label}
                  onChange={(e) => patchField(f.id, { label: e.target.value })}
                  className="flex-1 bg-transparent text-sm font-semibold text-white outline-none border-b border-transparent focus:border-cyan-400"
                />
                <select
                  value={f.type}
                  onChange={(e) => patchField(f.id, { type: e.target.value as TaxFormFieldType })}
                  className="bg-[#0A182D] border border-gray-800 rounded-lg px-2 py-1 text-[11px] text-white outline-none cursor-pointer"
                >
                  {FIELD_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1 text-[10px] text-gray-400 cursor-pointer">
                  <input type="checkbox" checked={f.required} onChange={(e) => patchField(f.id, { required: e.target.checked })} />
                  Required
                </label>
                <button onClick={() => moveField(f.id, "up")} disabled={i === 0} className="p-1 text-gray-500 hover:text-white disabled:opacity-20 cursor-pointer">
                  <ArrowUp size={13} />
                </button>
                <button
                  onClick={() => moveField(f.id, "down")}
                  disabled={i === activeSection.fields.length - 1}
                  className="p-1 text-gray-500 hover:text-white disabled:opacity-20 cursor-pointer"
                >
                  <ArrowDown size={13} />
                </button>
                <button onClick={() => removeField(f.id)} className="p-1 text-red-400 hover:text-red-300 cursor-pointer">
                  <Trash2 size={13} />
                </button>
              </div>
              {CHOICE_TYPES.includes(f.type) && (
                <input
                  value={(f.options || []).join(", ")}
                  onChange={(e) => patchField(f.id, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })}
                  placeholder="Opciones separadas por coma"
                  className="w-full bg-[#0A182D] border border-gray-800 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none"
                />
              )}
            </div>
          ))
        )}
        <button
          onClick={addField}
          className="w-full py-2.5 rounded-xl border border-dashed border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Plus size={14} />
          <span>Add field</span>
        </button>
      </div>

      {showSubmissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0A182D] border border-cyan-500/30 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[#05101F]">
              <h3 className="font-bold text-sm text-white">Submissions — {form.name}</h3>
              <button onClick={() => setShowSubmissions(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-3 text-xs">
              {isLoadingSubmissions ? (
                <p className="text-center text-gray-500 py-6">Cargando...</p>
              ) : !submissions || submissions.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Inbox size={28} className="mx-auto text-gray-600" />
                  <p className="text-gray-500">Nadie ha enviado este formulario todavía.</p>
                </div>
              ) : (
                submissions.map((s) => (
                  <div key={s.id} className="p-3.5 rounded-xl bg-[#05101F] border border-gray-800">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{s.clientName || "Sin nombre"}</span>
                      <span className="text-[10px] text-gray-500 font-mono">{new Date(s.submittedAt).toLocaleString("es-US")}</span>
                    </div>
                    {s.clientEmail && <p className="text-[11px] text-gray-400">{s.clientEmail}</p>}
                    <div className="mt-2 space-y-1">
                      {Object.entries(s.answers).map(([key, value]) => (
                        <p key={key} className="text-[11px] text-gray-300">
                          <span className="text-gray-500">{key}:</span> {Array.isArray(value) ? value.join(", ") : String(value)}
                        </p>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
