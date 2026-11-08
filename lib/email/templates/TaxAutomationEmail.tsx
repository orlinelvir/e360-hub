import { Heading, Text, Section } from "@react-email/components";
import EmailLayout from "./EmailLayout";

interface TaxAutomationEmailProps {
  recipientName: string;
  message: string;
  audience?: "broker" | "client";
}

export default function TaxAutomationEmail({ recipientName, message, audience = "broker" }: TaxAutomationEmailProps) {
  return (
    <EmailLayout previewText={message.slice(0, 80)} eyebrow="Oficina Virtual E360 · Recordatorio Automático" audience={audience}>
      <Heading style={{ color: "#ffffff", fontSize: "19px", margin: "0 0 14px" }}>Hola {recipientName},</Heading>
      <Section
        style={{
          backgroundColor: "#05101F",
          border: "1px solid #1B2C45",
          borderRadius: "14px",
          padding: "18px 20px",
          margin: "0 0 10px",
        }}
      >
        <Text style={{ color: "#ffffff", fontSize: "14px", lineHeight: "22px", margin: 0, whiteSpace: "pre-wrap" }}>{message}</Text>
      </Section>
      <Text style={{ color: "#6B7688", fontSize: "11px", margin: "10px 0 0" }}>
        {audience === "client"
          ? "Este es un recordatorio automático sobre tu caso."
          : "Este correo se generó automáticamente desde una automatización configurada en tu Oficina Virtual E360."}
      </Text>
    </EmailLayout>
  );
}
