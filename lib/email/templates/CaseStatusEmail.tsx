import { Heading, Text, Button, Section } from "@react-email/components";
import EmailLayout from "./EmailLayout";
import { APP_BASE_URL } from "../client";

export type CaseEmailStatus = "approved" | "rejected" | "funded";

interface CaseStatusEmailProps {
  brokerName: string;
  clientName: string;
  serviceName: string;
  status: CaseEmailStatus;
  amount?: number;
}

const STATUS_META: Record<
  CaseEmailStatus,
  { label: string; color: string; bg: string; icon: string; nextSteps: string }
> = {
  approved: {
    label: "Aprobado",
    color: "#00E0F0",
    bg: "#0E3A40",
    icon: "✓",
    nextSteps:
      "El departamento de underwriting se estará comunicando con el cliente para presentarle los detalles de la oferta y los próximos pasos. Te recomendamos darle seguimiento tú también esta semana.",
  },
  rejected: {
    label: "Declinado",
    color: "#9CA3AF",
    bg: "#2A2E37",
    icon: "✕",
    nextSteps:
      "Si el cliente tiene preguntas sobre la decisión o quiere explorar otras opciones, es buen momento para contactarlo y ofrecerle alternativas dentro de nuestro catálogo de servicios.",
  },
  funded: {
    label: "Fondeado / Pagado",
    color: "#34D399",
    bg: "#0E3324",
    icon: "$",
    nextSteps:
      "¡Felicidades! Este caso ya generó comisión. Puedes ver el detalle en Mis Clientes y aprovechar para pedirle una referencia a tu cliente.",
  },
};

function formatMoney(amount?: number) {
  if (!amount) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

export default function CaseStatusEmail({ brokerName, clientName, serviceName, status, amount }: CaseStatusEmailProps) {
  const meta = STATUS_META[status];
  const formattedAmount = formatMoney(amount);

  return (
    <EmailLayout previewText={`El caso de ${clientName} ahora está ${meta.label}`} eyebrow="Torre de Control · Actualización de Caso" audience="broker">
      <table role="presentation" cellPadding={0} cellSpacing={0} style={{ width: "100%", marginBottom: "22px" }}>
        <tbody>
          <tr>
            <td style={{ width: "56px", verticalAlign: "top" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "999px",
                  backgroundColor: meta.bg,
                  border: `2px solid ${meta.color}`,
                  color: meta.color,
                  fontSize: "22px",
                  fontWeight: 800,
                  textAlign: "center",
                  lineHeight: "44px",
                }}
              >
                {meta.icon}
              </div>
            </td>
            <td style={{ verticalAlign: "top", paddingLeft: "4px" }}>
              <Text style={{ color: "#8A94A6", fontSize: "13px", margin: "2px 0 2px" }}>Hola {brokerName},</Text>
              <Heading style={{ color: "#ffffff", fontSize: "19px", margin: 0, lineHeight: "26px" }}>
                Tu caso está{" "}
                <span style={{ color: meta.color }}>{meta.label.toLowerCase()}</span>
              </Heading>
            </td>
          </tr>
        </tbody>
      </table>

      <Section
        style={{
          backgroundColor: "#05101F",
          border: "1px solid #1B2C45",
          borderRadius: "14px",
          padding: "18px 20px",
          margin: "0 0 20px",
        }}
      >
        <Text style={{ color: "#ffffff", fontSize: "15px", fontWeight: 700, margin: "0 0 4px" }}>{clientName}</Text>
        <Text style={{ color: "#8A94A6", fontSize: "13px", margin: 0 }}>{serviceName}</Text>
        {formattedAmount && (
          <Text style={{ color: "#8A94A6", fontSize: "12px", margin: "12px 0 0" }}>
            Monto: <span style={{ color: "#ffffff", fontWeight: 700 }}>{formattedAmount}</span>
          </Text>
        )}
      </Section>

      <Text style={{ color: "#C4CBD9", fontSize: "13px", lineHeight: "21px", margin: "0 0 22px" }}>
        {meta.nextSteps}
      </Text>

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
        Ver en Mis Clientes
      </Button>
    </EmailLayout>
  );
}
