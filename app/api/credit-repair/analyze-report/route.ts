import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/firebase-admin";
import { checkRateLimit } from "@/lib/services/rate-limit-service";
import { generateGeminiJson, GeminiInlineImage } from "@/lib/ai/gemini";
import { buildCreditReportSystemInstruction, buildCreditReportUserContent, maskSensitive, clipToMaxBytes } from "@/lib/ai/credit-report-prompt";
import { CreditReportAnalysis } from "@/app/hub/broker-onboarding/types";

// Llamada pesada (schema grande, puede incluir varias imágenes) — más que los
// 45s del chat de soporte, que solo genera una respuesta corta.
export const maxDuration = 120;

const RATE_LIMIT_MAX = 8;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hora — cada análisis cuesta tokens reales de Gemini
const MAX_TEXT_BYTES = 225_000;
const MAX_IMAGES = 8;

function isValidAnalysis(d: unknown): d is CreditReportAnalysis {
  if (!d || typeof d !== "object") return false;
  const obj = d as Record<string, unknown>;
  return Array.isArray(obj.scores) && Array.isArray(obj.problemas) && typeof obj.resumen_para_el_broker === "string";
}

export async function POST(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const rateLimit = await checkRateLimit(user.uid, "credit-report-analysis", RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
    if (!rateLimit.allowed) {
      const retryMinutes = Math.ceil((rateLimit.retryAfterMs || 0) / 60000);
      return NextResponse.json(
        { error: `Alcanzaste el límite de análisis por hora. Intenta de nuevo en ${retryMinutes} minuto(s).`, code: "rate_limited" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const rawImages = Array.isArray(body.images) ? body.images : [];
    const rawText = typeof body.text === "string" ? body.text : "";
    const usingImages = rawImages.length > 0;

    if (!usingImages && rawText.trim().length < 200) {
      return NextResponse.json({ error: "El reporte es demasiado corto para analizarlo.", code: "input_invalido" }, { status: 400 });
    }
    if (usingImages && rawImages.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `Sube un máximo de ${MAX_IMAGES} imágenes. Prueba con el PDF o pega el texto en su lugar.`, code: "prompt_too_large" },
        { status: 400 }
      );
    }

    const notes: string[] = [];
    let text = "";
    let images: GeminiInlineImage[] = [];

    if (usingImages) {
      images = rawImages.map((img: { mimeType?: string; data?: string }) => ({
        mimeType: typeof img.mimeType === "string" ? img.mimeType : "image/jpeg",
        data: typeof img.data === "string" ? img.data : ""
      }));
      if (images.some((img) => !img.data)) {
        return NextResponse.json({ error: "No se pudo leer alguna de las imágenes.", code: "image_rejected" }, { status: 400 });
      }
    } else {
      text = maskSensitive(rawText);
      const clipped = clipToMaxBytes(text, MAX_TEXT_BYTES);
      text = clipped.text;
      if (clipped.clipped) {
        notes.push("El reporte era muy largo y se analizó solo la primera parte. Revisa que no falten cuentas.");
      }
    }

    const systemInstruction = buildCreditReportSystemInstruction();
    const userContent = buildCreditReportUserContent(text, usingImages);

    let data: unknown;
    try {
      data = await generateGeminiJson(systemInstruction, userContent, images, { maxOutputTokens: 8192 });
    } catch (err) {
      if (err instanceof Error && err.message === "rate_limit") {
        return NextResponse.json({ error: "Gemini alcanzó su límite de uso. Inténtalo de nuevo en unos minutos.", code: "rate_limited" }, { status: 429 });
      }
      if (err instanceof Error && err.message === "invalid_json") {
        return NextResponse.json({ error: "La respuesta llegó incompleta. Inténtalo otra vez; si se repite, sube menos páginas.", code: "invalid_json" }, { status: 502 });
      }
      console.error("Error llamando a Gemini para análisis de reporte de crédito:", err);
      return NextResponse.json({ error: "Hubo un problema de conexión con el analizador. Inténtalo de nuevo.", code: "upstream_error" }, { status: 502 });
    }

    if (!isValidAnalysis(data)) {
      console.error("Gemini devolvió un JSON con forma inesperada para el reporte de crédito:", data);
      return NextResponse.json({ error: "La respuesta no tuvo el formato esperado. Inténtalo de nuevo.", code: "invalid_json" }, { status: 502 });
    }

    return NextResponse.json({ success: true, analysis: data, notes });
  } catch (error) {
    console.error("Error en analyze-report:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
