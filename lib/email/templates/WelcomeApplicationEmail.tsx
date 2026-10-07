import { Heading, Text, Section } from "@react-email/components";
import EmailLayout from "./EmailLayout";

interface WelcomeApplicationEmailProps {
  brokerName: string;
  clientName: string;
  serviceName: string;
}

// Antes le llegaba directo al cliente final. JP fue explícito: el cliente
// firmó contrato con el broker, no con E360, así que esta notificación es
// para el broker — es él quien le avisa a su cliente, con su propia voz.
export default function WelcomeApplicationEmail({ brokerName, clientName, serviceName }: WelcomeApplicationEmailProps) {
  return (
    <EmailLayout
      previewText={`La solicitud de ${clientName} fue recibida — en 24 a 72 horas tendrás una respuesta`}
      eyebrow="Torre de Control · Nueva Solicitud"
      audience="broker"
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
        ¡Hola {brokerName}! Recibimos la solicitud de {clientName}
      </Heading>

      <Text style={{ color: "#C4CBD9", fontSize: "14px", lineHeight: "22px", margin: "0 0 16px" }}>
        El trámite de <span style={{ color: "#ffffff", fontWeight: 700 }}>{serviceName}</span> de tu cliente{" "}
        <span style={{ color: "#ffffff", fontWeight: 700 }}>{clientName}</span> ya quedó registrado y nuestro equipo
        comenzó a revisarlo.
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
          En un plazo de <span style={{ color: "#ffffff", fontWeight: 700 }}>24 a 72 horas</span> tendrás una respuesta
          o te pediremos información adicional si hace falta. Te recomendamos avisarle a tu cliente que su solicitud
          ya está en trámite.
        </Text>
      </Section>

      <Text style={{ color: "#8A94A6", fontSize: "13px", lineHeight: "21px", margin: 0 }}>
        Si tienes alguna pregunta mientras tanto, puedes responder directamente a este correo.
      </Text>
    </EmailLayout>
  );
}
