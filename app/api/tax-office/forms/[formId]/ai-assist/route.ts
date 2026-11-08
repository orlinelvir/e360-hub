import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole } from "@/lib/roles";
import { generateGeminiJson } from "@/lib/ai/gemini";
import { hasTaxOfficeAccess, getTaxFormTemplates, updateTaxFormTemplate } from "@/lib/services/tax-office-service";
import { TaxFormField, TaxFormFieldType } from "@/app/hub/broker-onboarding/types";

const VALID_TYPES: TaxFormFieldType[] = [
  "short_text", "long_text", "number", "currency", "percentage",
  "email", "phone", "address", "date", "time",
  "dropdown", "multiple_choice", "checkbox", "checkbox_group",
  "yes_no", "multi_select", "rating", "preparer"
];

const SYSTEM_INSTRUCTION = `Eres un asistente que diseña campos para un formulario de admisión/contrato de una oficina de preparación de impuestos en EE.UU.
Dada una descripción en español o inglés de lo que el formulario necesita capturar, responde ÚNICAMENTE un JSON con esta forma exacta:
{"fields": [{"label": string, "type": one of [${VALID_TYPES.join(", ")}], "required": boolean, "options": string[] optional, only for dropdown/multiple_choice/checkbox_group/multi_select}]}
Usa "currency" para montos en dólares, "percentage" para porcentajes, "yes_no" para preguntas de sí/no, "preparer" solo si se pide explícitamente asignar un preparador del equipo.
No incluyas campos de firma ni de nombre/correo/teléfono genéricos salvo que se pidan explícitamente — esos ya se agregan aparte. Máximo 15 campos. No agregues texto fuera del JSON.`;

export async function POST(request: Request, { params }: { params: Promise<{ formId: string }> }) {
  const user = await verifyAuthToken(request);
  if (!user || !adminDb) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await resolveUserRole(adminDb, user.uid, user.email);
  if (!(await hasTaxOfficeAccess(user.uid, role))) {
    return NextResponse.json({ error: "Oficina Virtual E360 no está activa para esta cuenta" }, { status: 403 });
  }

  const { formId } = await params;
  const body = (await request.json()) as { description?: string };
  if (!body.description?.trim()) {
    return NextResponse.json({ error: "Describe qué debe capturar el formulario" }, { status: 400 });
  }

  const forms = await getTaxFormTemplates(user.uid);
  const form = forms.find((f) => f.id === formId);
  if (!form) {
    return NextResponse.json({ error: "Formulario no encontrado" }, { status: 404 });
  }

  try {
    const raw = (await generateGeminiJson(SYSTEM_INSTRUCTION, body.description.trim(), [], { maxOutputTokens: 2048 })) as {
      fields?: Array<{ label?: string; type?: string; required?: boolean; options?: string[] }>;
    };

    const generatedFields: TaxFormField[] = (raw.fields || [])
      .filter((f) => f.label?.trim() && f.type && VALID_TYPES.includes(f.type as TaxFormFieldType))
      .slice(0, 15)
      .map((f, i) => ({
        id: `field-ai-${Date.now()}-${i}`,
        type: f.type as TaxFormFieldType,
        label: f.label!.trim(),
        required: Boolean(f.required),
        options: Array.isArray(f.options) ? f.options.filter(Boolean).map(String) : undefined
      }));

    if (generatedFields.length === 0) {
      return NextResponse.json({ error: "No se pudieron generar campos a partir de esa descripción" }, { status: 422 });
    }

    const pages = form.pages.length > 0 ? form.pages : [{ id: `page-${Date.now()}`, name: "Página 1", sections: [{ id: `section-${Date.now()}`, name: "Sección", fields: [] }] }];
    const updatedPages = pages.map((page, pIdx) =>
      pIdx === 0
        ? {
            ...page,
            sections: page.sections.length > 0
              ? page.sections.map((section, sIdx) => (sIdx === 0 ? { ...section, fields: [...section.fields, ...generatedFields] } : section))
              : [{ id: `section-${Date.now()}`, name: "Sección", fields: generatedFields }]
          }
        : page
    );

    await updateTaxFormTemplate(user.uid, formId, { pages: updatedPages });
    return NextResponse.json({ success: true, fields: generatedFields, pages: updatedPages });
  } catch (error) {
    console.error("Error generando campos con IA para formulario fiscal:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
