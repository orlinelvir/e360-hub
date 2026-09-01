export interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export interface GeminiResponse {
  answer: string;
  suggestEscalation: boolean;
}

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";

/**
 * Llama a la API REST de Gemini.
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

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("Rate limit de Gemini alcanzado.");
        throw new Error("rate_limit");
      }
      const errorText = await response.text();
      console.error("Error en la API de Gemini:", response.status, errorText);
      throw new Error("Error comunicando con Gemini");
    }

    const data = await response.json();
    const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error("Respuesta vacía de Gemini");
    }

    try {
      // Limpiamos la respuesta en caso de que incluya marcas de bloque de código como ```json
      const cleanJsonStr = responseText.replace(/^\\s*```json/i, "").replace(/```\\s*$/i, "").trim();
      const parsed = JSON.parse(cleanJsonStr);
      
      return {
        answer: parsed.answer || "No pude procesar tu solicitud adecuadamente.",
        suggestEscalation: !!parsed.suggestEscalation
      };
    } catch (parseError) {
      console.error("Error parseando respuesta JSON de Gemini:", parseError, responseText);
      return {
        answer: responseText, // Fallback a texto crudo si falla
        suggestEscalation: false
      };
    }

  } catch (error) {
    console.error("Error en generateGeminiResponse:", error);
    throw error;
  }
}
