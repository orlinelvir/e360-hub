export interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export interface GeminiInlineImage {
  mimeType: string;
  data: string; // base64, sin el prefijo data:...;base64,
}

export interface GeminiResponse {
  answer: string;
  suggestEscalation: boolean;
  relevantGuideSlugs: string[];
  relevantVideoSlugs: string[];
}

// gemini-2.0-flash y gemini-1.5-flash fueron descontinuados por Google (404 en producción,
// confirmado en logs de Vercel el 2026-09-02). gemini-3.6-flash es el reemplazo directo que
// la propia API de Google indicó en el error, pero devolvió 503 "alta demanda" en la primera
// prueba — modelo recién lanzado, capacidad inestable. Se agregan dos respaldos en cadena
// (3.7-flash y 3.5-flash-lite, este último con pool de capacidad separado por ser "lite")
// en vez de solo uno, y un timeout por intento para no agotar el tiempo de la función
// serverless esperando a un solo modelo saturado.
const MODELS = ["gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.5-flash-lite"];
const PER_MODEL_TIMEOUT_MS = 12_000;

/**
 * Llama a la API REST de Gemini con soporte para múltiples modelos y fallback automático.
 * @param systemInstruction Prompt del sistema y contexto.
 * @param history Historial de la conversación.
 * @param message Mensaje actual del usuario.
 */
