interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const tracker = new Map<string, RateLimitRecord>();

/**
 * Limitador de frecuencia en memoria para peticiones HTTP a Route Handlers
 * @param key Identificador único del cliente (UID o IP)
 * @param limit Máximo de solicitudes por ventana
 * @param windowMs Duración de la ventana en milisegundos (default: 60 segundos)
 */
export function isRateLimited(key: string, limit: number = 30, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = tracker.get(key);

  if (!record || now > record.resetAt) {
    tracker.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  record.count += 1;
  if (record.count > limit) {
    return true;
  }

  return false;
}
