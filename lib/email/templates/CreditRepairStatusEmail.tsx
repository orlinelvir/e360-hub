import { Heading, Text, Button, Section } from "@react-email/components";
import EmailLayout from "./EmailLayout";
import { APP_BASE_URL } from "../client";

// Vocabulario propio para Reparación de Crédito — es una suscripción de
// $10/mes, no un préstamo, así que "Aprobado/Declinado/Fondeado" (ver
// CaseStatusEmail.tsx) no aplica acá. No incluye "pending_verification": ese
// es el estado inicial, nunca una transición que amerite avisar al broker.
export type CreditRepairEmailStatus = "active" | "paused" | "cancelled" | "declined";

interface CreditRepairStatusEmailProps {
  brokerName: string;
  clientName: string;
  status: CreditRepairEmailStatus;
  reason?: string;
}

const STATUS_META: Record<
  CreditRepairEmailStatus,
  { label: string; color: string; bg: string; icon: string; nextSteps: string }
> = {
  active: {
    label: "Activo",
    color: "#34D399",
    bg: "#0E3324",
    icon: "✓",
    nextSteps:
      "El cliente ya quedó activo en el programa de Reparación de Crédito. Puedes darle seguimiento al avance de las rondas en Mis Clientes.",
  },
  paused: {
    label: "Pausado",
    color: "#00E0F0",
    bg: "#0E3A40",
    icon: "❚❚",
    nextSteps:
      "La suscripción de $10/mes quedó pausada. Si el cliente quiere reanudarla, contáctanos para reactivar el servicio.",
  },
  cancelled: {
    label: "Cancelado",
    color: "#9CA3AF",
    bg: "#2A2E37",
    icon: "✕",
    nextSteps:
      "La suscripción fue cancelada. No se generarán más cargos ni rondas de seguimiento para este cliente.",
  },
  declined: {
    label: "Declinado",
    color: "#9CA3AF",
    bg: "#2A2E37",
    icon: "✕",
    nextSteps:
      "El cliente no calificó para el programa de Reparación de Crédito. Es buen momento para contactarlo y ofrecerle otra opción de nuestro catálogo.",
  },
};

export default function CreditRepairStatusEmail({ brokerName, clientName, status, reason }: CreditRepairStatusEmailProps) {
  const meta = STATUS_META[status];

  return (
    <EmailLayout previewText={`El caso de Reparación de Crédito de ${clientName} ahora está ${meta.label}`} eyebrow="Torre de Control · Reparación de Crédito" audience="broker">
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
                  fontSize: "20px",
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
                El caso de Reparación de Crédito está{" "}
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
        <Text style={{ color: "#8A94A6", fontSize: "13px", margin: 0 }}>Reparación de Crédito · $10/mes</Text>
      </Section>

      {reason && (
        <Section
          style={{
            backgroundColor: "#2A1414",
            border: "1px solid #4A2323",
            borderRadius: "14px",
            padding: "14px 18px",
            margin: "0 0 20px",
          }}
        >
          <Text style={{ color: "#F0A0A0", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>
            Motivo
          </Text>
          <Text style={{ color: "#E5C4C4", fontSize: "13px", lineHeight: "20px", margin: 0, whiteSpace: "pre-wrap" }}>
            {reason}
          </Text>
        </Section>
      )}

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
