import { Metadata } from "next";
import FundingClient from "./FundingClient";

export const metadata: Metadata = {
  title: "Capital y Fondeo",
  description: "Accede a más de 65 prestamistas a nivel nacional para obtener líneas de crédito, préstamos para negocios y financiamiento inmobiliario.",
};

export default function Funding() {
  return <FundingClient />;
}