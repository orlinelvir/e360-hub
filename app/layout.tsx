import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar"; // O la ruta donde tengas tu Navbar
import Footer from "@/components/Footer"; // <--- AÑADE ESTA LÍNEA

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "E360 | House of Entrepreneurship",
  description: "El ecosistema definitivo para corredores de préstamos a nivel nacional.",
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