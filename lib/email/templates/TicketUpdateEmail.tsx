import { Heading, Text, Button, Section } from "@react-email/components";
import EmailLayout from "./EmailLayout";
import { APP_BASE_URL } from "../client";

export type TicketUpdateKind = "reply" | "resolved";

interface TicketUpdateEmailProps {
  kind: TicketUpdateKind;
  brokerName: string;
  ticketSubject: string;
  senderName: string;
  messagePreview?: string;
}

const META: Record<
  TicketUpdateKind,
  { color: string; bg: string; icon: string; eyebrow: string; title: string; nextSteps: string }
> = {
  reply: {
    color: "#00E0F0",
    bg: "#0E3A40",
    icon: "↩",
    eyebrow: "Torre de Control · Soporte y Tickets",
    title: "Soporte respondió a tu ticket",
    nextSteps:
      "Entra al Hub para leer la respuesta completa y seguir la conversación con el equipo.",
  },
  resolved: {
    color: "#34D399",
    bg: "#0E3324",
    icon: "✓",
    eyebrow: "Torre de Control · Ticket Resuelto",
    title: "Tu ticket fue resuelto",
    nextSteps:
      "Si todo quedó claro no tienes que hacer nada más. Si necesitas ayuda adicional, puedes reabrir el ticket desde el mismo hilo en el Hub y el equipo volverá a atenderlo.",
  },
};

export default function TicketUpdateEmail({
  kind,
  brokerName,
  ticketSubject,
  senderName,
  messagePreview,
}: TicketUpdateEmailProps) {
  const meta = META[kind];

  return (
    <EmailLayout
      previewText={`${meta.title}: ${ticketSubject}`}
      eyebrow={meta.eyebrow}
      audience="broker"
    >
      <table role="presentation" cellPadding={0} cellSpacing={0} style={{ width: "100%", marginBottom: "22px" }}>
        <tbody>
          <tr>
            <td style={{ width: "56px", verticalAlign: "top" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "999px",
                  backgroundColor: meta.bg,
                  border: `2px solid ${meta.color}`,
                  color: meta.color,
                  fontSize: "22px",
                  fontWeight: 800,
                  textAlign: "center",
                  lineHeight: "44px",
                }}
              >
                {meta.icon}
              </div>
            </td>
            <td style={{ verticalAlign: "top", paddingLeft: "4px" }}>
              <Text style={{ color: "#8A94A6", fontSize: "13px", margin: "2px 0 2px" }}>
                Hola {brokerName || "Broker"},
              </Text>
              <Heading style={{ color: "#ffffff", fontSize: "19px", margin: 0, lineHeight: "26px" }}>
                {meta.title}
              </Heading>
            </td>
          </tr>
        </tbody>
      </table>

      <Section
        style={{
          backgroundColor: "#05101F",
          border: "1px solid #1B2C45",
          borderRadius: "14px",
          padding: "18px 20px",
          margin: "12px 0 20px",
        }}
      >
        <Text style={{ color: "#8A94A6", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>
          Ticket
        </Text>
        <Text style={{ color: "#ffffff", fontSize: "15px", fontWeight: 700, margin: "0 0 4px" }}>
          {ticketSubject}
        </Text>
        <Text style={{ color: "#8A94A6", fontSize: "13px", margin: 0 }}>
          {kind === "reply" ? `Respuesta de ${senderName}` : `Cerrado por ${senderName}`}
        </Text>
      </Section>

      {messagePreview && (
          <Section
            style={{
              backgroundColor: "#0A182D",
              border: "1px solid #1B2C45",
              borderRadius: "14px",
              padding: "16px 20px",
              margin: "0 0 20px",
            }}
          >
          <Text style={{ color: meta.color, fontSize: "12px", fontWeight: 700, margin: "0 0 8px" }}>
            {senderName}
          </Text>
          <Text style={{ color: "#C4CBD9", fontSize: "14px", lineHeight: "22px", margin: 0, whiteSpace: "pre-wrap" }}>
            {messagePreview}
            {messagePreview.length >= 180 ? "…" : ""}
          </Text>
        </Section>
      )}

      <Text style={{ color: "#C4CBD9", fontSize: "13px", lineHeight: "21px", margin: "0 0 22px" }}>
        {meta.nextSteps}
      </Text>

      <Button
        href={`${APP_BASE_URL}/hub/broker-onboarding`}
        style={{
          backgroundColor: "#00E0F0",
          color: "#031019",
          fontSize: "13px",
          fontWeight: 800,
          padding: "12px 22px",
          borderRadius: "12px",
          textDecoration: "none",
        }}
      >
        Ver mi ticket en el Hub
      </Button>
    </EmailLayout>
  );
}
