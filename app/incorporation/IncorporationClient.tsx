"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Briefcase, 
  FileText, 
  Globe, 
  Key, 
  ShieldCheck, 
  Calculator, 
  Info, 
  Coins, 
  Clock 
} from "lucide-react";

// Estructura de tarifas oficiales por estado según las guías
const stateFeesData = [
  { state: "Florida", fee: 125, desc: "Aprobación rápida. Ideal para comercio general." },
  { state: "Texas", fee: 300, desc: "Excelente ecosistema para tecnología y construcción." },
  { state: "New York", fee: 200, desc: "Requerido para operaciones locales del noreste." },
  { state: "California", fee: 70, desc: "Bajo costo de registro inicial estatal." },
  { state: "Wyoming", fee: 100, desc: "Máxima privacidad para dueños y cero impuestos estatales de renta." },
  { state: "Delaware", fee: 90, desc: "La estructura predilecta por inversionistas corporativos." },
];

export default function IncorporationClient() {
  const [selectedStateIndex, setSelectedStateIndex] = useState<number>(0);
  const baseFee = 350;
  
  const selectedState = stateFeesData[selectedStateIndex];
  const totalCost = baseFee + selectedState.fee;

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

          <a 
            href="#calculator-section"
            className="bg-gradient-to-r from-cyan-400 to-blue-600 text-black px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all mx-auto transform hover:scale-105 shadow-[0_0_20px_rgba(0,224,240,0.3)]"
          >
            Calcular Costo de Registro <ArrowRight size={20} />
          </a>
        </motion.div>
      </section>

      {/* Grid de Servicios de Incorporación */}
      <section className="py-12 px-6 relative z-10 max-w-6xl mx-auto w-full">
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

      {/* --- INTERACTIVE STATE FEE & COST CALCULATOR --- */}
      <section id="calculator-section" className="py-24 px-6 relative z-10 w-full bg-[#030812] border-t border-gray-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-cyan-400 font-semibold tracking-widest uppercase text-xs mb-3 block">Simulador Financiero</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              Calculadora de Costos <br className="sm:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">por Estado.</span>
            </h2>
            <p className="text-gray-400 text-sm mt-4 max-w-xl mx-auto font-light leading-relaxed">
              Las tarifas gubernamentales varían por estado. Elige tu estado de registro abajo para conocer el desglose exacto de tu inversión.
            </p>
          </div>

          <div className="bg-[#0A182D] border border-gray-800 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col lg:flex-row gap-10 items-stretch relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-cyan-500/10 blur-2xl rounded-full" />

            {/* Configuración / Inputs */}
            <div className="w-full lg:w-1/2 flex flex-col justify-between space-y-8 relative z-10">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Calculator size={14} className="text-cyan-400" /> Selecciona el Estado de Registro
                </label>
                <div className="relative">
                  <select 
                    value={selectedStateIndex}
                    onChange={(e) => setSelectedStateIndex(Number(e.target.value))}
                    className="w-full bg-[#05101F] border border-gray-800 rounded-xl py-4 px-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
                  >
                    {stateFeesData.map((item, index) => (
                      <option key={item.state} value={index}>
                        {item.state} (Tarifa: ${item.fee})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
                </div>
                <p className="text-xs text-cyan-400/80 italic mt-3.5 leading-relaxed">
                  💡 {selectedState.desc}
                </p>
              </div>

              {/* Qué incluye */}
              <div className="bg-[#05101F]/80 p-5 rounded-2xl border border-gray-800/80">
                <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-3.5 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-cyan-400" /> Beneficios Incluidos:
                </h4>
                <ul className="space-y-2.5 text-xs text-gray-400">
                  <li className="flex items-center gap-2">✓ Artículos de Formación Certificados</li>
                  <li className="flex items-center gap-2">✓ Trámite de EIN con el IRS (Tax ID)</li>
                  <li className="flex items-center gap-2">✓ Acuerdo Operativo (Operating Agreement)</li>
                  <li className="flex items-center gap-2">✓ Radicación Estatal Oficial</li>
                  <li className="flex items-center gap-2">✓ Entrega de documentos en 24-72h</li>
                </ul>
              </div>
            </div>

            {/* Desglose de Inversión */}
            <div className="w-full lg:w-1/2 bg-[#05101F] border border-gray-800 rounded-2xl p-6 md:p-8 flex flex-col justify-between relative z-10">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Desglose de Costos</h4>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm border-b border-gray-800/60 pb-3">
                    <span className="text-gray-500">Honorarios E360</span>
                    <span className="text-white font-semibold">${baseFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-gray-800/60 pb-3">
                    <span className="text-gray-500">Tarifa Estatal ({selectedState.state})</span>
                    <span className="text-white font-semibold">${selectedState.fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pb-3">
                    <span className="text-cyan-400 font-medium flex items-center gap-1"><Clock size={14} /> Tiempo de Entrega</span>
                    <span className="text-gray-300">24 a 72 hrs hábiles</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-800">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">Inversión Total</span>
                  <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-400">
                    ${totalCost.toFixed(2)}
                  </span>
                </div>

                <button className="w-full bg-gradient-to-r from-cyan-400 to-blue-600 text-black py-4 rounded-xl font-bold text-sm tracking-wide uppercase hover:opacity-90 transition-opacity active:scale-[0.98] transform flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,224,240,0.15)] cursor-pointer">
                  Iniciar Registro de {selectedState.state} <ArrowRight size={16} />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

    </main>
  );
}
