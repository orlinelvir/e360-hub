import { Heading, Text, Button, Section } from "@react-email/components";
import EmailLayout from "./EmailLayout";

interface HardMoneyWorkScopeEmailProps {
  brokerName: string;
  clientName: string;
  fileUrl: string;
  fileName: string;
}

export default function HardMoneyWorkScopeEmail({ brokerName, clientName, fileUrl, fileName }: HardMoneyWorkScopeEmailProps) {
  return (
    <EmailLayout
      previewText={`Work scope de ${clientName} (Hard Money) adjunto por ${brokerName}`}
      eyebrow="Torre de Control · Hard Money"
      audience="broker"
    >
      <Heading style={{ color: "#ffffff", fontSize: "20px", margin: "0 0 14px", lineHeight: "27px" }}>
        Work scope — préstamo Hard Money
      </Heading>

      <Text style={{ color: "#C4CBD9", fontSize: "14px", lineHeight: "22px", margin: "0 0 16px" }}>
        <span style={{ color: "#ffffff", fontWeight: 700 }}>{brokerName}</span> admitió a{" "}
        <span style={{ color: "#ffffff", fontWeight: 700 }}>{clientName}</span> para un préstamo Hard Money y adjuntó
        el work scope (desglose/cotización del negocio) al momento de someter la solicitud.
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
          Documento
        </Text>
        <Text style={{ color: "#C4CBD9", fontSize: "13px", lineHeight: "21px", margin: 0 }}>
          {fileName}
        </Text>
      </Section>

      <Section style={{ margin: "0 0 20px" }}>
        <Button
          href={fileUrl}
          style={{
            backgroundColor: "#00E0F0",
            color: "#05101F",
            fontSize: "13px",
            fontWeight: 800,
            padding: "12px 22px",
            borderRadius: "12px",
            textDecoration: "none",
          }}
        >
          Descargar work scope
        </Button>
      </Section>

      <Text style={{ color: "#8A94A6", fontSize: "12px", lineHeight: "20px", margin: 0 }}>
        El enlace vence en 7 días. Después de eso, el documento sigue disponible en el expediente del caso dentro del Hub.
      </Text>
    </EmailLayout>
  );
}
