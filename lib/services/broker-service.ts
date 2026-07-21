import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  addDoc, 
  query,
  orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BrokerProfileData } from "@/app/hub/broker-onboarding/types";
export type { BrokerProfileData };

export interface ClientLeadData {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  serviceId?: string;
  serviceName?: string;
  amount?: number | string;
  estimatedCommission?: number;
  stage: "lead" | "prequalified" | "submitted" | "approved" | "funded" | "rejected";
  createdAt: string;
  lastActivity?: string;
  ghlContactId?: string;
  notes?: string;
}

export interface SupportTicketData {
  id?: string;
  subject: string;
  category: "ghl_crm" | "commission" | "underwriting" | "general";
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved";
  description: string;
  createdAt: string;
}

/**
 * Obtiene o crea el perfil de un broker desde Firestore
 */
export async function getBrokerProfile(uid: string, defaultName?: string, defaultEmail?: string): Promise<BrokerProfileData> {
  const defaultProfile: BrokerProfileData = {
    uid,
    displayName: defaultName || "Broker E360",
    email: defaultEmail || "",
    phone: "",
    tier: "Senior Broker VIP",
    ghlLocationId: process.env.NEXT_PUBLIC_GHL_DEFAULT_LOCATION_ID || "LOC-E360-DEFAULT",
    ghlConnected: false,
    payoutMethod: "zelle",
    payoutDetails: {},
    referralSlug: `broker-${uid.substring(0, 6)}`,
    createdAt: new Date().toISOString().split("T")[0]
  };

  try {
    const ref = doc(db, "brokers", uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      return { ...defaultProfile, ...(snap.data() as BrokerProfileData) };
    }

    await setDoc(ref, defaultProfile);
    return defaultProfile;
  } catch (err: any) {
    if (err?.code === "permission-denied") {
      console.warn("⚠️ Permiso denegado en Firestore al leer perfil. Despliega firestore.rules en tu consola de Firebase.");
    } else {
      console.error("Error al obtener perfil desde Firestore:", err);
    }
    return defaultProfile;
  }
}

/**
 * Actualiza el perfil de un broker en Firestore
 */
export async function updateBrokerProfile(uid: string, data: Partial<BrokerProfileData>): Promise<void> {
  try {
    const ref = doc(db, "brokers", uid);
    await setDoc(ref, data, { merge: true });
  } catch (err: any) {
    if (err?.code === "permission-denied") {
      console.warn("⚠️ Permiso denegado en Firestore al actualizar perfil. Verifica que tus firestore.rules estén desplegadas.");
    } else {
      console.error("Error al actualizar perfil en Firestore:", err);
    }
  }
}

/**
 * Obtiene todos los clientes de un broker desde la subcolección Firestore
 */
export async function getBrokerClients(uid: string): Promise<ClientLeadData[]> {
  try {
    const ref = collection(db, "brokers", uid, "clients");
    const q = query(ref, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    return snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as ClientLeadData));
  } catch (err: any) {
    if (err?.code === "permission-denied") {
      console.warn("⚠️ Permiso denegado en Firestore al consultar clientes. Asegúrate de publicar firestore.rules.");
    } else {
      console.warn("Aviso al consultar clientes en Firestore:", err);
    }
    return [];
  }
}

/**
 * Guarda o actualiza un cliente en subcolección Firestore del broker
 */
export async function saveBrokerClient(uid: string, client: ClientLeadData): Promise<string> {
  try {
    const ref = collection(db, "brokers", uid, "clients");
    if (client.id && !client.id.startsWith("GHL-")) {
      const docRef = doc(db, "brokers", uid, "clients", client.id);
      await setDoc(docRef, client, { merge: true });
      return client.id;
    } else {
      const docRef = await addDoc(ref, client);
      return docRef.id;
    }
  } catch (err: any) {
    if (err?.code === "permission-denied") {
      console.warn("⚠️ Permiso denegado en Firestore al guardar cliente.");
    } else {
      console.error("Error al guardar cliente en Firestore:", err);
    }
    return client.id || "temp-id";
  }
}

/**
 * Obtiene los tickets de soporte del broker desde Firestore
 */
export async function getBrokerTickets(uid: string): Promise<SupportTicketData[]> {
  try {
    const ref = collection(db, "brokers", uid, "tickets");
    const q = query(ref, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    return snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as SupportTicketData));
  } catch (err: any) {
    if (err?.code === "permission-denied") {
      console.warn("⚠️ Permiso denegado en Firestore al leer tickets de soporte.");
    } else {
      console.warn("Aviso al leer tickets de soporte:", err);
    }
    return [];
  }
}

/**
 * Crea un ticket de soporte en subcolección Firestore del broker
 */
export async function createBrokerTicket(uid: string, ticket: SupportTicketData): Promise<string> {
  try {
    const ref = collection(db, "brokers", uid, "tickets");
    const docRef = await addDoc(ref, ticket);
    return docRef.id;
  } catch (err: any) {
    if (err?.code === "permission-denied") {
      console.warn("⚠️ Permiso denegado en Firestore al crear ticket de soporte.");
    } else {
      console.error("Error al crear ticket en Firestore:", err);
    }
    return "temp-ticket-id";
  }
}

/**
 * Realiza la migración única desde localStorage hacia Firestore
 */
export async function migrateLocalStorageToFirestore(uid: string): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    // 1. Perfil
    const savedProfile = localStorage.getItem("e360_broker_profile");
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      if (parsed && typeof parsed === "object") {
        await updateBrokerProfile(uid, parsed);
      }
      localStorage.removeItem("e360_broker_profile");
    }

    // 2. Clientes
    const savedClients = localStorage.getItem("e360_broker_clients");
    if (savedClients) {
      const parsed: ClientLeadData[] = JSON.parse(savedClients);
      if (Array.isArray(parsed)) {
        for (const client of parsed) {
          if (!client.id?.startsWith("CLI-90")) {
            await saveBrokerClient(uid, client);
          }
        }
      }
      localStorage.removeItem("e360_broker_clients");
    }

    // 3. Eliminar claves residuales
    localStorage.removeItem("e360_broker_auth");
    localStorage.removeItem("e360_broker_name");
  } catch (err) {
    console.error("Error al migrar localStorage a Firestore:", err);
  }
}
