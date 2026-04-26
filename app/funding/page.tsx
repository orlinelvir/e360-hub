"use client";

import { useState } from "react"; // 1. Importamos el estado para que los botones funcionen
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Building2, CreditCard, Landmark, Zap, Globe } from "lucide-react";

export default function Funding() {
  // 2. Estado para controlar qué sección ver
  const [activeTab, setActiveTab] = useState("usa");

  return (
    <main className="min-h-screen bg-[#05101F] text-white flex flex-col relative overflow-hidden">
      
      {/* Resplandor de fondo */}
      <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-40 left-0 w-[400px] h-[400px] bg-cyan-400/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Hero Section - Fondeo */}
      <section className="pt-32 pb-20 px-6 relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-cyan-400 font-semibold tracking-widest uppercase text-xs mb-6 block">
            E360 • Capital Solutions
          </span>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
            Capital para Escalar <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-400 to-blue-600">
              Tu Visión Comercial.
            </span>
          </h1>
          
          <p className="text-[#A1A7B3] text-lg md:text-xl mb-12 max-w-3xl mx-auto leading-relaxed">
            Sin la burocracia de los bancos tradicionales. Accede a más de 65 prestamistas a nivel nacional para obtener líneas de crédito, préstamos para negocios y financiamiento inmobiliario en tiempo récord.
          </p>

          <button className="bg-gradient-to-r from-cyan-400 to-blue-600 text-black px-8 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-cyan-300 transition-all mx-auto transform hover:scale-105 shadow-[0_0_20px_rgba(0,224,240,0.3)]">
            Evaluar mi Escenario de Fondeo <ArrowRight size={20} />
          </button>
        </motion.div>
      </section>

      {/* Sección de Opciones de Fondeo (Grid Modular) */}
      <section className="py-20 px-6 relative z-10 max-w-6xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Soluciones de Fondeo Globales</h2>
          <p className="text-[#A1A7B3]">Capital estructurado tanto para empresas establecidas en EE. UU. como para expansión internacional.</p>
        </div>

        {/* --- PESTAÑAS (TABS) ACTUALIZADAS PARA QUE SEAN CLICKEABLES --- */}
        <div className="flex justify-center mb-10 gap-4">
          <button 
            onClick={() => setActiveTab("usa")}
            className={`transition-all px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${
              activeTab === "usa" 
              ? "bg-cyan-900/30 border border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(0,224,240,0.2)]" 
              : "bg-[#05101F] border border-gray-800 text-gray-500 hover:text-gray-300"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeTab === "usa" ? "bg-cyan-400 animate-pulse" : "bg-gray-600"}`}></span>
            Programas USA (SSN/EIN)
          </button>

          <button 
            onClick={() => setActiveTab("international")}
            className={`transition-all px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${
              activeTab === "international" 
              ? "bg-blue-900/40 border border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]" 
              : "bg-[#05101F] border border-gray-800 text-gray-500 hover:text-gray-300"
            }`}
          >
            <span>🌍</span>
            Programas Internacionales
          </button>
        </div>

        {/* --- CONTENIDO DINÁMICO MANTENIENDO EL DISEÑO ORIGINAL --- */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {activeTab === "usa" ? (
              <>
                {/* Opción 1: USA (Original) */}
                <div className="bg-[#0A182D] border border-gray-800 rounded-2xl p-6 hover:border-cyan-500/50 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-blue-600/20 text-blue-400 text-[10px] font-bold px-3 py-1 rounded-bl-lg">Nacional USA</div>
                  <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 text-cyan-400 group-hover:scale-110 transition-transform">
                    <Zap size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Préstamos Comerciales</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">Microcréditos y líneas no aseguradas basadas en el EIN/SSN de tu empresa en Estados Unidos.</p>
                </div>

                {/* Opción 2: Real Estate (Original) */}
                <div className="bg-[#0A182D] border border-gray-800 rounded-2xl p-6 hover:border-cyan-500/50 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-3 py-1 rounded-bl-lg">Real Estate</div>
                  <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 text-cyan-400 group-hover:scale-110 transition-transform">
                    <Building2 size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Financiamiento Hipotecario</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">Proyectos Fix & Flip, comercial y residencial para inversores dentro del territorio nacional.</p>
                </div>

                {/* Opción 3: SBA (Original) */}
                <div className="bg-[#0A182D] border border-gray-800 rounded-2xl p-6 hover:border-cyan-500/50 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-green-500/20 text-green-400 text-[10px] font-bold px-3 py-1 rounded-bl-lg">SBA Loans</div>
                  <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 text-cyan-400 group-hover:scale-110 transition-transform">
                    <Landmark size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Préstamos Federales</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">Acceso a programas respaldados por la SBA con tasas preferenciales para dueños de negocios.</p>
                </div>
              </>
            ) : (
              <>
                {/* Opción 1: Internacional */}
                <div className="bg-[#0A182D] border border-gray-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-blue-600/20 text-blue-400 text-[10px] font-bold px-3 py-1 rounded-bl-lg">Internacional</div>
                  <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform">
                    <Globe size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Capital Transfronterizo</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">Líneas de crédito para expansión en Latinoamérica y Europa con estructuras de pago flexibles.</p>
                </div>

                {/* Opción 2: Logística (Original con Icono Vehículo) */}
                <div className="bg-[#0A182D] border border-gray-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-blue-600/20 text-blue-400 text-[10px] font-bold px-3 py-1 rounded-bl-lg">Vehículos</div>
                  <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Leasing Internacional</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">Financiamiento de equipo pesado y flotas para empresas de logística fuera de USA.</p>
                </div>
              </>
            )}

            {/* Opción 4: Tarjetas Corporativas (Mantenemos el diseño grande que te gustó) */}
            <motion.div 
              className="bg-gradient-to-b from-[#0A182D] to-[#05101F] border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-500/50 transition-all group lg:col-span-3 relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none" />
              <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                  <div className="w-16 h-16 bg-[#05101F] border border-cyan-500/50 rounded-xl flex items-center justify-center text-cyan-400 shrink-0">
                    <CreditCard size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      Tarjetas de Crédito Corporativas <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30 uppercase tracking-wider">PG & Non-PG</span>
                    </h3>
                    <p className="text-gray-400 text-sm md:text-base">
                      Programas de crédito rotativo con límite alto. Te ayudamos a estructurar perfiles de crédito empresarial sólidos (Business Credit) para aplicar a tarjetas corporativas.
                    </p>
                  </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Sección Interactiva: Velocidad de Aprobación */}
      {/* ... Se mantiene igual que tu código original ... */}
      <section className="py-20 px-6 relative z-10 w-full bg-[#030812] border-y border-gray-800/50">
          {/* Aquí va el resto de tu código de velocidad de aprobación */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-[#0A182D] to-[#05101F] border border-cyan-500/30 rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="w-full md:w-1/2 relative">
                <div className="absolute -inset-4 bg-cyan-500/10 blur-xl rounded-full"></div>
                <h3 className="text-4xl font-bold text-white mb-4 relative z-10">
                  De la solicitud a la cuenta en <span className="text-cyan-400">24 a 72 hrs</span>
                </h3>
                <p className="text-gray-400 relative z-10 mb-6">
                  Nuestra tecnología agiliza el proceso de validación conectando tu perfil directamente con los fondos.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#05101F] border border-cyan-500/30 text-xs text-cyan-400 relative z-10 shadow-inner">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="font-medium tracking-wide uppercase text-[10px]">Horas laborables (Sáb. y Dom. excluidos)</span>
                </div>
              </div>
              <div className="w-full md:w-1/2 space-y-4 relative z-10">
                <div className="bg-[#05101F] p-4 rounded-xl border border-gray-700 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-300">1. Aplicación Recibida</span>
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">✓</div>
                </div>
                <div className="bg-[#05101F] p-4 rounded-xl border border-gray-700 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-300">2. Match con Prestamistas</span>
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">✓</div>
                </div>
                <div className="bg-cyan-900/20 p-4 rounded-xl border border-cyan-500/40 flex items-center justify-between relative overflow-hidden">
                  <motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent" />
                  <span className="text-sm font-bold text-cyan-400 relative z-10">3. Fondos Depositados</span>
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 relative z-10 animate-pulse"><Zap size={14} /></div>
                </div>
              </div>
            </div>
          </div>
      </section>
    </main>
  );
}