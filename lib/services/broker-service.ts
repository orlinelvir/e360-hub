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
import { auth, db } from "@/lib/firebase";
import { BrokerProfileData } from "@/app/hub/broker-onboarding/types";
import { DEFAULT_BROKER_TIER } from "@/lib/constants/broker";
export type { BrokerProfileData };

// Red de seguridad igual a la de AuthProvider.tsx — cualquier código que
// cargue/cree un perfil sin brokerId dispara (sin bloquear ni esperar) el
// mismo endpoint idempotente que asigna el ID real, envía el correo de
// bienvenida y sincroniza con GHL central la primera vez.
function completeRegistrationInBackground(): void {
  const currentUser = auth?.currentUser;
  if (!currentUser) return;
  currentUser
    .getIdToken()
    .then((token) =>
      fetch("/api/broker/register-complete", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      })
    )
    .catch((err) => console.warn("No se pudo completar el registro del broker:", err));
}

export interface ClientLeadData {
  id?: string;
  // Denormalizado al crear el caso — "Admitir Cliente" y el intake de
  // Reparación de Crédito ya lo guardan; "Referir Cliente" no lo hacía,
  // dejando estos 3 campos vacíos para esos casos específicos (el broker
  // dueño seguía siendo inferible por la ruta de Firestore, pero cualquier
  // consulta futura que dependa del campo en vez de la ruta los vería en blanco).
  brokerId?: string;
  brokerName?: string;
  brokerEmail?: string;
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
  syncStatus?: string;
  adminNotes?: string;
  // "ghl_sync": contacto crudo importado de la subcuenta GHL del broker
  // (pestaña "Mis Clientes (CRM)") — NO es una solicitud de servicio real,
  // aunque se guarde en la misma subcolección. El Master Feed de Casos
  // (admin) lo excluye explícitamente por este campo.
  source?: "ghl_sync";
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
    tier: DEFAULT_BROKER_TIER,
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
      const merged = { ...defaultProfile, ...(snap.data() as BrokerProfileData) };
      if (!merged.brokerId) completeRegistrationInBackground();
      return merged;
    }

    await setDoc(ref, defaultProfile, { merge: true });
    completeRegistrationInBackground();
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

