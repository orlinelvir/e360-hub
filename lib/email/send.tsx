import { getResendClient, EMAIL_FROM, HARD_MONEY_WORK_SCOPE_EMAIL, CREDIT_REPAIR_NEW_APPLICATION_EMAIL, NEW_CASE_SUPPORT_EMAIL } from "./client";
import CaseStatusEmail, { CaseEmailStatus } from "./templates/CaseStatusEmail";
import BrokerNoteEmail from "./templates/BrokerNoteEmail";
import WelcomeApplicationEmail from "./templates/WelcomeApplicationEmail";
import BrokerOnboardingEmail from "./templates/BrokerOnboardingEmail";
import PasswordResetEmail from "./templates/PasswordResetEmail";
import MissingApplicationEmail from "./templates/MissingApplicationEmail";
import HardMoneyWorkScopeEmail from "./templates/HardMoneyWorkScopeEmail";
import NewCreditRepairApplicationEmail from "./templates/NewCreditRepairApplicationEmail";
import NewCaseStaffEmail from "./templates/NewCaseStaffEmail";
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
// notifyBrokerOfMissingApplication sobre por qué cambió. Reporta el
// resultado real (como sendBrokerNoteEmail) porque la UI le dice al broker
// "te enviamos el enlace" — antes eso se afirmaba aunque el correo nunca
// saliera (Resend sin configurar, o el send fallando en silencio).
export async function sendMissingApplicationEmail(params: MissingApplicationEmailParams): Promise<{ sent: boolean; error?: string }> {
  const resend = getResendClient();
  if (!resend) return { sent: false, error: "Resend no está configurado en el servidor (falta RESEND_API_KEY)." };
  if (!params.brokerEmail) return { sent: false, error: "El broker no tiene email registrado." };

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
    return { sent: true };
  } catch (err) {
    console.error("Error enviando email de formulario faltante al broker:", err);
    const message = err instanceof Error ? err.message : "Error desconocido al enviar el correo.";
    return { sent: false, error: message };
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

interface HardMoneyWorkScopeEmailParams {
  brokerName: string;
  clientName: string;
  fileUrl: string;
  fileName: string;
}

// Pedido de JP por nota de voz: que el work scope de un Hard Money le llegue
// directo a underwriting al momento de admitir al cliente, en vez de
// depender de que el broker se acuerde de reenviarlo por su cuenta.
export async function sendHardMoneyWorkScopeEmail(params: HardMoneyWorkScopeEmailParams): Promise<void> {
  const resend = getResendClient();
  if (!resend) return;

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: HARD_MONEY_WORK_SCOPE_EMAIL,
      subject: `Work scope Hard Money — ${params.clientName} (${params.brokerName})`,
      react: (
        <HardMoneyWorkScopeEmail
          brokerName={params.brokerName}
          clientName={params.clientName}
          fileUrl={params.fileUrl}
          fileName={params.fileName}
        />
      ),
    });
  } catch (err) {
    console.error("Error enviando email de work scope Hard Money:", err);
  }
}

interface NewCreditRepairApplicationEmailParams {
  brokerName: string;
  clientName: string;
}

// Pedido explícito de Fernando: además del aviso en el Hub, quiere enterarse
// por su correo personal de cada solicitud nueva de Reparación de Crédito.
export async function sendNewCreditRepairApplicationEmail(params: NewCreditRepairApplicationEmailParams): Promise<void> {
  const resend = getResendClient();
  if (!resend) return;

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: CREDIT_REPAIR_NEW_APPLICATION_EMAIL,
      subject: `Nueva solicitud de Reparación de Crédito — ${params.clientName}`,
      react: <NewCreditRepairApplicationEmail brokerName={params.brokerName} clientName={params.clientName} />,
    });
  } catch (err) {
    console.error("Error enviando email de nueva solicitud de Reparación de Crédito:", err);
  }
}

interface NewCaseStaffEmailParams {
  brokerName: string;
  clientName: string;
  serviceName: string;
}

// Checkbox de "Notificar casos nuevos por correo" en Equipo & Roles — a
// diferencia del correo de Reparación de Crédito (un destinatario fijo, pedido
// explícito de Fernando), este aplica a cualquier vertical y manda siempre a
// la bandeja compartida de soporte, no a un correo personal.
export async function sendNewCaseEmailToSupport(params: NewCaseStaffEmailParams): Promise<void> {
  const resend = getResendClient();
  if (!resend) return;

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: NEW_CASE_SUPPORT_EMAIL,
      subject: `Nueva solicitud — ${params.clientName} (${params.serviceName})`,
      react: <NewCaseStaffEmail brokerName={params.brokerName} clientName={params.clientName} serviceName={params.serviceName} />,
    });
  } catch (err) {
    console.error("Error enviando email de nueva solicitud a soporte:", err);
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
