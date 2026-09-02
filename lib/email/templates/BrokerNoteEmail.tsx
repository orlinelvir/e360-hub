import { Heading, Text, Button, Section } from "@react-email/components";
import EmailLayout from "./EmailLayout";
import { APP_BASE_URL } from "../client";

interface BrokerNoteEmailProps {
  brokerName: string;
  clientName: string;
  serviceName: string;
  authorName: string;
  noteContent: string;
}

export default function BrokerNoteEmail({ brokerName, clientName, serviceName, authorName, noteContent }: BrokerNoteEmailProps) {
  return (
    <EmailLayout previewText={`Nueva nota de ${authorName} sobre el caso de ${clientName}`} eyebrow="Torre de Control · Nota de Equipo" audience="broker">
      <table role="presentation" cellPadding={0} cellSpacing={0} style={{ width: "100%", marginBottom: "22px" }}>
        <tbody>
          <tr>
            <td style={{ width: "56px", verticalAlign: "top" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "999px",
                  backgroundColor: "#0E3A40",
                  border: "2px solid #00E0F0",
                  color: "#00E0F0",
                  fontSize: "20px",
                  fontWeight: 800,
                  textAlign: "center",
                  lineHeight: "44px",
                }}
              >
                ✎
              </div>
            </td>
            <td style={{ verticalAlign: "top", paddingLeft: "4px" }}>
              <Text style={{ color: "#8A94A6", fontSize: "13px", margin: "2px 0 2px" }}>Hola {brokerName},</Text>
              <Heading style={{ color: "#ffffff", fontSize: "19px", margin: 0, lineHeight: "26px" }}>
                Nueva nota del equipo E360
              </Heading>
            </td>
          </tr>
        </tbody>
      </table>

      <Text style={{ color: "#C4CBD9", fontSize: "13px", margin: "0 0 6px" }}>
        Sobre el caso de <span style={{ color: "#ffffff", fontWeight: 700 }}>{clientName}</span> — {serviceName}
      </Text>

      <Section
        style={{
          backgroundColor: "#05101F",
          border: "1px solid #1B2C45",
          borderRadius: "14px",
          padding: "18px 20px",
          margin: "12px 0 22px",
        }}
      >
        <Text style={{ color: "#00E0F0", fontSize: "12px", fontWeight: 700, margin: "0 0 8px" }}>{authorName}</Text>
        <Text style={{ color: "#ffffff", fontSize: "14px", lineHeight: "22px", margin: 0, whiteSpace: "pre-wrap" }}>
          {noteContent}
        </Text>
      </Section>

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
        Ver en Mis Clientes
      </Button>
    </EmailLayout>
  );
}
