import { getResendClient, EMAIL_FROM } from "./client";
import CaseStatusEmail, { CaseEmailStatus } from "./templates/CaseStatusEmail";
import BrokerNoteEmail from "./templates/BrokerNoteEmail";
import WelcomeApplicationEmail from "./templates/WelcomeApplicationEmail";
import BrokerOnboardingEmail from "./templates/BrokerOnboardingEmail";
import PasswordResetEmail from "./templates/PasswordResetEmail";
import MissingApplicationEmail from "./templates/MissingApplicationEmail";
import TicketUpdateEmail, { TicketUpdateKind } from "./templates/TicketUpdateEmail";

/**
 * Envío de notificaciones al broker. Nunca debe tumbar la acción principal
 * (cambio de status, nota nueva) si Resend falla o no está configurado —
 * por eso cada función atrapa sus propios errores y solo los loguea.
 */

interface CaseStatusEmailParams {
  brokerEmail: string;
  brokerName: string;
  clientName: string;
  serviceName: string;
  status: CaseEmailStatus;
  amount?: number;
  reason?: string;
}

export async function sendCaseStatusEmail(params: CaseStatusEmailParams): Promise<void> {
  const resend = getResendClient();
  if (!resend || !params.brokerEmail) return;

  const subjectByStatus: Record<CaseEmailStatus, string> = {
    approved: `✅ Aprobado: ${params.clientName}`,
    rejected: `⚠️ Declinado: ${params.clientName}`,
    funded: `💰 Fondeado: ${params.clientName}`,
  };

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: params.brokerEmail,
      subject: subjectByStatus[params.status],
      react: (
        <CaseStatusEmail
          brokerName={params.brokerName}
          clientName={params.clientName}
          serviceName={params.serviceName}
          status={params.status}
          amount={params.amount}
          reason={params.reason}
        />
      ),
    });
  } catch (err) {
    console.error("Error enviando email de cambio de status:", err);
  }
}

interface BrokerNoteEmailParams {
  brokerEmail: string;
  brokerName: string;
  clientName: string;
  serviceName: string;
  authorName: string;
  noteContent: string;
}

// A diferencia de la mayoría de funciones de este archivo, esta SÍ reporta el
// resultado real en vez de tragarse el error en silencio: el equipo de
// underwriting depende de que esta nota realmente le llegue al broker, y
// antes no había forma de saber si Resend había fallado — parecía "enviado"
// aunque nunca llegara.
export async function sendBrokerNoteEmail(params: BrokerNoteEmailParams): Promise<{ sent: boolean; error?: string }> {
  const resend = getResendClient();
  if (!resend) return { sent: false, error: "Resend no está configurado en el servidor (falta RESEND_API_KEY)." };
  if (!params.brokerEmail) return { sent: false, error: "El broker no tiene email registrado." };

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: params.brokerEmail,
      subject: `📝 Nueva nota sobre el caso de ${params.clientName}`,
      react: (
        <BrokerNoteEmail
          brokerName={params.brokerName}
          clientName={params.clientName}
          serviceName={params.serviceName}
          authorName={params.authorName}
          noteContent={params.noteContent}
        />
      ),
    });
    return { sent: true };
  } catch (err) {
    console.error("Error enviando email de nota para el broker:", err);
    const message = err instanceof Error ? err.message : "Error desconocido al enviar el correo.";
    return { sent: false, error: message };
  }
}

interface BrokerOnboardingEmailParams {
  brokerEmail: string;
  brokerName: string;
  authorName: string;
  message: string;
}

export async function sendBrokerOnboardingEmail(params: BrokerOnboardingEmailParams): Promise<void> {
  const resend = getResendClient();
  if (!resend || !params.brokerEmail) return;

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: params.brokerEmail,
      subject: `📋 Actualización de tu onboarding en E360`,
      react: (
        <BrokerOnboardingEmail
          brokerName={params.brokerName}
          authorName={params.authorName}
          message={params.message}
        />
      ),
    });
  } catch (err) {
    console.error("Error enviando email de onboarding al broker:", err);
  }
}

interface PasswordResetEmailParams {
  brokerEmail: string;
  brokerName: string;
  authorName: string;
  resetLink: string;
}

