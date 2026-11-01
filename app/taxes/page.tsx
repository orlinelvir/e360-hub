import { Metadata } from "next";
import TaxSoftwareContent from "@/components/taxes/TaxSoftwareContent";

export const metadata: Metadata = {
  title: "Software de Taxes Profesional",
  description: "Software profesional de preparación de impuestos en la nube con la marca Emprende 360. Preparación, firmas electrónicas, productos bancarios y e-file al IRS con soporte en español.",
  openGraph: {
    title: "Software de Taxes Profesional | E360",
    description: "Software en la nube para oficinas y preparadores de impuestos. Declaraciones individuales y corporativas, e-file y soporte en español.",
    url: "https://emprende360.info/taxes",
  },
};

export default function TaxesPage() {
  return <TaxSoftwareContent variant="public" />;
}
