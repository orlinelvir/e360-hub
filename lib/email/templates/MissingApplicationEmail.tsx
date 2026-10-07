import { Heading, Text, Button, Section } from "@react-email/components";
import EmailLayout from "./EmailLayout";

interface MissingApplicationEmailProps {
  brokerName: string;
  clientName: string;
  serviceName: string;
  formLink?: string;
}

// Antes le llegaba directo al cliente final. JP fue explícito: el cliente
// firmó contrato con el broker, no con E360, así que esta notificación es
// para el broker — es él quien le comparte el enlace a su cliente.
export default function MissingApplicationEmail({ brokerName, clientName, serviceName, formLink }: MissingApplicationEmailProps) {
  const hasRealLink = Boolean(formLink && formLink.startsWith("http"));

  return (
    <EmailLayout
      previewText={`A ${clientName} le falta un paso para continuar su solicitud de ${serviceName}`}
      eyebrow="Torre de Control · Formulario Pendiente"
      audience="broker"
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
        Hola {brokerName}, a {clientName} le falta un paso
      </Heading>

      <Text style={{ color: "#C4CBD9", fontSize: "14px", lineHeight: "22px", margin: "0 0 16px" }}>
        Tu cliente <span style={{ color: "#ffffff", fontWeight: 700 }}>{clientName}</span> todavía no tiene registrado
        el formulario oficial de su trámite de <span style={{ color: "#ffffff", fontWeight: 700 }}>{serviceName}</span> —
        sin él no podemos comenzar a revisar el caso.
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
            ? "Comparte el enlace de abajo directamente con tu cliente para que complete el formulario oficial. Toma solo unos minutos."
            : "Comunícate con nuestro equipo para obtener el formulario oficial de este trámite y compártelo con tu cliente."}
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
            Abrir formulario
          </Button>
        </Section>
      )}

      <Text style={{ color: "#8A94A6", fontSize: "13px", lineHeight: "21px", margin: 0 }}>
        Si tu cliente ya lo llenó o tienes alguna pregunta, responde directamente a este correo.
      </Text>
    </EmailLayout>
  );
}
