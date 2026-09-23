import { getResendClient, EMAIL_FROM, EMAIL_FROM_CLIENT } from "./client";
import CaseStatusEmail, { CaseEmailStatus } from "./templates/CaseStatusEmail";
import BrokerNoteEmail from "./templates/BrokerNoteEmail";
import WelcomeApplicationEmail from "./templates/WelcomeApplicationEmail";
import BrokerOnboardingEmail from "./templates/BrokerOnboardingEmail";
import PasswordResetEmail from "./templates/PasswordResetEmail";
import MissingApplicationEmail from "./templates/MissingApplicationEmail";
import ClientCaseUpdateEmail from "./templates/ClientCaseUpdateEmail";

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

interface ClientCaseUpdateEmailParams {
  clientEmail: string;
  clientName: string;
  serviceName: string;
  noteContent: string;
}

// Igual que sendBrokerNoteEmail: reporta el resultado real en vez de
// tragarse el error, porque el punto de esta función es precisamente que el
// cliente reciba la actualización sin depender de que el broker se la reenvíe.
export async function sendClientCaseUpdateEmail(params: ClientCaseUpdateEmailParams): Promise<{ sent: boolean; error?: string }> {
  const resend = getResendClient();
  if (!resend) return { sent: false, error: "Resend no está configurado en el servidor (falta RESEND_API_KEY)." };
  if (!params.clientEmail) return { sent: false, error: "El cliente no tiene un correo registrado." };

  const firstName = params.clientName.trim().split(" ")[0] || params.clientName;

  try {
    await resend.emails.send({
      from: EMAIL_FROM_CLIENT,
      to: params.clientEmail,
      subject: `Actualización sobre tu solicitud de ${params.serviceName}`,
      react: (
        <ClientCaseUpdateEmail
          clientFirstName={firstName}
          serviceName={params.serviceName}
          noteContent={params.noteContent}
        />
      ),
    });
    return { sent: true };
  } catch (err) {
    console.error("Error enviando email de actualización al cliente:", err);
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
  clientEmail: string;
  clientName: string;
  brokerName: string;
  serviceName: string;
  formLink?: string;
}

export async function sendMissingApplicationEmail(params: MissingApplicationEmailParams): Promise<void> {
  const resend = getResendClient();
  if (!resend || !params.clientEmail) return;

  const firstName = params.clientName.trim().split(" ")[0] || params.clientName;

  try {
    await resend.emails.send({
      from: EMAIL_FROM_CLIENT,
      to: params.clientEmail,
      subject: `Falta un paso para continuar tu solicitud de ${params.serviceName}`,
      react: (
        <MissingApplicationEmail
          clientFirstName={firstName}
          brokerName={params.brokerName}
          serviceName={params.serviceName}
          formLink={params.formLink}
        />
      ),
    });
  } catch (err) {
    console.error("Error enviando email de formulario faltante al cliente:", err);
  }
}

interface WelcomeApplicationEmailParams {
  clientEmail: string;
  clientName: string;
  serviceName: string;
}

export async function sendWelcomeApplicationEmail(params: WelcomeApplicationEmailParams): Promise<void> {
  const resend = getResendClient();
  if (!resend || !params.clientEmail) return;

  const firstName = params.clientName.trim().split(" ")[0] || params.clientName;

  try {
    await resend.emails.send({
      from: EMAIL_FROM_CLIENT,
      to: params.clientEmail,
      subject: `Hemos recibido tu solicitud de ${params.serviceName}`,
      react: <WelcomeApplicationEmail clientFirstName={firstName} serviceName={params.serviceName} />,
    });
  } catch (err) {
    console.error("Error enviando email de bienvenida al cliente:", err);
  }
}
