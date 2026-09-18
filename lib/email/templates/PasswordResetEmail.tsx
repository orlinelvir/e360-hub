import { Heading, Text, Button, Section } from "@react-email/components";
import EmailLayout from "./EmailLayout";

interface PasswordResetEmailProps {
  brokerName: string;
  authorName: string;
  resetLink: string;
}

export default function PasswordResetEmail({ brokerName, authorName, resetLink }: PasswordResetEmailProps) {
  return (
    <EmailLayout previewText="Restablece la contraseña de tu cuenta de E360 Hub" eyebrow="Seguridad de la cuenta" audience="broker">
      <Text style={{ color: "#8A94A6", fontSize: "13px", margin: "2px 0 2px" }}>Hola {brokerName},</Text>
      <Heading style={{ color: "#ffffff", fontSize: "19px", margin: "0 0 18px", lineHeight: "26px" }}>
        Restablece tu contraseña
      </Heading>

      <Text style={{ color: "#c4cad6", fontSize: "14px", lineHeight: "22px", margin: "0 0 22px" }}>
        {authorName} del equipo de E360 solicitó un enlace para restablecer la contraseña de tu cuenta. Haz clic en el
        botón de abajo para crear una nueva contraseña. Si tú no pediste esto, puedes ignorar este correo con
        confianza — tu contraseña actual sigue funcionando.
      </Text>

      <Section style={{ margin: "0 0 22px" }}>
        <Button
          href={resetLink}
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
          Restablecer contraseña
        </Button>
      </Section>

      <Text style={{ color: "#8A94A6", fontSize: "12px", lineHeight: "18px", margin: 0 }}>
        Este enlace es de un solo uso y expira pronto por seguridad. Si expiró, pide al equipo de E360 que te envíe uno nuevo.
      </Text>
    </EmailLayout>
  );
}
