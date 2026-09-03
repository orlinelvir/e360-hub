import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  FirestoreError
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
  ghlOpportunityId?: string;
  notes?: string;
  feeRoundStatus?: "pending_review" | "paid";
  feeRoundNumber?: number;
  status?: string;
  adminNotes?: string;
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
    onboardingStage: "ventas",
    packagePaid: false,
    ghlLocationId: "",
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
  } catch (err) {
    if (err instanceof FirestoreError && err.code === "permission-denied") {
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
  } catch (err) {
    if (err instanceof FirestoreError && err.code === "permission-denied") {
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
  } catch (err) {
    if (err instanceof FirestoreError && err.code === "permission-denied") {
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
  } catch (err) {
    if (err instanceof FirestoreError && err.code === "permission-denied") {
      console.warn("⚠️ Permiso denegado en Firestore al guardar cliente.");
    } else {
      console.error("Error al guardar cliente en Firestore:", err);
    }
    return client.id || "temp-id";
  }
}

