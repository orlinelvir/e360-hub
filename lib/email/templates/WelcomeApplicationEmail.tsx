import { Heading, Text, Section } from "@react-email/components";
import EmailLayout from "./EmailLayout";

interface WelcomeApplicationEmailProps {
  clientFirstName: string;
  serviceName: string;
}

export default function WelcomeApplicationEmail({ clientFirstName, serviceName }: WelcomeApplicationEmailProps) {
  return (
    <EmailLayout
      previewText={`Hemos recibido tu solicitud de ${serviceName} — en 24 a 72 horas tendrás noticias nuestras`}
      eyebrow="Departamento de Aplicaciones"
      audience="client"
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "999px",
          backgroundColor: "#0E3A40",
          border: "2px solid #00E0F0",
          color: "#00E0F0",
          fontSize: "26px",
          fontWeight: 800,
          textAlign: "center",
          lineHeight: "52px",
          margin: "0 0 18px",
        }}
      >
        ✓
      </div>

      <Heading style={{ color: "#ffffff", fontSize: "21px", margin: "0 0 14px", lineHeight: "28px" }}>
        ¡Hola {clientFirstName}! Recibimos tu solicitud
      </Heading>

      <Text style={{ color: "#C4CBD9", fontSize: "14px", lineHeight: "22px", margin: "0 0 16px" }}>
        Gracias por confiar en nosotros para tu trámite de <span style={{ color: "#ffffff", fontWeight: 700 }}>{serviceName}</span>.
        Ya tenemos tu información y nuestro equipo comenzó a revisarla.
      </Text>

      <Section
        style={{
          backgroundColor: "#05101F",
          border: "1px solid #1B2C45",
          borderRadius: "14px",
          padding: "18px 20px",
          margin: "0 0 20px",
        }}
      >
        <Text style={{ color: "#00E0F0", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>
          ¿Qué sigue?
        </Text>
        <Text style={{ color: "#C4CBD9", fontSize: "13px", lineHeight: "21px", margin: 0 }}>
          En un plazo de <span style={{ color: "#ffffff", fontWeight: 700 }}>24 a 72 horas</span> nuestro equipo se pondrá en contacto
          contigo con una respuesta o para solicitarte información adicional si hace falta. Te recomendamos estar pendiente de tu
          teléfono y correo electrónico.
        </Text>
      </Section>

      <Text style={{ color: "#8A94A6", fontSize: "13px", lineHeight: "21px", margin: 0 }}>
        Si tienes alguna pregunta mientras tanto, puedes responder directamente a este correo y con gusto te asistiremos.
      </Text>

      <Text style={{ color: "#C4CBD9", fontSize: "13px", margin: "20px 0 0" }}>
        Gracias por tu confianza,
        <br />
        <span style={{ color: "#ffffff", fontWeight: 700 }}>Equipo de Atención al Cliente · Emprende 360</span>
      </Text>
    </EmailLayout>
  );
}
