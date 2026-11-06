import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/firebase-admin";
import { checkRateLimit } from "@/lib/services/rate-limit-service";
import { generateGeminiJson, GeminiInlineImage } from "@/lib/ai/gemini";
import {
  buildCreditReportSystemInstruction,
  buildCreditReportUserContent,
  buildExtractionSystemInstruction,
  buildExtractionUserContent,
  buildSynthesisUserContent,
  buildVerificationSystemInstruction,
  buildVerificationUserContent,
  maskSensitive,
  clipToMaxBytes
} from "@/lib/ai/credit-report-prompt";
import { CreditReportAnalysis, CreditReportExtractionFindings } from "@/app/hub/broker-onboarding/types";

// Con reportes grandes partidos en fragmentos (ver más abajo), la fase de
// extracción corre en paralelo (acotada por el fragmento más lento), luego
// viene la síntesis, y por último la verificación automática — más que los
// 45s del chat de soporte, que solo genera una respuesta corta y nunca pasa
// por ninguna de estas fases.
export const maxDuration = 180;

const RATE_LIMIT_MAX = 8;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hora — cada análisis cuesta tokens reales de Gemini
const MAX_TEXT_BYTES = 900_000; // tope absoluto de seguridad — un reporte real de 60-90 páginas de texto no se acerca a esto
const MAX_IMAGES = 70; // reportes reales de 3 burós pueden llegar a 60+ páginas — debe coincidir con MAX_PAGES en el cliente
const IMAGE_BATCH_SIZE = 10; // imágenes por llamada de extracción
const TEXT_CHUNK_BYTES = 70_000; // tamaño objetivo por fragmento de texto en la fase de extracción
const EXTRACTION_TIMEOUT_MS = 35_000;
const SYNTHESIS_TIMEOUT_MS = 40_000;

function isValidAnalysis(d: unknown): d is CreditReportAnalysis {
  if (!d || typeof d !== "object") return false;
  const obj = d as Record<string, unknown>;
  return Array.isArray(obj.scores) && Array.isArray(obj.problemas) && typeof obj.resumen_para_el_broker === "string";
}

