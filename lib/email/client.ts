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

// Bandeja interna de underwriting para préstamos Hard Money — pedido de JP
// por nota de voz para que el work scope (cotización del negocio) le llegue
// directo cuando el broker lo adjunta al admitir al cliente.
export const HARD_MONEY_WORK_SCOPE_EMAIL = process.env.HARD_MONEY_WORK_SCOPE_EMAIL || "info@emprende360.biz";

// Fernando pidió recibir en su correo personal, además del aviso en el Hub,
// cada solicitud nueva de Reparación de Crédito — todavía no existe un rol
// dedicado de "operador de Reparación de Crédito" en el Hub (el restructuring
// con su hermano/JP sigue en planeación), así que por ahora el punto de
// contacto real para esta vertical es él mismo.
export const CREDIT_REPAIR_NEW_APPLICATION_EMAIL = process.env.CREDIT_REPAIR_NEW_APPLICATION_EMAIL || "fernando.elvire360@gmail.com";

// Checkbox en Torre de Control → Equipo & Roles ("notifyNewCasesByEmail" en
// settings/notifications): en vez de darle a Anthony/Elian/Mario un correo
// personal cada uno, todos comparten esta bandeja — cuando el toggle está
// activo, CUALQUIER caso nuevo (de cualquier vertical) manda aviso aquí
// además de la notificación in-app de siempre.
export const NEW_CASE_SUPPORT_EMAIL = process.env.NEW_CASE_SUPPORT_EMAIL || "soporte@emprende360.info";
