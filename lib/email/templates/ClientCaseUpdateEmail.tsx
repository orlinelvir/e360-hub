import { Heading, Text, Section } from "@react-email/components";
import EmailLayout from "./EmailLayout";

interface ClientCaseUpdateEmailProps {
  clientFirstName: string;
  serviceName: string;
  noteContent: string;
}

export default function ClientCaseUpdateEmail({ clientFirstName, serviceName, noteContent }: ClientCaseUpdateEmailProps) {
  return (
    <EmailLayout
      previewText={`Actualización sobre tu solicitud de ${serviceName}`}
      eyebrow="Departamento de Aplicaciones"
      audience="client"
    >
      <Text style={{ color: "#8A94A6", fontSize: "13px", margin: "2px 0 2px" }}>Hola {clientFirstName},</Text>
      <Heading style={{ color: "#ffffff", fontSize: "19px", margin: "0 0 14px", lineHeight: "26px" }}>
        Actualización sobre tu solicitud
      </Heading>

      <Text style={{ color: "#C4CBD9", fontSize: "14px", lineHeight: "22px", margin: "0 0 16px" }}>
        Tenemos una actualización sobre tu trámite de <span style={{ color: "#ffffff", fontWeight: 700 }}>{serviceName}</span>:
      </Text>

      <Section
        style={{
          backgroundColor: "#05101F",
          border: "1px solid #1B2C45",
          borderRadius: "14px",
          padding: "18px 20px",
          margin: "0 0 22px",
        }}
      >
        <Text style={{ color: "#ffffff", fontSize: "14px", lineHeight: "22px", margin: 0, whiteSpace: "pre-wrap" }}>
          {noteContent}
        </Text>
      </Section>

      <Text style={{ color: "#8A94A6", fontSize: "13px", lineHeight: "21px", margin: 0 }}>
        Si tienes alguna pregunta, puedes responder directamente a este correo y con gusto te asistimos.
      </Text>

      <Text style={{ color: "#C4CBD9", fontSize: "13px", margin: "20px 0 0" }}>
        Gracias por tu confianza,
        <br />
        <span style={{ color: "#ffffff", fontWeight: 700 }}>Equipo de Atención al Cliente · Emprende 360</span>
      </Text>
    </EmailLayout>
  );
}
