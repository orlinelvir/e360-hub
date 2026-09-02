export interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export interface GeminiResponse {
  answer: string;
  suggestEscalation: boolean;
}

// gemini-2.0-flash y gemini-1.5-flash fueron descontinuados por Google (404 en producción,
// confirmado en logs de Vercel el 2026-09-02). gemini-3.6-flash es el reemplazo directo que
// la propia API de Google indicó en el error; gemini-3.7-flash como respaldo por tener más
// margen antes de deprecarse (GA reciente, agosto 2026) que gemini-2.5-flash (se apaga en
// octubre 2026).
const PRIMARY_MODEL = "gemini-3.6-flash";
const FALLBACK_MODEL = "gemini-3.7-flash";

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
  "suggestEscalation": true/false (true si el usuario necesita hablar con un humano o pide contactar soporte, false en caso contrario)
}
`;

  payload.system_instruction.parts[0].text = promptForJson;

  const models = [PRIMARY_MODEL, FALLBACK_MODEL];
  let lastError: Error | null = null;

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
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
          suggestEscalation: !!parsed.suggestEscalation
        };
      } catch {
        return {
          answer: responseText,
          suggestEscalation: false
        };
      }
    } catch (err) {
      if (err instanceof Error && err.message === "rate_limit") {
        throw err;
      }
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error("No se pudo conectar con el Asistente IA");
}
