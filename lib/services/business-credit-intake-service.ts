import { randomBytes } from "crypto";
import { adminDb } from "@/lib/firebase-admin";
import { createNotification } from "@/lib/services/notification-service";
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

// Igual que arriba, pero además trae la ruta de Storage del logo del
// broker (si subió uno) — usada por la ruta pública que sirve el logo en
// el formulario de cara al cliente final.
export async function getBusinessCreditBrandingByToken(token: string): Promise<{ brokerId: string; logoStoragePath: string | null } | null> {
  if (!adminDb) return null;
  const snap = await adminDb.collection("brokers").where("businessCreditIntakeToken", "==", token).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { brokerId: doc.id, logoStoragePath: doc.data()?.businessCreditLogoPath || null };
}

export async function getBusinessCreditLogoPath(uid: string): Promise<string | null> {
  if (!adminDb) return null;
  const snap = await brokerDoc(uid).get();
  return snap.data()?.businessCreditLogoPath || null;
}

export async function setBusinessCreditLogoPath(uid: string, path: string | null): Promise<void> {
  await brokerDoc(uid).update({ businessCreditLogoPath: path });
}

export async function getBusinessCreditIntakes(uid: string): Promise<BusinessCreditIntake[]> {
  const snap = await brokerDoc(uid).collection("businessCreditIntakes").orderBy("submittedAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BusinessCreditIntake);
}

// El broker puede corregir un dato mal escrito por su cliente (dirección,
// EIN, etc.) directamente aquí, en vez de tener que pedirle que vuelva a
// llenar el formulario entero y terminar con dos capturas duplicadas para
// la misma empresa.
export async function updateBusinessCreditIntake(
  uid: string,
  intakeId: string,
  patch: Partial<NewBusinessCreditIntakeInput>
): Promise<void> {
  const ref = brokerDoc(uid).collection("businessCreditIntakes").doc(intakeId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Captura no encontrada");
  await ref.update(patch);
}

export async function submitBusinessCreditIntake(brokerId: string, input: NewBusinessCreditIntakeInput): Promise<BusinessCreditIntake> {
  const now = new Date().toISOString();
  const payload = { ...input, brokerId, submittedAt: now };
  const ref = await brokerDoc(brokerId).collection("businessCreditIntakes").add(payload);

  // Best-effort: el broker no tiene por qué estar revisando el modal a cada
  // rato para enterarse de que le llegó una captura nueva.
  try {
    await createNotification(brokerId, {
      title: "Nueva captura de Business Credit Program",
      message: `${input.ownerFullName} (${input.businessLegalName}) acaba de llenar el formulario de DUNS / vendor accounts.`
    });
  } catch (err) {
    console.error("Error creando notificación de captura de Business Credit Program:", err);
  }

  return { id: ref.id, ...payload };
}