function isValidFindings(d: unknown): d is CreditReportExtractionFindings {
  if (!d || typeof d !== "object") return false;
  const obj = d as Record<string, unknown>;
  return Array.isArray(obj.hallazgos) && Array.isArray(obj.scores_vistos);
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Parte un texto grande en fragmentos de hasta maxBytesPerChunk, respetando
 * los cortes de página ("--- Página N ---", que ya vienen de la extracción de
 * PDF en el cliente) cuando existen, para no partir una cuenta a la mitad.
 */
function splitTextIntoChunks(text: string, maxBytesPerChunk: number): string[] {
  const enc = new TextEncoder();
  if (enc.encode(text).length <= maxBytesPerChunk) return [text];

  const pageUnits = text.split(/(?=--- Página \d+ ---)/g).filter(Boolean);
  const chunks: string[] = [];

  if (pageUnits.length > 1) {
    let current = "";
    for (const unit of pageUnits) {
      if (current && enc.encode(current + unit).length > maxBytesPerChunk) {
        chunks.push(current);
        current = unit;
      } else {
        current += unit;
      }
    }
    if (current) chunks.push(current);
  } else {
    let rest = text;
    while (enc.encode(rest).length > maxBytesPerChunk) {
      const piece = clipToMaxBytes(rest, maxBytesPerChunk).text;
      chunks.push(piece);
      rest = rest.slice(piece.length);
    }
    if (rest) chunks.push(rest);
  }
  return chunks;
}

function combineFindings(all: CreditReportExtractionFindings[]): CreditReportExtractionFindings {
  return {
    scores_vistos: all.flatMap((f) => f.scores_vistos || []),
    hallazgos: all.flatMap((f) => f.hallazgos || []),
    tarjetas_utilizacion: all.flatMap((f) => f.tarjetas_utilizacion || []),
    notas_consistencia: all.flatMap((f) => f.notas_consistencia || []),
    cosas_positivas_vistas: all.flatMap((f) => f.cosas_positivas_vistas || [])
  };
}

async function extractOneChunk(
  text: string,
  images: GeminiInlineImage[],
  usingImages: boolean,
  idx: number,
  total: number
): Promise<CreditReportExtractionFindings | null> {
  try {
    const systemInstruction = buildExtractionSystemInstruction();
    const userContent = buildExtractionUserContent(text, usingImages, idx, total);
    const data = await generateGeminiJson(systemInstruction, userContent, images, {
      models: ["gemini-3.6-flash"],
      timeoutMs: EXTRACTION_TIMEOUT_MS,
      maxOutputTokens: 4096
    });
    if (!isValidFindings(data)) {
      console.error(`Fragmento ${idx + 1}/${total}: JSON de hallazgos con forma inesperada`, data);
      return null;
    }
    return data;
  } catch (err) {
    console.error(`Error extrayendo fragmento ${idx + 1}/${total} del reporte de crédito:`, err);
    return null;
  }
}

/**
 * Última fase, siempre corre: verifica el análisis generado contra los datos
 * en los que se basó (el reporte original para el camino directo, o los
 * hallazgos combinados para el camino fragmentado — nunca se reenvían todas
 * las imágenes originales otra vez, eso reintroduciría el mismo problema de
 * tamaño/tiempo que la fragmentación ya evita). Best-effort: si esta llamada
 * falla, se devuelve el análisis sin verificar en vez de tumbar el resultado.
 */
async function verifyAnalysis(
  draft: unknown,
  text: string,
  images: GeminiInlineImage[],
  usingImages: boolean,
  combinedFindingsJson: string | null
): Promise<{ analysis: unknown; corrections: string[] }> {
  try {
    const sourceLabel = combinedFindingsJson
      ? "Hallazgos ya extraídos de cada fragmento del reporte (el reporte original se dividió por su tamaño):\n" + combinedFindingsJson
      : usingImages
        ? "El reporte está en las imágenes adjuntas."
        : text;
    const verificationImages = combinedFindingsJson ? [] : images;

    const systemInstruction = buildVerificationSystemInstruction();
    const userContent = buildVerificationUserContent(sourceLabel, JSON.stringify(draft));
    const result = await generateGeminiJson(systemInstruction, userContent, verificationImages, {
      models: ["gemini-3.6-flash"],
      timeoutMs: SYNTHESIS_TIMEOUT_MS,
      maxOutputTokens: 8192
    });

    if (!isValidAnalysis(result)) {
      console.error("Verificación automática devolvió un JSON con forma inesperada, se usa el análisis sin verificar:", result);
      return { analysis: draft, corrections: [] };
    }
    const corrections = Array.isArray((result as { correcciones_aplicadas?: unknown }).correcciones_aplicadas)
      ? (result as { correcciones_aplicadas: unknown[] }).correcciones_aplicadas.filter((c): c is string => typeof c === "string")
      : [];
    return { analysis: result, corrections };
  } catch (err) {
    console.error("Error en la verificación automática del análisis (se usa el análisis sin verificar):", err);
    return { analysis: draft, corrections: [] };
  }
}

/**
 * Analiza el reporte completo. Para entradas pequeñas (pocas imágenes o texto
 * corto) hace una sola llamada directa, igual que antes. Para entradas
 * grandes (reportes reales de 60+ páginas), parte el reporte en fragmentos,
 * extrae cada uno por separado EN PARALELO (sin decidir prioridad ni redactar
 * nada todavía — ver buildExtractionSystemInstruction) y combina esos
 * hallazgos en una llamada de síntesis que sí aplica las reglas de
 * cumplimiento y arma el análisis final. Esto evita mandar un reporte enorme
 * en una sola llamada (riesgo real de exceder el tiempo o el tamaño de
 * solicitud permitido) y además hace que el modelo le preste la misma
 * atención a la página 55 que a la página 5. Por último, el análisis (de
 * cualquiera de los dos caminos) pasa por una verificación automática antes
 * de devolverse — ver verifyAnalysis.
 */
async function analyzeReport(
  text: string,
  images: GeminiInlineImage[],
  usingImages: boolean
): Promise<{ analysis: unknown; notes: string[] }> {
  const notes: string[] = [];

  const needsChunking = usingImages ? images.length > IMAGE_BATCH_SIZE : new TextEncoder().encode(text).length > TEXT_CHUNK_BYTES;

  let draft: unknown;
  let combinedFindingsJson: string | null = null;

  if (!needsChunking) {
    const systemInstruction = buildCreditReportSystemInstruction();
    const userContent = buildCreditReportUserContent(text, usingImages);
    draft = await generateGeminiJson(systemInstruction, userContent, images, { maxOutputTokens: 8192 });
  } else {
    const chunks = usingImages ? chunkArray(images, IMAGE_BATCH_SIZE) : splitTextIntoChunks(text, TEXT_CHUNK_BYTES);
    const total = chunks.length;

    const results = await Promise.all(
      chunks.map((chunk, idx) =>
        usingImages
          ? extractOneChunk("", chunk as GeminiInlineImage[], true, idx, total)
          : extractOneChunk(chunk as string, [], false, idx, total)
      )
    );

    const failedCount = results.filter((r) => r === null).length;
    if (failedCount > 0) {
      notes.push(
        failedCount === total
          ? "No se pudo leer ninguna parte del reporte."
          : `${failedCount} de ${total} fragmento(s) del reporte no se pudieron leer — revisa esas páginas manualmente, pueden faltar cuentas.`
      );
    }

    const successful = results.filter((r): r is CreditReportExtractionFindings => r !== null);
    if (successful.length === 0) {
      throw new Error("extraction_failed");
    }

    const combined = combineFindings(successful);
    combinedFindingsJson = JSON.stringify(combined);
    const synthesisSystemInstruction = buildCreditReportSystemInstruction();
    const synthesisUserContent = buildSynthesisUserContent(combinedFindingsJson);
    draft = await generateGeminiJson(synthesisSystemInstruction, synthesisUserContent, [], {
      timeoutMs: SYNTHESIS_TIMEOUT_MS,
      maxOutputTokens: 8192
    });
  }

  const { analysis, corrections } = await verifyAnalysis(draft, text, images, usingImages, combinedFindingsJson);
  if (corrections.length > 0) {
    notes.push("Revisión automática: " + corrections.join("; "));
  }

  return { analysis, notes };
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

    let data: unknown;
    let analysisNotes: string[];
    try {
      const result = await analyzeReport(text, images, usingImages);
      data = result.analysis;
      analysisNotes = result.notes;
    } catch (err) {
      if (err instanceof Error && err.message === "rate_limit") {
        return NextResponse.json({ error: "Gemini alcanzó su límite de uso. Inténtalo de nuevo en unos minutos.", code: "rate_limited" }, { status: 429 });
      }
      if (err instanceof Error && (err.message === "invalid_json" || err.message === "extraction_failed")) {
        return NextResponse.json(
          { error: "La respuesta llegó incompleta. Inténtalo otra vez; si se repite, sube menos páginas.", code: "invalid_json" },
          { status: 502 }
        );
      }
      console.error("Error llamando a Gemini para análisis de reporte de crédito:", err);
      return NextResponse.json({ error: "Hubo un problema de conexión con el analizador. Inténtalo de nuevo.", code: "upstream_error" }, { status: 502 });
    }

    if (!isValidAnalysis(data)) {
      console.error("Gemini devolvió un JSON con forma inesperada para el reporte de crédito:", data);
      return NextResponse.json({ error: "La respuesta no tuvo el formato esperado. Inténtalo de nuevo.", code: "invalid_json" }, { status: 502 });
    }

    return NextResponse.json({ success: true, analysis: data, notes: [...notes, ...analysisNotes] });
  } catch (error) {
    console.error("Error en analyze-report:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