// A diferencia de las demás funciones de este archivo, esta SÍ lanza el error
// en vez de solo loguearlo: aquí el correo ES la acción principal que pidió el
// admin (enviar el reset), no un efecto secundario de otra cosa — si Resend
// falla, el admin necesita saberlo para reintentar o avisar al broker por otro medio.
export async function sendPasswordResetEmail(params: PasswordResetEmailParams): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    throw new Error("Resend no está configurado en el servidor (falta RESEND_API_KEY).");
  }
  if (!params.brokerEmail) {
    throw new Error("El broker no tiene email registrado.");
  }

  await resend.emails.send({
    from: EMAIL_FROM,
    to: params.brokerEmail,
    subject: "🔐 Restablece tu contraseña de E360 Hub",
    react: (
      <PasswordResetEmail
        brokerName={params.brokerName}
        authorName={params.authorName}
        resetLink={params.resetLink}
      />
    ),
  });
}

interface MissingApplicationEmailParams {
  brokerEmail: string;
  brokerName: string;
  clientName: string;
  serviceName: string;
  formLink?: string;
}

// Le llega al broker, nunca directo al cliente final — ver nota en
// notifyBrokerOfMissingApplication sobre por qué cambió.
export async function sendMissingApplicationEmail(params: MissingApplicationEmailParams): Promise<void> {
  const resend = getResendClient();
  if (!resend || !params.brokerEmail) return;

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: params.brokerEmail,
      subject: `A ${params.clientName} le falta un paso en su solicitud de ${params.serviceName}`,
      react: (
        <MissingApplicationEmail
          brokerName={params.brokerName}
          clientName={params.clientName}
          serviceName={params.serviceName}
          formLink={params.formLink}
        />
      ),
    });
  } catch (err) {
    console.error("Error enviando email de formulario faltante al broker:", err);
  }
}

interface WelcomeApplicationEmailParams {
  brokerEmail: string;
  brokerName: string;
  clientName: string;
  serviceName: string;
}

// Le llega al broker, nunca directo al cliente final — JP: el cliente firmó
// contrato con el broker, no con E360, así que la comunicación pasa por él.
export async function sendWelcomeApplicationEmail(params: WelcomeApplicationEmailParams): Promise<void> {
  const resend = getResendClient();
  if (!resend || !params.brokerEmail) return;

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: params.brokerEmail,
      subject: `Recibimos la solicitud de ${params.clientName}`,
      react: <WelcomeApplicationEmail brokerName={params.brokerName} clientName={params.clientName} serviceName={params.serviceName} />,
    });
  } catch (err) {
    console.error("Error enviando email de bienvenida al broker:", err);
  }
}

interface TicketUpdateEmailParams {
  brokerEmail: string;
  brokerName: string;
  ticketSubject: string;
  senderName: string;
  messagePreview?: string;
}

// Los dos avisos de tickets (respuesta del staff y cierre) comparten plantilla;
// el broker debe enterarse por correo además de la notificación in-app, porque
// el reclamo que originó esto fue exactamente "le respondí y nunca me avisaron".
async function sendTicketUpdateEmail(kind: TicketUpdateKind, params: TicketUpdateEmailParams): Promise<void> {
  const resend = getResendClient();
  if (!resend || !params.brokerEmail) return;

  const subject =
    kind === "reply"
      ? `Soporte respondió a tu ticket: ${params.ticketSubject}`
      : `Ticket resuelto: ${params.ticketSubject}`;

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: params.brokerEmail,
      subject,
      react: (
        <TicketUpdateEmail
          kind={kind}
          brokerName={params.brokerName}
          ticketSubject={params.ticketSubject}
          senderName={params.senderName}
          messagePreview={params.messagePreview}
        />
      ),
    });
  } catch (err) {
    console.error(`Error enviando email de ticket (${kind}):`, err);
  }
}

export async function sendTicketReplyEmail(params: TicketUpdateEmailParams): Promise<void> {
  await sendTicketUpdateEmail("reply", params);
}

export async function sendTicketResolvedEmail(params: TicketUpdateEmailParams): Promise<void> {
  await sendTicketUpdateEmail("resolved", params);
}
