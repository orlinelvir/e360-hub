import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { DEFAULT_BROKER_TIER } from "@/lib/constants/broker";

const BROKER_ID_PREFIX = "E360-";
const BROKER_ID_PAD = 6;

export interface CompleteRegistrationResult {
  brokerId: string;
  isNewAssignment: boolean;
  displayName: string;
  email: string;
}

/**
 * Lógica central de "terminar" el registro de un broker, compartida por los
 * 2 únicos disparadores reales de este evento:
 *   1. app/api/broker/register-complete/route.ts — cuando el broker crea su
 *      cuenta en el Hub (ver AuthProvider.tsx).
 *   2. app/api/webhooks/ghl/route.ts ("payment_completed") — cuando GHL
 *      marca el tag "payment completed (spanish)", si para ese momento el
 *      broker YA tiene cuenta en el Hub (match por email).
 *
 * Ambos pueden disparar primero según el orden real (pagar vs. registrarse
 * en el Hub no tiene un orden fijo) — por eso esto vive en un solo lugar y
 * es idempotente: solo asigna brokerId, envía el correo y sincroniza con GHL
 * la PRIMERA vez que CUALQUIERA de los 2 caminos lo llama para ese uid.
 */
export async function completeBrokerRegistration(uid: string): Promise<CompleteRegistrationResult | null> {
  if (!adminDb) return null;
  const db = adminDb;

  const brokerRef = db.collection("brokers").doc(uid);
  const counterRef = db.collection("counters").doc("brokerSequence");

  return db.runTransaction(async (tx) => {
    // Todas las lecturas antes que cualquier escritura — requisito de las
    // transacciones de Firestore.
    const brokerSnap = await tx.get(brokerRef);
    const existing = brokerSnap.exists ? brokerSnap.data() : null;

    if (existing?.brokerId) {
      return {
        brokerId: existing.brokerId as string,
        isNewAssignment: false,
        displayName: existing.displayName || existing.name || "",
        email: existing.email || ""
      };
    }

    const counterSnap = await tx.get(counterRef);
    const nextValue = (counterSnap.exists ? Number(counterSnap.data()?.lastValue) || 0 : 0) + 1;
    const brokerId = `${BROKER_ID_PREFIX}${String(nextValue).padStart(BROKER_ID_PAD, "0")}`;

    // displayName/email vienen del registro de Firebase Auth (la fuente
    // canónica) cuando existe, no de lo que haya quedado en Firestore —
    // este es el único momento de asignar el ID.
    const authUser = adminAuth ? await adminAuth.getUser(uid).catch(() => null) : null;
    const displayName = existing?.displayName || authUser?.displayName || existing?.email || "Broker";
    const email = existing?.email || authUser?.email || "";
    const tier = existing?.tier || DEFAULT_BROKER_TIER;

    tx.set(counterRef, { lastValue: nextValue }, { merge: true });
    tx.set(
      brokerRef,
      {
        uid,
        email,
        displayName,
        role: "broker",
        tier,
        brokerId,
        brokerSequence: nextValue,
        onboardingStage: existing?.onboardingStage || "ventas",
        createdAt: existing?.createdAt || new Date().toISOString()
      },
      { merge: true }
    );

    // Lookup público para la tarjeta digital (Workstream 2) — point-read
    // barato por brokerId sin necesitar una query por campo.
    tx.set(db.collection("brokerCards").doc(brokerId), { uid });

    return { brokerId, isNewAssignment: true, displayName, email };
  });
}
