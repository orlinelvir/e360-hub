import { Metadata } from "next";
import BrokerOnboardingClient from "./BrokerOnboardingClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Onboarding para Brokers - E360 Hub",
  description: "Guía de referencia rápida y centro de onboarding para corredores autorizados de Emprende 360.",
};

export default function BrokerOnboardingPage() {
  return <BrokerOnboardingClient />;
}
