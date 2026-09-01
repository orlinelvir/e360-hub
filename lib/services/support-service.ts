import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  FirestoreError,
  updateDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  SupportConversation, 
  ChatMessage, 
  SupportTicketV2, 
  TicketMessage 
} from "@/app/hub/broker-onboarding/types";

// ==========================================
// CONVERSACIONES DE IA (SOPORTE)
// ==========================================

export async function getSupportConversations(uid: string): Promise<SupportConversation[]> {
  try {
    const ref = collection(db, "brokers", uid, "supportConversations");
    const q = query(ref, orderBy("updatedAt", "desc"));
    const snap = await getDocs(q);

    return snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as SupportConversation));
  } catch (err) {
    if (err instanceof FirestoreError && err.code === "permission-denied") {
      console.warn("⚠️ Permiso denegado en Firestore al consultar conversaciones de soporte.");
    } else {
      console.error("Error al obtener conversaciones desde Firestore:", err);
    }
    return [];
  }
}

export async function createSupportConversation(uid: string): Promise<string> {
  try {
    const ref = collection(db, "brokers", uid, "supportConversations");
    const newConversation: Omit<SupportConversation, "id"> = {
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const docRef = await addDoc(ref, newConversation);
    return docRef.id;
  } catch (err) {
    console.error("Error al crear conversación de soporte:", err);
    throw err;
  }
}

export async function addMessageToConversation(uid: string, conversationId: string, message: ChatMessage): Promise<string> {
  try {
    // Agregar el mensaje a la subcolección
    const messagesRef = collection(db, "brokers", uid, "supportConversations", conversationId, "messages");
    const docRef = await addDoc(messagesRef, {
      ...message,
      createdAt: message.createdAt || new Date().toISOString()
    });

    // Actualizar el timestamp de la conversación principal
    const convRef = doc(db, "brokers", uid, "supportConversations", conversationId);
    await updateDoc(convRef, {
      updatedAt: new Date().toISOString()
    });

    return docRef.id;
  } catch (err) {
    console.error("Error al agregar mensaje a conversación:", err);
    throw err;
  }
}

export async function getConversationMessages(uid: string, conversationId: string): Promise<ChatMessage[]> {
  try {
    const ref = collection(db, "brokers", uid, "supportConversations", conversationId, "messages");
    const q = query(ref, orderBy("createdAt", "asc"));
    const snap = await getDocs(q);

    return snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as ChatMessage));
  } catch (err) {
    console.error("Error al obtener mensajes de la conversación:", err);
    return [];
  }
}

export async function updateConversationStatus(uid: string, conversationId: string, updates: Partial<SupportConversation>): Promise<void> {
  try {
    const convRef = doc(db, "brokers", uid, "supportConversations", conversationId);
    await updateDoc(convRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error al actualizar conversación:", err);
    throw err;
  }
}


// ==========================================
// TICKETS ENHANCED (V2)
// ==========================================

export async function getEnhancedTickets(uid: string): Promise<SupportTicketV2[]> {
  try {
    const ref = collection(db, "brokers", uid, "enhancedTickets");
    const q = query(ref, orderBy("updatedAt", "desc"));
    const snap = await getDocs(q);

    return snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as SupportTicketV2));
  } catch (err) {
    console.error("Error al obtener enhanced tickets:", err);
    return [];
  }
}

export async function createEnhancedTicket(uid: string, ticket: Omit<SupportTicketV2, "id">): Promise<string> {
  try {
    const ref = collection(db, "brokers", uid, "enhancedTickets");
    const docRef = await addDoc(ref, ticket);
    return docRef.id;
  } catch (err) {
    console.error("Error al crear enhanced ticket:", err);
    throw err;
  }
}

export async function updateTicketStatus(uid: string, ticketId: string, status: SupportTicketV2["status"]): Promise<void> {
  try {
    const ref = doc(db, "brokers", uid, "enhancedTickets", ticketId);
    await updateDoc(ref, {
      status,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error al actualizar estado del ticket:", err);
    throw err;
  }
}

export async function addTicketMessage(uid: string, ticketId: string, message: TicketMessage): Promise<string> {
  try {
    const ref = collection(db, "brokers", uid, "enhancedTickets", ticketId, "messages");
    const docRef = await addDoc(ref, {
      ...message,
      createdAt: message.createdAt || new Date().toISOString()
    });

    const ticketRef = doc(db, "brokers", uid, "enhancedTickets", ticketId);
    await updateDoc(ticketRef, {
      updatedAt: new Date().toISOString()
    });

    return docRef.id;
  } catch (err) {
    console.error("Error al agregar mensaje al ticket:", err);
    throw err;
  }
}

export async function getTicketMessages(uid: string, ticketId: string): Promise<TicketMessage[]> {
  try {
    const ref = collection(db, "brokers", uid, "enhancedTickets", ticketId, "messages");
    const q = query(ref, orderBy("createdAt", "asc"));
    const snap = await getDocs(q);

    return snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as TicketMessage));
  } catch (err) {
    console.error("Error al obtener mensajes del ticket:", err);
    return [];
  }
}
