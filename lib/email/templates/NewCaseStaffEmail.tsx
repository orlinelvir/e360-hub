import { Heading, Text } from "@react-email/components";
import EmailLayout from "./EmailLayout";

interface NewCaseStaffEmailProps {
  brokerName: string;
  clientName: string;
  serviceName: string;
}

export default function NewCaseStaffEmail({ brokerName, clientName, serviceName }: NewCaseStaffEmailProps) {
  return (
    <EmailLayout
      previewText={`${brokerName} sometió una nueva solicitud de ${serviceName} para ${clientName}`}
      eyebrow="Torre de Control · Nueva Solicitud"
      audience="broker"
    >
      <Heading style={{ color: "#ffffff", fontSize: "20px", margin: "0 0 14px", lineHeight: "27px" }}>
        Nueva solicitud recibida
      </Heading>

      <Text style={{ color: "#C4CBD9", fontSize: "14px", lineHeight: "22px", margin: 0 }}>
        El corredor <span style={{ color: "#ffffff", fontWeight: 700 }}>{brokerName}</span> acaba de someter a{" "}
        <span style={{ color: "#ffffff", fontWeight: 700 }}>{clientName}</span> para{" "}
        <span style={{ color: "#ffffff", fontWeight: 700 }}>{serviceName}</span>.
      </Text>
    </EmailLayout>
  );
}
