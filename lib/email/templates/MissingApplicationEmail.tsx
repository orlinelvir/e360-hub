import { Heading, Text, Button, Section } from "@react-email/components";
import EmailLayout from "./EmailLayout";

interface MissingApplicationEmailProps {
  clientFirstName: string;
  brokerName: string;
  serviceName: string;
  formLink?: string;
}

export default function MissingApplicationEmail({ clientFirstName, brokerName, serviceName, formLink }: MissingApplicationEmailProps) {
  const hasRealLink = Boolean(formLink && formLink.startsWith("http"));

  return (
    <EmailLayout
      previewText={`Falta un paso para continuar tu solicitud de ${serviceName}`}
      eyebrow="Departamento de Aplicaciones"
      audience="client"
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "999px",
          backgroundColor: "#3A2E0E",
          border: "2px solid #F0C000",
          color: "#F0C000",
          fontSize: "26px",
          fontWeight: 800,
          textAlign: "center",
          lineHeight: "52px",
          margin: "0 0 18px",
        }}
      >
        !
      </div>

      <Heading style={{ color: "#ffffff", fontSize: "21px", margin: "0 0 14px", lineHeight: "28px" }}>
        Hola {clientFirstName}, falta un paso para continuar
      </Heading>

      <Text style={{ color: "#C4CBD9", fontSize: "14px", lineHeight: "22px", margin: "0 0 16px" }}>
        <span style={{ color: "#ffffff", fontWeight: 700 }}>{brokerName}</span> te refirió con nosotros para tu trámite de{" "}
        <span style={{ color: "#ffffff", fontWeight: 700 }}>{serviceName}</span>, pero todavía no hemos recibido tu formulario
        oficial de solicitud — sin él, no podemos comenzar a revisar tu caso.
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
        <Text style={{ color: "#F0C000", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>
          Qué falta
        </Text>
        <Text style={{ color: "#C4CBD9", fontSize: "13px", lineHeight: "21px", margin: 0 }}>
          {hasRealLink
            ? "Completa el formulario oficial usando el botón de abajo. Toma solo unos minutos y es el único paso pendiente."
            : `Comunícate con ${brokerName} o con nuestro equipo para que te compartan el formulario oficial de tu trámite.`}
        </Text>
      </Section>

      {hasRealLink && (
        <Section style={{ margin: "0 0 20px" }}>
          <Button
            href={formLink}
            style={{
              backgroundColor: "#F0C000",
              color: "#1a1400",
              fontSize: "13px",
              fontWeight: 800,
              padding: "12px 22px",
              borderRadius: "12px",
              textDecoration: "none",
            }}
          >
            Completar formulario
          </Button>
        </Section>
      )}

      <Text style={{ color: "#8A94A6", fontSize: "13px", lineHeight: "21px", margin: 0 }}>
        Si ya lo llenaste o tienes alguna pregunta, responde directamente a este correo y con gusto te ayudamos.
      </Text>

      <Text style={{ color: "#C4CBD9", fontSize: "13px", margin: "20px 0 0" }}>
        Gracias por tu confianza,
        <br />
        <span style={{ color: "#ffffff", fontWeight: 700 }}>Equipo de Atención al Cliente · Emprende 360</span>
      </Text>
    </EmailLayout>
  );
}