export async function generateGeminiResponse(
  systemInstruction: string,
  history: GeminiMessage[],
  message: string
): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta la variable de entorno GEMINI_API_KEY");
  }

  const messages = [...history, { role: "user" as const, parts: [{ text: message }] }];

  const payload = {
    system_instruction: {
      parts: [{ text: systemInstruction }]
    },
    contents: messages,
    generationConfig: {
      temperature: 0.2, // Mantenerlo preciso y profesional
      maxOutputTokens: 1024,
      responseMimeType: "application/json", // Pediremos a Gemini que responda en JSON para extraer la sugerencia de escalación
    }
  };

  // Modificamos ligeramente el system instruction para asegurar que devuelva JSON
  const promptForJson = `
${systemInstruction}

IMPORTANTE: DEBES RESPONDER ÚNICAMENTE EN FORMATO JSON VÁLIDO CON LA SIGUIENTE ESTRUCTURA:
{
  "answer": "tu respuesta detallada aquí en formato markdown",
  "suggestEscalation": true/false (true si el usuario necesita hablar con un humano o pide contactar soporte, false en caso contrario),
  "relevantGuideSlugs": ["slug1"] (opcional, arreglo vacío si ninguno aplica; incluye 1-2 slugs SOLO si el
    documento está en la lista de "DOCUMENTOS/GUÍAS PDF DISPONIBLES" y responde directamente lo que pregunta
    el broker — nunca inventes un slug que no esté en esa lista),
  "relevantVideoSlugs": ["slug1"] (opcional, arreglo vacío si ninguno aplica; incluye 1 slug SOLO si el
    video está en la lista de "VIDEOS DE CLASES/CAPACITACIONES DISPONIBLES" y responde directamente lo que
    pregunta el broker — nunca inventes un slug que no esté en esa lista)
}
`;

  payload.system_instruction.parts[0].text = promptForJson;

  let lastError: Error | null = null;

  for (const model of MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PER_MODEL_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.warn(`Rate limit alcanzado con modelo ${model}.`);
          throw new Error("rate_limit");
        }
        const errorText = await response.text();
        console.warn(`Aviso: Error con modelo ${model} (${response.status}):`, errorText);
        lastError = new Error(`Error en API Gemini (${response.status})`);
        continue;
      }

      const data = await response.json();
      const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        lastError = new Error("Respuesta vacía de Gemini");
        continue;
      }

      try {
        const cleanJsonStr = responseText.replace(/^\s*```json/i, "").replace(/```\s*$/i, "").trim();
        const parsed = JSON.parse(cleanJsonStr);
        return {
          answer: parsed.answer || responseText,
          suggestEscalation: !!parsed.suggestEscalation,
          relevantGuideSlugs: Array.isArray(parsed.relevantGuideSlugs) ? parsed.relevantGuideSlugs : [],
          relevantVideoSlugs: Array.isArray(parsed.relevantVideoSlugs) ? parsed.relevantVideoSlugs : []
        };
      } catch {
        return {
          answer: responseText,
          suggestEscalation: false,
          relevantGuideSlugs: [],
          relevantVideoSlugs: []
        };
      }
    } catch (err) {
      if (err instanceof Error && err.message === "rate_limit") {
        throw err;
      }
      if (err instanceof Error && err.name === "AbortError") {
        console.warn(`Timeout (${PER_MODEL_TIMEOUT_MS}ms) esperando al modelo ${model}.`);
        lastError = new Error(`Timeout esperando modelo ${model}`);
      } else {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error("No se pudo conectar con el Asistente IA");
}

/**
 * Versión genérica de generateGeminiResponse, sin el envoltorio
 * answer/suggestEscalation específico del chat de soporte — devuelve el JSON
 * crudo que el modelo generó (el caller valida/castea la forma esperada).
 * Soporta imágenes (ej. páginas de un reporte escaneado) vía inline_data.
 * Pensada para prompts grandes de salida (ej. el Revisor de Reporte de
 * Crédito), así que usa menos modelos en la cadena y timeouts más largos que
 * generateGeminiResponse — un JSON de varios KB tarda más en generarse que
 * una respuesta de chat corta.
 */
export async function generateGeminiJson(
  systemInstruction: string,
  text: string,
  images: GeminiInlineImage[] = [],
  opts: { models?: string[]; timeoutMs?: number; maxOutputTokens?: number } = {}
): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta la variable de entorno GEMINI_API_KEY");
  }

  const models = opts.models || ["gemini-3.6-flash", "gemini-3.7-flash"];
  const timeoutMs = opts.timeoutMs || 55_000;

  const parts: Array<Record<string, unknown>> = [];
  if (text) parts.push({ text });
  images.forEach((img) => parts.push({ inline_data: { mime_type: img.mimeType, data: img.data } }));

  const payload = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: opts.maxOutputTokens || 8192,
      responseMimeType: "application/json"
    }
  };

  let lastError: Error | null = null;

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.warn(`Rate limit alcanzado con modelo ${model}.`);
          throw new Error("rate_limit");
        }
        const errorText = await response.text();
        console.warn(`Aviso: Error con modelo ${model} (${response.status}):`, errorText);
        lastError = new Error(`Error en API Gemini (${response.status})`);
        continue;
      }

      const data = await response.json();
      const candidate = data?.candidates?.[0];
      const responseText = candidate?.content?.parts?.[0]?.text;

      if (!responseText) {
        // finishReason "MAX_TOKENS" significa que el JSON se cortó a medias —
        // un reintento con el siguiente modelo de la cadena no lo arregla (el
        // límite es el mismo), pero vale la pena distinguirlo en el log.
        if (candidate?.finishReason === "MAX_TOKENS") {
          console.warn(`Modelo ${model} cortó la respuesta por MAX_TOKENS.`);
        }
        lastError = new Error("Respuesta vacía de Gemini");
        continue;
      }

      try {
        const cleanJsonStr = responseText.replace(/^\s*```json/i, "").replace(/```\s*$/i, "").trim();
        return JSON.parse(cleanJsonStr);
      } catch {
        lastError = new Error("invalid_json");
        continue;
      }
    } catch (err) {
      if (err instanceof Error && err.message === "rate_limit") {
        throw err;
      }
      if (err instanceof Error && err.name === "AbortError") {
        console.warn(`Timeout (${timeoutMs}ms) esperando al modelo ${model}.`);
        lastError = new Error(`Timeout esperando modelo ${model}`);
      } else {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error("No se pudo conectar con el Asistente IA");
}
