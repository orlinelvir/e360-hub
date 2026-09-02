import { getResendClient, EMAIL_FROM, EMAIL_FROM_CLIENT } from "./client";
import CaseStatusEmail, { CaseEmailStatus } from "./templates/CaseStatusEmail";
import BrokerNoteEmail from "./templates/BrokerNoteEmail";
import WelcomeApplicationEmail from "./templates/WelcomeApplicationEmail";

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

export async function sendBrokerNoteEmail(params: BrokerNoteEmailParams): Promise<void> {
  const resend = getResendClient();
  if (!resend || !params.brokerEmail) return;

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
  } catch (err) {
    console.error("Error enviando email de nota para el broker:", err);
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
