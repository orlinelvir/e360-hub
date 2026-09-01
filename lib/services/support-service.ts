import { adminDb } from "@/lib/firebase-admin";
import { 
  SupportConversation, 
  ChatMessage, 
  SupportTicketV2, 
  TicketMessage 
} from "@/app/hub/broker-onboarding/types";

// In-memory fallback para desarrollo local cuando no hay Service Account de Firebase Admin
const memoryConversations = new Map<string, SupportConversation>();
const memoryMessages = new Map<string, ChatMessage[]>();
const memoryTickets = new Map<string, SupportTicketV2[]>();
const memoryTicketMessages = new Map<string, TicketMessage[]>();

// ==========================================
// CONVERSACIONES DE IA (SOPORTE)
// ==========================================

export async function getSupportConversations(uid: string): Promise<SupportConversation[]> {
  if (!adminDb) {
    return Array.from(memoryConversations.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  try {
    const snap = await adminDb
      .collection("brokers")
      .doc(uid)
      .collection("supportConversations")
      .orderBy("updatedAt", "desc")
      .get();

    return snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as SupportConversation));
  } catch (err) {
    console.warn("Aviso al consultar conversaciones de soporte en Firestore:", err);
    return Array.from(memoryConversations.values());
  }
}

export async function createSupportConversation(uid: string): Promise<string> {
  const newConversation: Omit<SupportConversation, "id"> = {
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!adminDb) {
    const convId = `conv_${Date.now()}`;
    memoryConversations.set(convId, { id: convId, ...newConversation });
    memoryMessages.set(convId, []);
    return convId;
  }

  try {
    const ref = adminDb
      .collection("brokers")
      .doc(uid)
      .collection("supportConversations");

    const docRef = await ref.add(newConversation);
    return docRef.id;
  } catch (err) {
    console.warn("Aviso al crear conversación en Firestore (usando fallback):", err);
    const convId = `conv_${Date.now()}`;
    memoryConversations.set(convId, { id: convId, ...newConversation });
    memoryMessages.set(convId, []);
    return convId;
  }
}

export async function addMessageToConversation(uid: string, conversationId: string, message: ChatMessage): Promise<string> {
  const messageData = {
    ...message,
    createdAt: message.createdAt || new Date().toISOString()
  };

  if (!adminDb) {
    const msgs = memoryMessages.get(conversationId) || [];
    msgs.push(messageData);
    memoryMessages.set(conversationId, msgs);
    const conv = memoryConversations.get(conversationId);
    if (conv) {
      conv.updatedAt = messageData.createdAt;
      memoryConversations.set(conversationId, conv);
    }
    return `msg_${Date.now()}`;
  }

  try {
    const messagesRef = adminDb
      .collection("brokers")
      .doc(uid)
      .collection("supportConversations")
      .doc(conversationId)
      .collection("messages");

    const docRef = await messagesRef.add(messageData);

    await adminDb
      .collection("brokers")
      .doc(uid)
      .collection("supportConversations")
      .doc(conversationId)
      .set({ updatedAt: new Date().toISOString() }, { merge: true });

    return docRef.id;
  } catch (err) {
    console.warn("Aviso al agregar mensaje en Firestore (usando fallback):", err);
    const msgs = memoryMessages.get(conversationId) || [];
    msgs.push(messageData);
    memoryMessages.set(conversationId, msgs);
    return `msg_${Date.now()}`;
  }
}

export async function getConversationMessages(uid: string, conversationId: string): Promise<ChatMessage[]> {
  if (!adminDb) {
    return memoryMessages.get(conversationId) || [];
  }

  try {
    const snap = await adminDb
      .collection("brokers")
      .doc(uid)
      .collection("supportConversations")
      .doc(conversationId)
      .collection("messages")
      .orderBy("createdAt", "asc")
      .get();

    return snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as ChatMessage));
  } catch (err) {
    console.warn("Aviso al obtener mensajes de conversación en Firestore:", err);
    return memoryMessages.get(conversationId) || [];
  }
}

export async function updateConversationStatus(uid: string, conversationId: string, updates: Partial<SupportConversation>): Promise<void> {
  const updateData = {
    ...updates,
    updatedAt: new Date().toISOString()
  };

  if (!adminDb) {
    const conv = memoryConversations.get(conversationId);
    if (conv) {
      Object.assign(conv, updateData);
      memoryConversations.set(conversationId, conv);
    }
    return;
  }

  try {
    await adminDb
      .collection("brokers")
      .doc(uid)
      .collection("supportConversations")
      .doc(conversationId)
      .set(updateData, { merge: true });
  } catch (err) {
    console.warn("Aviso al actualizar conversación en Firestore:", err);
  }
}

