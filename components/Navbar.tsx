"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
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
          ? "bg-[#05101F]/90 backdrop-blur-lg border-b border-gray-800 py-4 shadow-2xl"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        
        {/* Logo E360 - Asegúrate que el archivo se llame logo.png en /public */}
        <Link href="/" className="flex items-center group shrink-0 relative h-10 md:h-12 w-32 md:w-40">
          <Image 
            src="/logo.png" 
            alt="E360 Logo" 
            fill
            priority
            className="object-contain transition-transform group-hover:scale-105" 
          />
        </Link>

        {/* Enlaces de Escritorio - Espaciado optimizado */}
        <div className="hidden lg:flex items-center gap-8 xl:gap-10">
          {navLinks.map((link, index) => (
            <Link 
              key={index} 
              href={link.path}
              className="text-sm font-medium text-gray-300 hover:text-cyan-400 transition-colors tracking-wide"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Botones de Acción */}
        <div className="hidden lg:flex items-center gap-6">
          <Link href="/hub/broker-onboarding" className="text-sm font-medium text-gray-400 hover:text-white active:opacity-70 transition-all">
            Login Portal
          </Link>
          <Link 
            href="/hub/broker-onboarding" 
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,224,240,0.3)]"
          >
            Ser Broker
          </Link>
        </div>

        {/* Botón Móvil */}
        <button 
          className="lg:hidden text-gray-300 hover:text-cyan-400 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Menú Móvil */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-[#05101F] border-b border-gray-800 shadow-2xl py-6 px-6 flex flex-col gap-5 animate-in fade-in slide-in-from-top-4">
          {navLinks.map((link, index) => (
            <Link 
              key={index} 
              href={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-medium text-gray-300 hover:text-cyan-400 py-2 border-b border-gray-900"
            >
              {link.name}
            </Link>
          ))}
          <div className="flex flex-col gap-4 mt-4">
            <Link href="/hub/broker-onboarding" className="text-center py-3 text-gray-400 border border-gray-800 rounded-xl">Login Portal</Link>
            <Link href="/hub/broker-onboarding" className="text-center py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold rounded-xl">Ser Broker</Link>
          </div>
        </div>
      )}
    </nav>
  );
}