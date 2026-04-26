import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar"; // <-- Importamos tu nuevo Navbar

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
      <body className={inter.className}>
        {/* El Navbar se queda fijo arriba de todo */}
        <Navbar />
        
        {/* 'children' son todas las páginas (/, /funding, etc.) que se inyectan aquí */}
        {children}
      </body>
    </html>
  );
}