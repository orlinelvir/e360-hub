import { randomBytes } from "crypto";
import { adminDb } from "@/lib/firebase-admin";
import { BusinessCreditIntake, NewBusinessCreditIntakeInput } from "@/app/hub/broker-onboarding/types";

/**
 * Formulario de captura del Business Credit Program (DUNS / vendor
 * accounts) — a diferencia de Oficina Virtual E360, aquí los campos son
 * fijos, así que no hace falta un sistema de plantillas: cada broker tiene
 * un único link permanente (token en brokers/{uid}.businessCreditIntakeToken,
 * generado la primera vez que lo pide) que puede compartir con cualquier
 * cantidad de clientes, sin límite de usos.
 */

function brokerDoc(uid: string) {
  if (!adminDb) throw new Error("Servidor no configurado");
  return adminDb.collection("brokers").doc(uid);
}

function generateToken(): string {
  return randomBytes(16).toString("hex");
}

export async function getOrCreateBusinessCreditLinkToken(uid: string): Promise<string> {
  if (!adminDb) throw new Error("Servidor no configurado");
  const ref = brokerDoc(uid);
  return adminDb.runTransaction(async (t) => {
    const snap = await t.get(ref);
    const existing = snap.data()?.businessCreditIntakeToken;
    if (typeof existing === "string" && existing) return existing;
    const token = generateToken();
    t.update(ref, { businessCreditIntakeToken: token });
    return token;
  });
}

// Lookup público (sin uid autenticado) por token — el link vive en el campo
// del broker, no en una subcolección, así que es una query directa sobre
// brokers (no un collectionGroup como en Oficina Virtual E360).
export async function getBrokerIdByBusinessCreditToken(token: string): Promise<string | null> {
  if (!adminDb) return null;
  const snap = await adminDb.collection("brokers").where("businessCreditIntakeToken", "==", token).limit(1).get();
  if (snap.empty) return null;
  return snap.docs[0].id;
}

export async function getBusinessCreditIntakes(uid: string): Promise<BusinessCreditIntake[]> {
  const snap = await brokerDoc(uid).collection("businessCreditIntakes").orderBy("submittedAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BusinessCreditIntake);
}

export async function submitBusinessCreditIntake(brokerId: string, input: NewBusinessCreditIntakeInput): Promise<BusinessCreditIntake> {
  const now = new Date().toISOString();
  const payload = { ...input, brokerId, submittedAt: now };
  const ref = await brokerDoc(brokerId).collection("businessCreditIntakes").add(payload);
  return { id: ref.id, ...payload };
}
