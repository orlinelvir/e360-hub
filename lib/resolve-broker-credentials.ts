import { adminDb } from "@/lib/firebase-admin";
import { decrypt, isEncrypted } from "@/lib/crypto";

export async function resolveBrokerCredentials(
  uid: string,
  request: Request
): Promise<{ locationId: string | undefined; apiKey: string | undefined }> {
  let locationId: string | undefined = undefined;
  let apiKey: string | undefined = undefined;

  try {
    if (adminDb) {
      const brokerSnap = await adminDb.collection("brokers").doc(uid).get();
      if (brokerSnap.exists) {
        const data = brokerSnap.data();
        if (data?.ghlLocationId) locationId = data.ghlLocationId.trim();
        if (data?.ghlApiKey) {
          const raw = data.ghlApiKey.trim();
          apiKey = isEncrypted(raw) ? decrypt(raw) : raw;
        }
      }
    }
  } catch (e) {
    console.warn("No se pudo consultar Firestore Admin para credenciales del broker:", e);
  }

  if (!locationId) {
    const headerLocationId = request.headers.get("x-crm-location-id");
    if (headerLocationId) locationId = headerLocationId.trim();
  }

  return { locationId, apiKey };
}
