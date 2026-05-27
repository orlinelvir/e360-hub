"use client";

import { motion } from "framer-motion";
import { ArrowRight, Briefcase, FileText, Globe, Key, ShieldCheck } from "lucide-react";

export default function IncorporationClient() {
  return (
    <main className="min-h-screen bg-[#05101F] text-white flex flex-col relative overflow-hidden">
      
      {/* Resplandor de fondo (Dorado/Gris corporativo) */}
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-blue-900/20 blur-[150px] rounded-full pointer-events-none" />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span className="text-cyan-400 font-semibold tracking-widest uppercase text-xs mb-6 block">
            E360 • Corporate Structure
          </span>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
            Funda tu Negocio en <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-400 to-blue-600">
              Estados Unidos.
            </span>
          </h1>
          
          <p className="text-[#A1A7B3] text-lg md:text-xl mb-12 max-w-3xl mx-auto leading-relaxed">
            Te guiamos en la creación de tu estructura corporativa. Desde el registro de tu LLC o Corp, hasta la obtención de tu ITIN, EIN y número DUNS. Listo para operar y ser fondeable.
          </p>

          <button className="bg-gradient-to-r from-cyan-400 to-blue-600 text-black px-8 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-cyan-300 transition-all mx-auto transform hover:scale-105 shadow-[0_0_20px_rgba(0,224,240,0.3)]">
            Iniciar mi Incorporación <ArrowRight size={20} />
          </button>
        </motion.div>
      </section>

      {/* Grid de Servicios de Incorporación */}
      <section className="py-20 px-6 relative z-10 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* LLC / Corp */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-[#0A182D] border border-gray-800 rounded-2xl p-8 hover:border-cyan-500/50 transition-all">
            <Briefcase className="text-cyan-400 mb-6" size={32} />
            <h3 className="text-xl font-bold mb-3">Registro LLC / Corp</h3>
            <p className="text-gray-400 text-sm">Constitución de empresas en los 50 estados. Te asesoramos sobre la mejor estructura fiscal para proteger tus activos.</p>
          </motion.div>

          {/* ITIN / SSN */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-[#0A182D] border border-gray-800 rounded-2xl p-8 hover:border-cyan-500/50 transition-all">
            <Globe className="text-cyan-400 mb-6" size={32} />
            <h3 className="text-xl font-bold mb-3">Trámite de ITIN</h3>
            <p className="text-gray-400 text-sm">No necesitas ser residente. Tramitamos tu Número de Identificación Personal del Contribuyente para que puedas operar y declarar en USA.</p>
          </motion.div>

          {/* EIN (IRS) */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-[#0A182D] border border-gray-800 rounded-2xl p-8 hover:border-cyan-500/50 transition-all">
            <FileText className="text-cyan-400 mb-6" size={32} />
            <h3 className="text-xl font-bold mb-3">Obtención de EIN (IRS)</h3>
            <p className="text-gray-400 text-sm">El "seguro social" de tu empresa. Indispensable para abrir cuentas bancarias corporativas, pagar nómina y aplicar a fondeo.</p>
          </motion.div>

          {/* DUNS Number */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="bg-[#0A182D] border border-gray-800 rounded-2xl p-8 hover:border-cyan-500/50 transition-all">
            <Key className="text-cyan-400 mb-6" size={32} />
            <h3 className="text-xl font-bold mb-3">Registro DUNS</h3>
            <p className="text-gray-400 text-sm">Te damos de alta en Dun & Bradstreet. El primer paso crucial para construir un perfil de crédito empresarial fuerte.</p>
          </motion.div>

          {/* Compliance & IRS */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="bg-gradient-to-b from-[#0A182D] to-[#05101F] border border-cyan-500/30 rounded-2xl p-8 lg:col-span-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 blur-[60px] rounded-full" />
            <ShieldCheck className="text-cyan-400 mb-6 relative z-10" size={32} />
            <h3 className="text-xl font-bold mb-3 relative z-10">Agente Registrado y Compliance Anual</h3>
            <p className="text-gray-400 text-sm relative z-10 max-w-xl">
              Mantenemos tu empresa en buen estado (Good Standing). Proveemos servicios de agente registrado y te apoyamos en la presentación de reportes anuales y resoluciones corporativas ante el estado y el IRS.
            </p>
          </motion.div>

        </div>
      </section>

    </main>
  );
}
