"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Detectar el scroll para cambiar el fondo de la barra
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Inicio", path: "/" },
    { name: "Fondeo", path: "/funding" },
    { name: "Reparación", path: "/credit-repair" },
    { name: "Software (CRM)", path: "/crm" },
    { name: "Incorporación", path: "/incorporation" },
    { name: "Live Training", path: "/live-training" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#05101F]/80 backdrop-blur-lg border-b border-gray-800 shadow-lg py-4"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        
        {/* Logo E360 */}
        <Link href="/" className="flex items-center gap-1 group">
          <span className="text-3xl font-bold text-white tracking-tighter">
            E<span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-400 to-blue-600">360</span>
          </span>
          <span className="text-cyan-400 text-3xl font-bold relative -top-2 group-hover:animate-pulse">°</span>
        </Link>

        {/* Enlaces de Escritorio */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link, index) => (
            <Link 
              key={index} 
              href={link.path}
              className="text-sm font-medium text-gray-300 hover:text-cyan-400 transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Botones de Acción (Escritorio) */}
        <div className="hidden lg:flex items-center gap-4">
          <Link href="#" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
            Login Portal
          </Link>
          <Link href="#" className="bg-gradient-to-r from-cyan-400 to-blue-600 text-black px-5 py-2.5 rounded-lg text-sm font-bold hover:scale-105 transition-transform shadow-[0_0_15px_rgba(0,224,240,0.2)]">
            Ser Broker
          </Link>
        </div>

        {/* Botón de Menú Móvil */}
        <button 
          className="lg:hidden text-gray-300 hover:text-cyan-400 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

      </div>

      {/* Menú Desplegable Móvil */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-[#05101F] border-b border-gray-800 shadow-2xl py-4 px-6 flex flex-col gap-4">
          {navLinks.map((link, index) => (
            <Link 
              key={index} 
              href={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-medium text-gray-300 hover:text-cyan-400 transition-colors py-2 border-b border-gray-800/50"
            >
              {link.name}
            </Link>
          ))}
          <div className="flex flex-col gap-3 mt-4">
            <Link href="#" className="text-center py-3 text-gray-300 border border-gray-700 rounded-lg">Login Portal</Link>
            <Link href="#" className="text-center py-3 bg-cyan-500 text-black font-bold rounded-lg">Ser Broker</Link>
          </div>
        </div>
      )}
    </nav>
  );
}