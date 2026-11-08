"use client";

import { useState } from "react";
import { Plus, LayoutGrid, FileText, X, Link2, Edit3, CheckCircle2, Clock } from "lucide-react";
import { TaxFormTemplate, NewTaxFormTemplateInput, TaxFormField, TaxFormSubmission } from "../../types";
import { FORM_GALLERY_TEMPLATES } from "./form-gallery-templates";
import TaxOfficeFormBuilder from "./TaxOfficeFormBuilder";

// Función de módulo (no del componente) para que el linter de pureza de React
// no la trate como parte del render — igual que el resto de generadores de
// id temporales de esta sección.
function uniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

interface TaxOfficeFormsTabProps {
  forms: TaxFormTemplate[];
  onAddForm: (input: NewTaxFormTemplateInput) => Promise<TaxFormTemplate | null>;
  onUpdateForm: (formId: string, patch: Partial<TaxFormTemplate>) => Promise<boolean>;
  onPublishForm: (formId: string) => Promise<boolean>;
  onAiAssist: (formId: string, description: string) => Promise<TaxFormField[] | null>;
  onUploadAttachment: (formId: string, file: File) => Promise<boolean>;
  onFetchSubmissions: (formId: string) => Promise<TaxFormSubmission[]>;
}

export default function TaxOfficeFormsTab({ forms, onAddForm, onUpdateForm, onPublishForm, onAiAssist, onUploadAttachment, onFetchSubmissions }: TaxOfficeFormsTabProps) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const editingForm = forms.find((f) => f.id === editingFormId) || null;

  const handleNewForm = async () => {
    const name = window.prompt("Nombre del nuevo formulario:");
    if (!name?.trim()) return;
    setIsCreating(true);
    const form = await onAddForm({ name: name.trim() });
    setIsCreating(false);
    if (form) setEditingFormId(form.id);
  };

  const handleAddFromGallery = async (templateId: string) => {
    const template = FORM_GALLERY_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    setIsCreating(true);
    const form = await onAddForm({ name: template.title, serviceType: template.serviceType });
    if (form) {
      await onUpdateForm(form.id, {
        pages: [{ id: uniqueId("page"), name: "Página 1", sections: [{ id: uniqueId("section"), name: "Sección", fields: template.fields }] }]
      });
    }
    setIsCreating(false);
    setIsGalleryOpen(false);
    if (form) setEditingFormId(form.id);
  };

  if (editingForm) {
    return (
      <TaxOfficeFormBuilder
        form={editingForm}
        onClose={() => setEditingFormId(null)}
        onSave={(patch) => onUpdateForm(editingForm.id, patch)}
        onPublish={() => onPublishForm(editingForm.id)}
        onAiAssist={(description) => onAiAssist(editingForm.id, description)}
        onUploadAttachment={(file) => onUploadAttachment(editingForm.id, file)}
        onFetchSubmissions={() => onFetchSubmissions(editingForm.id)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">Forms &amp; Contracts</h3>
          <p className="text-xs text-gray-400 mt-0.5">Build intake forms and contracts your clients complete from their secure link.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsGalleryOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#05101F] text-gray-300 border border-gray-800 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <LayoutGrid size={14} />
            <span>Template gallery</span>
          </button>
          <button
            onClick={handleNewForm}
            disabled={isCreating}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,224,240,0.3)] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Plus size={16} />
            <span>New form</span>
          </button>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
        {forms.length === 0 ? (
          <div className="py-12 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
              <FileText size={22} />
            </div>
            <p className="text-white font-bold text-sm">No tienes formularios todavía</p>
            <p className="text-gray-400 text-xs leading-relaxed">
              Usa el Template gallery para empezar rápido, o crea uno desde cero con &ldquo;New form&rdquo;.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map((form) => (
              <div key={form.id} className="p-4 rounded-xl bg-[#05101F] border border-gray-800 hover:border-cyan-500/40 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-white text-sm leading-tight">{form.name}</h4>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      form.status === "published"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {form.status === "published" ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                    {form.status === "published" ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  v{form.version} • {form.pages.reduce((acc, p) => acc + p.sections.reduce((a2, s) => a2 + s.fields.length, 0), 0)} campos
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => setEditingFormId(form.id)}
                    className="flex-1 px-3 py-1.5 text-xs font-semibold text-cyan-400 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Edit3 size={12} />
                    <span>Editar</span>
                  </button>
                  {form.status === "published" && (
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/tax-forms/${form.secureToken}`;
                        navigator.clipboard?.writeText(link);
                        window.alert(`Link copiado:\n${link}`);
                      }}
                      title="Copiar link público"
                      className="p-1.5 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <Link2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isGalleryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0A182D] border border-cyan-500/30 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[#05101F]">
              <div>
                <h3 className="font-bold text-sm text-white">Template gallery</h3>
                <p className="text-[11px] text-gray-400">Adding one creates an independent copy in your office.</p>
              </div>
              <button onClick={() => setIsGalleryOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FORM_GALLERY_TEMPLATES.map((t) => (
                <div key={t.id} className="p-4 rounded-xl bg-[#05101F] border border-gray-800">
                  <h4 className="font-bold text-white text-sm">{t.title}</h4>
                  <p className="text-[10px] text-gray-500 mt-1">{t.fieldCount} fields</p>
                  <button
                    onClick={() => handleAddFromGallery(t.id)}
                    disabled={isCreating}
                    className="mt-3 w-full px-3 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-extrabold text-[11px] rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    + Add to my office
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
