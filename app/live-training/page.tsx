import { Metadata } from "next";
import LiveTrainingClient from "./LiveTrainingClient";

export const metadata: Metadata = {
  title: "Live Training",
  description: "Sesiones interactivas semanales para brokers y socios. Aprende a utilizar nuestras herramientas de fondeo, reparación y CRM en vivo.",
};

export default function LiveTraining() {
  return <LiveTrainingClient />;
}