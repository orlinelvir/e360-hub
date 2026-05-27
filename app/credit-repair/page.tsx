import { Metadata } from "next";
import CreditRepairClient from "./CreditRepairClient";

export const metadata: Metadata = {
  title: "Restauración de Crédito",
  description: "Restaura tu crédito y recupera tu libertad. Análisis profundo de los tres burós principales utilizando estrategias basadas en la FCRA.",
};

export default function CreditRepair() {
  return <CreditRepairClient />;
}