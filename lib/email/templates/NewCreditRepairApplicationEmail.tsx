import { Heading, Text } from "@react-email/components";
import EmailLayout from "./EmailLayout";

interface NewCreditRepairApplicationEmailProps {
  brokerName: string;
  clientName: string;
}

export default function NewCreditRepairApplicationEmail({ brokerName, clientName }: NewCreditRepairApplicationEmailProps) {
  return (
    <EmailLayout
      previewText={`${brokerName} sometió una nueva solicitud de Reparación de Crédito para ${clientName}`}
      eyebrow="Torre de Control · Reparación de Crédito"
      audience="broker"
    >
      <Heading style={{ color: "#ffffff", fontSize: "20px", margin: "0 0 14px", lineHeight: "27px" }}>
        Nueva solicitud de Reparación de Crédito
      </Heading>

      <Text style={{ color: "#C4CBD9", fontSize: "14px", lineHeight: "22px", margin: 0 }}>
        El corredor <span style={{ color: "#ffffff", fontWeight: 700 }}>{brokerName}</span> acaba de someter a{" "}
        <span style={{ color: "#ffffff", fontWeight: 700 }}>{clientName}</span> para Reparación de Crédito.
      </Text>
    </EmailLayout>
  );
}
