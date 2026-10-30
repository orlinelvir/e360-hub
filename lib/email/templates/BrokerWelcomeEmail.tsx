import { Heading, Text, Button, Section } from "@react-email/components";
import EmailLayout from "./EmailLayout";
import { APP_BASE_URL } from "../client";

interface BrokerWelcomeEmailProps {
  brokerName: string;
  brokerEmail: string;
  /** undefined cuando todavía no se registró en el Hub (ver webhook de GHL
   * "payment_completed" en app/api/webhooks/ghl/route.ts) — el ID real solo
   * se puede asignar una vez existe una cuenta de Firebase Auth. */
  brokerId?: string;
}

interface Step {
  number: number;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  color: string;
}

// Contenido y enlaces confirmados en vivo (capturas del Workflow real de GHL
// "payment completed (spanish)", 2026-10-29) — no inventados. Si este
// Workflow cambia de contenido del lado de GHL, hay que actualizar esto a
// mano; no hay una sola fuente de verdad compartida entre los dos sistemas.
const STEPS: Step[] = [
  {
    number: 1,
    title: "Comunidad Oficial en WhatsApp",
    description: "Únete al grupo exclusivo de soporte y anuncios (Lun - Vie 10 AM a 6 PM EST).",
    ctaLabel: "Unirme al Grupo de WhatsApp",
    ctaHref: "https://chat.whatsapp.com/IaX7d9gPDFzAX8DWklzmLE",
    color: "#10B981"
  },
  {
    number: 2,
    title: "Accede a tu Biblioteca E360",
    description: "Ingresa con tu correo para acceder a todos los cursos y entrenamientos grabados.",
    ctaLabel: "Abrir E360library.com",
    ctaHref: "https://e360library.com",
    color: "#00E0F0"
  },
  {
    number: 3,
    title: "Ingresa al Hub E360",
    description: "La app de la compañía donde podrás someter tus aplicaciones, dar seguimiento a tus clientes y abrir tickets de soporte.",
    ctaLabel: "Ir al Hub E360",
    ctaHref: `${APP_BASE_URL}/hub/broker-onboarding`,
    color: "#3B82F6"
  },
  {
    number: 4,
    title: 'Guía de Servicio "Hecho por Ti"',
    description: "Tú vendes el servicio y nuestro equipo de fulfillment hace el trabajo — Reparación de Crédito, Crédito Empresarial, Página Web y CRM para tu cliente.",
    ctaLabel: "Ver Guía Done For You",
    ctaHref: "https://assets.cdn.filesafe.space/ZF5DfVEmMfEhmmJBEHjw/media/6a2a1390944ae1c947cc4aaf.pdf",
    color: "#F97316"
  },
  {
    number: 5,
    title: "Guía de Servicios",
    description: "El catálogo completo de servicios — precios, requisitos y el enlace oficial de cada uno.",
    ctaLabel: "Ver Guía de Servicios",
    ctaHref: "https://assets.cdn.filesafe.space/ZF5DfVEmMfEhmmJBEHjw/media/6a2a16522719d8cb18b53b5a.pdf",
    color: "#F43F5E"
  },
  {
    number: 6,
    title: "Formulario de Onboarding del CRM",
    description: "Completa este formulario para auto-crear tu subcuenta de StartPoint CRM con tu branding y Snapshot precargado.",
    ctaLabel: "Llenar Formulario de Onboarding",
    ctaHref: "https://api.leadconnectorhq.com/widget/form/sacDExsiSmi2biBxC5Cu",
    color: "#A855F7"
  },
  {
    number: 7,
    title: "Horario de Clases en Vivo (Zoom)",
    description: "Todos los horarios en hora del Este (EST). Lunes y Martes 7:00 PM, Miércoles 12:00 PM, Jueves 5:00 PM (sujeto a cambios), Domingos 9:00 PM.",
    color: "#F59E0B"
  },
  {
    number: 8,
    title: "Contrato de Servicios",
    description: "El contrato de prestación de servicios, incluida la garantía de devolución de 90 días. Fírmalo directamente desde el Hub, en Mi Perfil.",
    ctaLabel: "Ver Contrato",
    ctaHref: "https://api.leadconnectorhq.com/widget/form/j8cbC01b5t6UhaDbAusL",
    color: "#6366F1"
  },
  {
    number: 9,
    title: "Contactos por Departamento",
    description: "Números y enlaces directos de soporte técnico, underwriting y cada departamento.",
    ctaLabel: "Ver Contactos y Enlaces",
    ctaHref: "https://docs.google.com/document/d/1-wruJtfWWfwQuJEVa9gNthZEyYIHcXw1goW4Yc0zI4M/edit",
    color: "#14B8A6"
  },
  {
    number: 10,
    title: "Agenda tu Sesión de Onboarding",
    description: "Si necesitas ayuda personalizada para arrancar, agenda directamente un espacio con el equipo.",
    ctaLabel: "Agendar Sesión",
    ctaHref: "https://api.leadconnectorhq.com/widget/booking/mPWdnyvj5fBoP46m5PJt",
    color: "#64748B"
  }
];

