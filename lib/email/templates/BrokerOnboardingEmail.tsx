import { Heading, Text, Button, Section } from "@react-email/components";
import EmailLayout from "./EmailLayout";
import { APP_BASE_URL } from "../client";

interface BrokerOnboardingEmailProps {
  brokerName: string;
  authorName: string;
  message: string;
}

export default function BrokerOnboardingEmail({ brokerName, authorName, message }: BrokerOnboardingEmailProps) {
  return (
    <EmailLayout previewText={`Actualización sobre tu proceso de onboarding en E360`} eyebrow="Equipo de Onboarding E360" audience="broker">
      <Text style={{ color: "#8A94A6", fontSize: "13px", margin: "2px 0 2px" }}>Hola {brokerName},</Text>
      <Heading style={{ color: "#ffffff", fontSize: "19px", margin: "0 0 18px", lineHeight: "26px" }}>
        Actualización de tu onboarding
      </Heading>

      <Section
        style={{
          backgroundColor: "#05101F",
          border: "1px solid #1B2C45",
          borderRadius: "14px",
          padding: "18px 20px",
          margin: "0 0 22px",
        }}
      >
        <Text style={{ color: "#00E0F0", fontSize: "12px", fontWeight: 700, margin: "0 0 8px" }}>{authorName}</Text>
        <Text style={{ color: "#ffffff", fontSize: "14px", lineHeight: "22px", margin: 0, whiteSpace: "pre-wrap" }}>
          {message}
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
        Ir al Hub
      </Button>
    </EmailLayout>
  );
}
