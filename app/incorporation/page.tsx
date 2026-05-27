import { Metadata } from "next";
import IncorporationClient from "./IncorporationClient";

export const metadata: Metadata = {
  title: "Estructura Corporativa",
  description: "Funda tu negocio en Estados Unidos. Registro de LLC o Corp, obtención de ITIN, EIN y número DUNS. Listo para operar y ser fondeable.",
};

export default function Incorporation() {
  return <IncorporationClient />;
}