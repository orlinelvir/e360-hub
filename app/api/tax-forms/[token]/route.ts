import { NextResponse } from "next/server";
import { getPublishedTaxFormByToken, submitTaxForm } from "@/lib/services/tax-office-service";
import { NewTaxFormSubmissionInput } from "@/app/hub/broker-onboarding/types";

// Límites generosos para cualquier formulario real, pero suficientes para
// rechazar con un 400 claro en vez de dejar que un payload gigante o
// malformado llegue a Firestore y falle recién ahí con un 500 genérico (o,
// en el peor caso, agote el límite de 1MB por documento de Firestore).
const MAX_ANSWER_FIELDS = 200;
const MAX_ANSWER_VALUE_LENGTH = 20_000;

function validateAnswers(answers: unknown): string | null {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return "Las respuestas del formulario tienen un formato inválido";
  }
  const entries = Object.entries(answers as Record<string, unknown>);
  if (entries.length === 0) {
    return "El formulario no tiene respuestas";
  }
  if (entries.length > MAX_ANSWER_FIELDS) {
    return "El formulario tiene demasiados campos";
  }
  for (const [, value] of entries) {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      return "Las respuestas del formulario tienen un formato inválido";
    }
    if (JSON.stringify(value ?? "").length > MAX_ANSWER_VALUE_LENGTH) {
      return "Una de las respuestas es demasiado larga";
    }
  }
  return null;
}

/**
 * Ruta pública (sin autenticación) para que un cliente llene un formulario
 * publicado desde su link único. El token es la única credencial — nunca se
 * expone el uid del broker ni nada que no sea seguro de ver sin login.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await getPublishedTaxFormByToken(token);
  if (!result) {
    return NextResponse.json({ error: "Este formulario no existe o ya no está disponible" }, { status: 404 });
  }

  const { form } = result;
  return NextResponse.json({
    form: {
      name: form.name,
      headerText: form.headerText,
      logoUrl: form.logoUrl,
      logoSize: form.logoSize,
      logoAlignment: form.logoAlignment,
      pages: form.pages,
      version: form.version,
      attachmentName: form.attachmentName,
      hasAttachment: Boolean(form.attachmentStoragePath)
    }
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await getPublishedTaxFormByToken(token);
  if (!result) {
    return NextResponse.json({ error: "Este formulario no existe o ya no está disponible" }, { status: 404 });
  }

  const { brokerId, form } = result;
  const body = (await request.json()) as Partial<NewTaxFormSubmissionInput>;
  const validationError = validateAnswers(body.answers);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    await submitTaxForm(brokerId, form.id, form.version, {
      clientName: body.clientName?.trim(),
      clientEmail: body.clientEmail?.trim(),
      answers: body.answers as NewTaxFormSubmissionInput["answers"]
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error enviando formulario fiscal público:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
