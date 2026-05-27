import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: "#030812",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "E360 Hub | Instituto de Negocios y Capital",
    template: "%s | E360 Hub"
  },
  description: "Capacitación de élite para dueños de negocios multiservicios. Aprende a estructurar, reparar y fondear empresas.",
  keywords: ["capital", "fondeo", "reparación de crédito", "estructura corporativa", "CRM", "E360", "Yampiero de Dios"],
  authors: [{ name: "Yampiero de Dios" }],
  openGraph: {
    type: "website",
    locale: "es_US",
    url: "https://emprende360.info",
    siteName: "E360 Hub",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "E360 Hub Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "E360 Hub | Instituto de Negocios y Capital",
    description: "Capacitación de élite para dueños de negocios multiservicios.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${inter.className} flex flex-col min-h-screen`} suppressHydrationWarning>
        <Navbar />
        
        {/* Aquí se cargan todas las páginas dinámicamente */}
        <div className="flex-grow">
          {children}
        </div>
        
        {/* El Footer pegado al fondo en todas las páginas */}
        <Footer />
      </body>
    </html>
  );
}