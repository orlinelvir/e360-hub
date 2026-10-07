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
 * Remitente único: todas las notificaciones del Hub son internas (al broker),
 * nunca directas al cliente final — el cliente firmó contrato con su broker,
 * no con E360, así que toda la correspondencia pasa por él.
 * Mientras emprende360.biz no esté verificado en Resend, cae al default de
 * pruebas (onboarding@resend.dev); una vez verificado, basta con setear la
 * env var en Vercel sin tocar código.
 */
export const EMAIL_FROM = process.env.RESEND_FROM_EMAIL || "E360 Hub <onboarding@resend.dev>";

export const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://emprende360.biz";