export default function BrokerWelcomeEmail({ brokerName, brokerEmail, brokerId }: BrokerWelcomeEmailProps) {
  return (
    <EmailLayout previewText={brokerId ? `¡Bienvenido a Emprende 360! Tu ID de Broker es ${brokerId}` : "¡Bienvenido a Emprende 360!"} eyebrow="Programa de Broker Oficial" audience="broker">
      <Heading style={{ color: "#ffffff", fontSize: "22px", margin: "0 0 8px", lineHeight: "28px" }}>
        ¡Bienvenido a bordo, {brokerName}!
      </Heading>
      <Text style={{ color: "#8A94A6", fontSize: "14px", lineHeight: "21px", margin: "0 0 20px" }}>
        Estamos muy contentos de tenerte con nosotros y de acompañarte en tu camino hacia el éxito.
      </Text>

      {brokerId ? (
        <Section
          style={{
            backgroundColor: "#05101F",
            border: "1px solid #1B2C45",
            borderRadius: "14px",
            padding: "16px 20px",
            margin: "0 0 24px",
            textAlign: "center"
          }}
        >
          <Text style={{ color: "#8A94A6", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>
            Tu ID Oficial E360
          </Text>
          <Text style={{ color: "#00E0F0", fontSize: "20px", fontWeight: 800, fontFamily: "monospace", margin: 0 }}>
            {brokerId}
          </Text>
        </Section>
      ) : (
        <Section
          style={{
            backgroundColor: "#05101F",
            border: "1px solid #1B2C45",
            borderRadius: "14px",
            padding: "16px 20px",
            margin: "0 0 24px",
            textAlign: "center"
          }}
        >
          <Text style={{ color: "#C4CBD9", fontSize: "12px", lineHeight: "19px", margin: "0 0 10px" }}>
            Crea tu cuenta en el Hub para recibir tu ID oficial de Broker E360.
          </Text>
          <Button
            href={`${APP_BASE_URL}/hub/broker-onboarding`}
            style={{
              backgroundColor: "#00E0F0",
              color: "#031019",
              fontSize: "12px",
              fontWeight: 800,
              padding: "10px 20px",
              borderRadius: "10px",
              textDecoration: "none"
            }}
          >
            Completar mi Registro en el Hub
          </Button>
        </Section>
      )}

      <Text style={{ color: "#C4CBD9", fontSize: "13px", lineHeight: "21px", margin: "0 0 22px" }}>
        Completa los siguientes pasos de tu inducción:
      </Text>

      {STEPS.map((step) => (
        <Section
          key={step.number}
          style={{
            backgroundColor: "#05101F",
            border: "1px solid #1B2C45",
            borderRadius: "14px",
            padding: "16px 18px",
            margin: "0 0 12px"
          }}
        >
          <table role="presentation" cellPadding={0} cellSpacing={0} style={{ width: "100%" }}>
            <tbody>
              <tr>
                <td style={{ width: "36px", verticalAlign: "top" }}>
                  <div
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "8px",
                      backgroundColor: `${step.color}33`,
                      border: `1px solid ${step.color}66`,
                      color: step.color,
                      fontWeight: 800,
                      fontSize: "12px",
                      textAlign: "center",
                      lineHeight: "26px"
                    }}
                  >
                    {step.number}
                  </div>
                </td>
                <td style={{ verticalAlign: "top", paddingLeft: "4px" }}>
                  <Text style={{ color: "#ffffff", fontSize: "13px", fontWeight: 700, margin: "0 0 4px" }}>{step.title}</Text>
                  <Text style={{ color: "#8A94A6", fontSize: "12px", lineHeight: "18px", margin: step.ctaHref ? "0 0 8px" : 0 }}>
                    {step.number === 2 ? (
                      <>Ingresa con tu correo <strong style={{ color: "#C4CBD9" }}>{brokerEmail}</strong> para acceder a todos los cursos y entrenamientos grabados.</>
                    ) : (
                      step.description
                    )}
                  </Text>
                  {step.ctaHref && (
                    <Button
                      href={step.ctaHref}
                      style={{
                        backgroundColor: step.color,
                        color: "#000000",
                        fontSize: "11px",
                        fontWeight: 800,
                        padding: "8px 14px",
                        borderRadius: "8px",
                        textDecoration: "none"
                      }}
                    >
                      {step.ctaLabel} →
                    </Button>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </Section>
      ))}

      <Text style={{ color: "#8A94A6", fontSize: "13px", lineHeight: "21px", margin: "20px 0 0", textAlign: "center" }}>
        ¿Tienes preguntas? Escríbenos a{" "}
        <a href="mailto:info@emprende360.biz" style={{ color: "#00E0F0", fontWeight: 700 }}>
          info@emprende360.biz
        </a>
      </Text>
    </EmailLayout>
  );
}
