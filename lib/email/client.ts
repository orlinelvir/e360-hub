import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Remitentes configurables: mientras emprende360.biz no esté verificado en Resend,
 * ambos caen al default de pruebas de Resend (onboarding@resend.dev). Una vez
 * verificado el dominio, basta con setear las env vars en Vercel sin tocar código.
 *
 * Se usan dos identidades distintas, igual que ya hacen a mano en GHL:
 * - EMAIL_FROM: notificaciones internas al broker (Torre de Control).
 * - EMAIL_FROM_CLIENT: correos al cliente final, mismo remitente que ya usan
 *   sus workflows de GHL ("Departamento De Aplicaciones" <ayuda@emprende360.biz>).
 */
export const EMAIL_FROM = process.env.RESEND_FROM_EMAIL || "E360 Hub <onboarding@resend.dev>";
export const EMAIL_FROM_CLIENT =
  process.env.RESEND_FROM_CLIENT_EMAIL || process.env.RESEND_FROM_EMAIL || "Departamento de Aplicaciones <onboarding@resend.dev>";

export const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://e360-hub.vercel.app";
