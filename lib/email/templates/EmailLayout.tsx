import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Img,
  Text,
  Hr,
  Preview,
} from "@react-email/components";
import { APP_BASE_URL } from "../client";

interface EmailLayoutProps {
  previewText: string;
  /** Nombre de "departamento" mostrado como pequeño eyebrow sobre el título, ej. "Departamento de Aplicaciones". */
  eyebrow?: string;
  /** Cambia el footer y el tono de "no respondas" según a quién va dirigido el correo. */
  audience?: "broker" | "client";
  children: React.ReactNode;
}

export default function EmailLayout({ previewText, eyebrow, audience = "broker", children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <div style={styles.accentBar} />

          <Section style={styles.header}>
            <table role="presentation" cellPadding={0} cellSpacing={0} style={{ width: "100%" }}>
              <tbody>
                <tr>
                  <td style={{ width: 44 }}>
                    <Img src={`${APP_BASE_URL}/logo.png`} alt="E360" width="40" height="40" style={styles.logo} />
                  </td>
                  <td style={{ paddingLeft: "12px" }}>
                    {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
                    <Text style={styles.brand}>E360 Hub</Text>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section style={styles.content}>{children}</Section>

          <Hr style={styles.hr} />

          <Section>
            <Text style={styles.footer}>
              {audience === "client"
                ? "Emprende 360 — Gracias por confiar en nosotros."
                : "Emprende 360 · E360 Hub — Torre de Control para Brokers"}
            </Text>
            <Text style={styles.footerSmall}>
              {audience === "client"
                ? "Este correo es parte del seguimiento de tu solicitud. Puedes responder directamente si tienes preguntas."
                : "Este es un correo automático de notificación interna. No respondas a este mensaje."}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: "#05101F",
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    margin: 0,
    padding: "32px 16px",
  },
  container: {
    backgroundColor: "#0A182D",
    borderRadius: "20px",
    border: "1px solid #1B2C45",
    maxWidth: "560px",
    margin: "0 auto",
    overflow: "hidden",
  },
  accentBar: {
    height: "6px",
    width: "100%",
    backgroundColor: "#00E0F0",
    backgroundImage: "linear-gradient(90deg, #00E0F0 0%, #34D399 100%)",
  },
  header: {
    padding: "24px 32px 18px",
    borderBottom: "1px solid #1B2C45",
  },
  logo: {
    borderRadius: "10px",
    display: "block",
  },
  eyebrow: {
    color: "#00E0F0",
    fontSize: "10px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    margin: "0 0 2px",
  },
  brand: {
    color: "#ffffff",
    fontSize: "17px",
    fontWeight: 800,
    margin: 0,
  },
  content: {
    padding: "30px 32px",
  },
  hr: {
    borderColor: "#1B2C45",
    margin: "0 32px",
  },
  footer: {
    color: "#8A94A6",
    fontSize: "12px",
    padding: "0 32px",
    margin: "16px 0 4px",
  },
  footerSmall: {
    color: "#5C6578",
    fontSize: "11px",
    padding: "0 32px",
    margin: "0 0 24px",
  },
};
