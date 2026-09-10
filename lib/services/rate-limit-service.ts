import { adminDb } from "@/lib/firebase-admin";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
}

/**
 * Rate limiter genérico de ventana fija, respaldado en Firestore (no en memoria,
 * ya que las funciones serverless no comparten estado entre invocaciones).
 * Un documento por (uid, key) en brokers/{uid}/rateLimits/{key}, actualizado
 * dentro de una transacción para que dos solicitudes simultáneas no se cuelen.
 *
 * Si no hay adminDb configurado (dev local sin Service Account), no bloquea
 * — el rate limit es una protección de costo/abuso, no un requisito funcional.
 */
export async function checkRateLimit(
  uid: string,
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (!adminDb) return { allowed: true };

  const db = adminDb;
  const ref = db.collection("brokers").doc(uid).collection("rateLimits").doc(key);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : null;
    const now = Date.now();
    const windowStart = (data?.windowStart as number) || 0;
    const count = (data?.count as number) || 0;

    if (now - windowStart > windowMs) {
      tx.set(ref, { windowStart: now, count: 1 });
      return { allowed: true };
    }

    if (count >= maxRequests) {
      return { allowed: false, retryAfterMs: windowMs - (now - windowStart) };
    }

    tx.set(ref, { windowStart, count: count + 1 });
    return { allowed: true };
  });
}
