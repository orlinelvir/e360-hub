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
import { ChatMessage } from "@/app/hub/broker-onboarding/types";

const GUIDE_SIGNED_URL_EXPIRY_MS = 24 * 60 * 60 * 1000;

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

// Default de Vercel (10s) no alcanza para intentar 3 modelos de Gemini en cadena
// (hasta 12s de timeout cada uno) cuando el primero está saturado. Ver lib/ai/gemini.ts.
export const maxDuration = 45;

export async function POST(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
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
    
    // Mapear historial al formato de Gemini
    const geminiHistory: GeminiMessage[] = chatHistory
      // Filtramos el último mensaje que acabamos de agregar, ya que se pasa por separado
      .filter(msg => msg.createdAt !== userChatMessage.createdAt) 
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

    return NextResponse.json({
      answer: aiResponse.answer,
      conversationId,
      sources: ["E360 Hub Knowledge Base", "Guías de Broker"],
      suggestEscalation: aiResponse.suggestEscalation,
      documents
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
