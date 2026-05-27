import { Metadata } from "next";
import CRMClient from "./CRMClient";

export const metadata: Metadata = {
  title: "Tecnología y Escala (CRM)",
  description: "Tu agencia en piloto automático. Nuestro CRM unifica tus embudos, calendarios, seguimientos e inteligencia artificial en un solo ecosistema.",
};

export default function CRM() {
  return <CRMClient />;
}