import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/firebase-admin";
import { 
  createSupportConversation, 
  getConversationMessages, 
  addMessageToConversation 
} from "@/lib/services/support-service";
import { SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { getKnowledgeBaseContext } from "@/lib/ai/knowledge-base";
import { generateGeminiResponse, GeminiMessage } from "@/lib/ai/gemini";
import { ChatMessage } from "@/app/hub/broker-onboarding/types";

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

    return NextResponse.json({
      answer: aiResponse.answer,
      conversationId,
      sources: ["E360 Hub Knowledge Base", "Guías de Broker"],
      suggestEscalation: aiResponse.suggestEscalation
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
