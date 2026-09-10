import { NextResponse } from "next/server";
import { verifyAuthToken, adminStorage } from "@/lib/firebase-admin";
import {
  createSupportConversation,
  getConversationMessages,
  addMessageToConversation
} from "@/lib/services/support-service";
import { SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { getKnowledgeBaseContext } from "@/lib/ai/knowledge-base";
import { generateGeminiResponse, GeminiMessage } from "@/lib/ai/gemini";
import { getGuideBySlug } from "@/lib/ai/guides";
import { getVideoBySlug } from "@/lib/ai/videos";
import { checkRateLimit } from "@/lib/services/rate-limit-service";
import { ChatMessage } from "@/app/hub/broker-onboarding/types";

const GUIDE_SIGNED_URL_EXPIRY_MS = 24 * 60 * 60 * 1000;

// Protección de costo/abuso: el chat llama a la API de Gemini (facturada por
// token) en cada mensaje — sin esto, un loop de scripts o un usuario
// insistente podría generar un costo creciente sin límite.
const RATE_LIMIT_MAX_MESSAGES = 20;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutos

// Sin esto, cada turno reenviaba TODA la conversación completa a Gemini desde
// el primer mensaje — costo y latencia crecientes sin límite en chats largos.
// Se trunca solo lo que se le manda al modelo; el historial completo se sigue
// guardando y mostrando en la UI normalmente.
const MAX_HISTORY_MESSAGES_TO_MODEL = 20;

async function resolveGuideDocuments(slugs: string[]) {
  if (!adminStorage || slugs.length === 0) return [];

  const bucket = adminStorage.bucket();
  const results = await Promise.all(
    slugs.map(async (slug) => {
      const guide = getGuideBySlug(slug);
      if (!guide) return null;
      try {
        const [url] = await bucket.file(guide.storagePath).getSignedUrl({
          action: "read",
          expires: Date.now() + GUIDE_SIGNED_URL_EXPIRY_MS
        });
        return { title: guide.title, url };
      } catch (err) {
        console.error(`No se pudo generar URL firmada para la guía "${slug}":`, err);
        return null;
      }
    })
  );

  return results.filter((r): r is { title: string; url: string } => r !== null);
}

function resolveVideos(slugs: string[]) {
  return slugs
    .map((slug) => {
      const video = getVideoBySlug(slug);
      if (!video || !video.url) return null;
      return { title: video.title, url: video.url };
    })
    .filter((v): v is { title: string; url: string } => v !== null);
}

// Default de Vercel (10s) no alcanza para intentar 3 modelos de Gemini en cadena
// (hasta 12s de timeout cada uno) cuando el primero está saturado. Ver lib/ai/gemini.ts.
export const maxDuration = 45;

export async function POST(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const rateLimit = await checkRateLimit(user.uid, "support-chat", RATE_LIMIT_MAX_MESSAGES, RATE_LIMIT_WINDOW_MS);
    if (!rateLimit.allowed) {
      const retrySeconds = Math.ceil((rateLimit.retryAfterMs || 0) / 1000);
      return NextResponse.json(
        { error: `Has enviado muchos mensajes seguidos. Intenta de nuevo en ${retrySeconds} segundos.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { message } = body;
    let { conversationId } = body;

    if (!message) {
      return NextResponse.json({ error: "El mensaje es requerido" }, { status: 400 });
    }

    if (!conversationId) {
      conversationId = await createSupportConversation(user.uid);
    }

    // Guardar el mensaje del usuario
    const userChatMessage: ChatMessage = {
      role: "user",
      content: message,
      createdAt: new Date().toISOString()
    };
    await addMessageToConversation(user.uid, conversationId, userChatMessage);

    // Obtener historial y contexto
    const chatHistory = await getConversationMessages(user.uid, conversationId);

    // Mapear historial al formato de Gemini — truncado a los últimos N mensajes
    // (el historial completo se guarda y se muestra en la UI sin este límite,
    // esto solo acota lo que se manda al modelo en cada llamada).
    const geminiHistory: GeminiMessage[] = chatHistory
      // Filtramos el último mensaje que acabamos de agregar, ya que se pasa por separado
      .filter(msg => msg.createdAt !== userChatMessage.createdAt)
      .slice(-MAX_HISTORY_MESSAGES_TO_MODEL)
      .map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      }));

    const kbContext = await getKnowledgeBaseContext();
    const fullSystemInstruction = `${SYSTEM_PROMPT}\n\n${kbContext}`;

    // Llamar a Gemini
    const aiResponse = await generateGeminiResponse(
      fullSystemInstruction,
      geminiHistory,
      message
    );

    // Guardar respuesta del modelo
    const modelChatMessage: ChatMessage = {
      role: "model",
      content: aiResponse.answer,
      createdAt: new Date().toISOString()
    };
    await addMessageToConversation(user.uid, conversationId, modelChatMessage);

    const documents = await resolveGuideDocuments(aiResponse.relevantGuideSlugs);
    const videos = resolveVideos(aiResponse.relevantVideoSlugs);

    return NextResponse.json({
      answer: aiResponse.answer,
      conversationId,
      sources: ["E360 Hub Knowledge Base", "Guías de Broker"],
      suggestEscalation: aiResponse.suggestEscalation,
      documents,
      videos
    });

  } catch (error: unknown) {
    console.error("Error en /api/support/chat:", error);
    
    if (error instanceof Error && error.message === "rate_limit") {
      return NextResponse.json(
        { error: "El servicio está experimentando un alto volumen de solicitudes. Por favor, intenta de nuevo en unos momentos." },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: "Error interno al procesar la solicitud de chat" },
      { status: 500 }
    );
  }
}