// ==========================================
// TICKETS ENHANCED (V2)
// ==========================================

export async function getEnhancedTickets(uid: string): Promise<SupportTicketV2[]> {
  if (!adminDb) {
    return memoryTickets.get(uid) || [];
  }

  try {
    const snap = await adminDb
      .collection("brokers")
      .doc(uid)
      .collection("enhancedTickets")
      .orderBy("updatedAt", "desc")
      .get();

    return snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as SupportTicketV2));
  } catch (err) {
    console.warn("Aviso al obtener tickets en Firestore:", err);
    return memoryTickets.get(uid) || [];
  }
}

export async function createEnhancedTicket(uid: string, ticket: Omit<SupportTicketV2, "id">): Promise<string> {
  const ticketData = {
    ...ticket,
    createdAt: ticket.createdAt || new Date().toISOString(),
    updatedAt: ticket.updatedAt || new Date().toISOString()
  };

  if (!adminDb) {
    const ticketId = `ticket_${Date.now()}`;
    const userTickets = memoryTickets.get(uid) || [];
    userTickets.unshift({ id: ticketId, ...ticketData });
    memoryTickets.set(uid, userTickets);
    return ticketId;
  }

  try {
    const ref = adminDb
      .collection("brokers")
      .doc(uid)
      .collection("enhancedTickets");

    const docRef = await ref.add(ticketData);
    return docRef.id;
  } catch (err) {
    console.warn("Aviso al crear ticket en Firestore:", err);
    const ticketId = `ticket_${Date.now()}`;
    const userTickets = memoryTickets.get(uid) || [];
    userTickets.unshift({ id: ticketId, ...ticketData });
    memoryTickets.set(uid, userTickets);
    return ticketId;
  }
}

export async function updateTicketStatus(uid: string, ticketId: string, status: SupportTicketV2["status"]): Promise<void> {
  if (!adminDb) {
    const userTickets = memoryTickets.get(uid) || [];
    const t = userTickets.find(x => x.id === ticketId);
    if (t) {
      t.status = status;
      t.updatedAt = new Date().toISOString();
    }
    return;
  }

  try {
    await adminDb
      .collection("brokers")
      .doc(uid)
      .collection("enhancedTickets")
      .doc(ticketId)
      .set({
        status,
        updatedAt: new Date().toISOString()
      }, { merge: true });
  } catch (err) {
    console.warn("Aviso al actualizar estado del ticket en Firestore:", err);
  }
}

export async function addTicketMessage(uid: string, ticketId: string, message: TicketMessage): Promise<string> {
  const messageData = {
    ...message,
    createdAt: message.createdAt || new Date().toISOString()
  };

  if (!adminDb) {
    const msgs = memoryTicketMessages.get(ticketId) || [];
    msgs.push(messageData);
    memoryTicketMessages.set(ticketId, msgs);
    return `tmsg_${Date.now()}`;
  }

  try {
    const ref = adminDb
      .collection("brokers")
      .doc(uid)
      .collection("enhancedTickets")
      .doc(ticketId)
      .collection("messages");

    const docRef = await ref.add(messageData);

    await adminDb
      .collection("brokers")
      .doc(uid)
      .collection("enhancedTickets")
      .doc(ticketId)
      .set({ updatedAt: new Date().toISOString() }, { merge: true });

    return docRef.id;
  } catch (err) {
    console.warn("Aviso al agregar mensaje al ticket en Firestore:", err);
    const msgs = memoryTicketMessages.get(ticketId) || [];
    msgs.push(messageData);
    memoryTicketMessages.set(ticketId, msgs);
    return `tmsg_${Date.now()}`;
  }
}

export async function getTicketMessages(uid: string, ticketId: string): Promise<TicketMessage[]> {
  if (!adminDb) {
    return memoryTicketMessages.get(ticketId) || [];
  }

  try {
    const snap = await adminDb
      .collection("brokers")
      .doc(uid)
      .collection("enhancedTickets")
      .doc(ticketId)
      .collection("messages")
      .orderBy("createdAt", "asc")
      .get();

    return snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as TicketMessage));
  } catch (err) {
    console.warn("Aviso al obtener mensajes del ticket en Firestore:", err);
    return memoryTicketMessages.get(ticketId) || [];
  }
}
