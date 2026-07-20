"use client";

import { motion } from "framer-motion";
import { 
  ArrowRight, 
  ShieldCheck, 
  FileSearch, 
  TrendingUp, 
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Clock,
  Zap,
  Info
} from "lucide-react";

// Estructura de niveles de precios extraída de las guías de precios de E360
const pricingLevels = [
  {
    level: "Nivel 1",
    name: "Corrección Simple",
    desc: "Para clientes con problemas menores y fáciles de resolver en su historial de crédito.",
    setupFee: "$250",
    monthlyFee: "$50/mes",
    duration: "6 meses",
    totalEst: "~$550",
    features: [
      "Corrección de información personal (nombre, dirección, SSN)",
      "Eliminación de inquiries (consultas) no autorizados o en exceso",
      "Actualización de cuentas con saldos/datos desactualizados",
      "Corrección de pequeños errores que dañan el score innecesariamente"
    ],
    idealFor: "Clientes con puntaje moderado que necesitan una limpieza rápida para calificar a créditos básicos.",
    borderClass: "border-gray-800",
    badge: null
  },
  {
    level: "Nivel 2",
    name: "Trabajo Moderado",
    desc: "Para clientes con varias cuentas negativas y colecciones que requieren atención.",
    setupFee: "$500",
    monthlyFee: "$50/mes",
    duration: "8 meses",
    totalEst: "~$900",
    features: [
      "Disputas de cuentas derogatorias (pagos tardíos, charge-offs)",
      "Eliminación de inquiries no autorizados en los tres burós",
      "Negociación y disputa formal de cuentas en colecciones",
      "Corrección de saldos y límites de crédito reportados incorrectamente"
    ],
    idealFor: "Clientes con múltiples factores negativos que necesitan un saneamiento completo de su historial en 8 meses.",
    borderClass: "border-cyan-500/40 bg-gradient-to-b from-[#0A182D] to-[#05101F]/80",
    badge: "Más Solicitado"
  },
  {
    level: "Nivel 3",
    name: "Caso Complejo",
    desc: "Para clientes con daño crediticio severo que requieren reconstrucción integral.",
    setupFee: "$1,000 - $2,000",
    monthlyFee: "$50/mes",
    duration: "12 meses",
    totalEst: "~$1,600 - $2,600",
    features: [
      "Disputa de múltiples colecciones con diversas agencias de cobro",
      "Corrección por robo de identidad y cuentas fraudulentas",
      "Disputas por quiebras (bankruptcies), repossessions y embargos",
      "Reconstrucción total de historial crediticio dañado por 12 meses"
    ],
    idealFor: "Clientes con daños severos o historial en quiebra que requieren acompañamiento jurídico-técnico completo.",
    borderClass: "border-purple-500/30",
    badge: "Premium"
  }
];

export default function CreditRepairClient() {
  return (
    <main className="min-h-screen bg-[#05101F] text-white flex flex-col relative overflow-hidden">
      
      {/* Resplandor de fondo (Azul profundo / Cian) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Hero Section - Reparación de Crédito */}
      <section className="pt-32 pb-20 px-6 relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-cyan-400 font-semibold tracking-widest uppercase text-xs mb-6 block">
            E360 • Credit Restoration
          </span>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
            Restaura tu Crédito.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-400 to-blue-600">
              Recupera tu Libertad.
            </span>
          </h1>
          
          <p className="text-[#A1A7B3] text-lg md:text-xl mb-12 max-w-3xl mx-auto leading-relaxed">
            Nuestro equipo de especialistas realiza un análisis profundo de los tres burós principales, utilizando estrategias basadas en la FCRA para disputar y eliminar errores, colecciones e inconsistencias de tu historial.
          </p>

          <a 
            href="#pricing-section"
            className="bg-gradient-to-r from-cyan-400 to-blue-600 text-black px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all mx-auto transform hover:scale-105 shadow-[0_0_20px_rgba(0,224,240,0.3)]"
          >
            Ver Planes de Reparación <ArrowRight size={20} />
          </a>
        </motion.div>
      </section>

      {/* Sección Interactiva: Cómo Funciona (El Análisis) */}
      <section className="py-12 px-6 relative z-10 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          {/* Columna Izquierda: Texto y Pasos */}
          <div>
            <h2 className="text-3xl font-bold mb-6">El Proceso de <span className="text-cyan-400">Restauración Técnica</span></h2>
            <p className="text-[#A1A7B3] mb-8">No enviamos disputas genéricas. Estructuramos cada caso bajo el marco legal para forzar la actualización de tus datos.</p>
            
            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex gap-4">
                <div className="mt-1 bg-blue-900/50 p-2 rounded-lg text-cyan-400 h-fit border border-cyan-500/20"><FileSearch size={24}/></div>
                <div>
                  <h4 className="font-bold text-lg">1. Auditoría de 3 Burós</h4>
                  <p className="text-sm text-gray-400">Identificamos discrepancias y elementos negativos inexactos cruzando los datos de Experian, Equifax y TransUnion.</p>
                </div>
              </motion.div>
              
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="flex gap-4">
                <div className="mt-1 bg-blue-900/50 p-2 rounded-lg text-cyan-400 h-fit border border-cyan-500/20"><ShieldCheck size={24}/></div>
                <div>
                  <h4 className="font-bold text-lg">2. Disputas Factuales (FCRA/FDCPA)</h4>
                  <p className="text-sm text-gray-400">Desarrollamos estrategias legales como "pay-for-delete" y limpieza de identidad para proteger tus derechos.</p>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="flex gap-4">
                <div className="mt-1 bg-blue-900/50 p-2 rounded-lg text-cyan-400 h-fit border border-cyan-500/20"><TrendingUp size={24}/></div>
                <div>
                  <h4 className="font-bold text-lg">3. Monitoreo y Actualización</h4>
                  <p className="text-sm text-gray-400">Seguimiento continuo de tu archivo con actualizaciones constantes sobre el estado de la reparación.</p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Columna Derecha: Mockup Interactivo del Reporte */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-[#0A182D] border border-gray-700 rounded-xl p-6 shadow-2xl relative"
          >
            {/* Cabecera del "Software" */}
            <div className="border-b border-gray-700 pb-4 mb-4 flex justify-between items-center">
              <span className="font-mono text-xs text-gray-400">Análisis de Discrepancias</span>
              <span className="text-xs font-bold px-2 py-1 bg-red-500/20 text-red-400 rounded-full border border-red-500/30">3 Errores Detectados</span>
            </div>

            {/* Simulación de Reporte */}
            <div className="space-y-4 font-mono text-sm">
              <div className="bg-[#05101F] p-3 rounded border border-red-900/50 relative overflow-hidden group">
                <div className="absolute inset-y-0 left-0 w-1 bg-red-500"></div>
                <div className="flex justify-between text-gray-300"><span>Colección Médica</span> <span className="text-red-400">En Disputa</span></div>
                <div className="text-xs text-gray-500 mt-1">Inconsistencia en fecha de reporte detectada (Buró: Experian).</div>
              </div>

              <div className="bg-[#05101F] p-3 rounded border border-gray-800 relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-1 bg-green-500"></div>
                <div className="flex justify-between text-gray-300"><span>Tarjeta de Crédito</span> <span className="text-green-400">Actualizado</span></div>
                <div className="text-xs text-gray-500 mt-1">Historial de pagos corregido exitosamente.</div>
              </div>

              <div className="bg-[#05101F] p-3 rounded border border-yellow-900/50 relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-1 bg-yellow-500"></div>
                <div className="flex justify-between text-gray-300"><span>Identidad Cruzada</span> <span className="text-yellow-400">Procesando</span></div>
                <div className="text-xs text-gray-500 mt-1">Limpieza de direcciones antiguas en progreso.</div>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Sección de Resultados / Proyección Visual */}
      <section className="py-20 px-6 relative z-10 w-full bg-[#030812] border-t border-gray-800/50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          
          {/* Gráfico Dinámico Mejorado */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="bg-[#0A182D] rounded-3xl border border-gray-800 p-10 shadow-2xl relative overflow-hidden"
          >
            <div className="flex justify-between items-end mb-12">
              <div>
                <span className="text-gray-500 text-xs font-mono block mb-2 uppercase tracking-tighter">Proyección Trimestral</span>
                <h3 className="text-4xl font-bold text-white flex items-center gap-3">
                  799 <span className="text-sm font-semibold text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">+120 pts</span>
                </h3>
              </div>
            </div>

            {/* Gráfico con Eje Y y Gradiente */}
            <div className="flex h-72 w-full gap-4">
              {/* Eje Y */}
              <div className="flex flex-col justify-between text-[10px] font-mono text-gray-500 pb-8 pt-2">
                <span>800</span>
                <span>700</span>
                <span>600</span>
                <span>500</span>
                <span>400</span>
              </div>

              {/* Contenedor de Barras */}
              <div className="relative flex-1 border-b border-l border-gray-800 flex items-end justify-between px-2 pb-2">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="border-b border-gray-600 w-full h-1/4"></div>
                  ))}
                </div>

                {[
                  { month: "Mes 1", score: 520 },
                  { month: "Mes 2", score: 580 },
                  { month: "Mes 3", score: 630 },
                  { month: "Mes 4", score: 690 },
                  { month: "Mes 5", score: 740 },
                  { month: "Mes 6", score: 785 },
                ].map((data, i) => {
                  const heightPercent = ((data.score - 400) / (800 - 400)) * 100;
                  return (
                    <div key={i} className="relative flex flex-col items-center justify-end h-full w-full group">
                      <motion.div 
                        initial={{ height: "0%" }}
                        whileInView={{ height: `${heightPercent}%` }}
                        transition={{ duration: 1.5, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
                        viewport={{ once: true }}
                        className="w-4 md:w-8 rounded-t-md bg-gradient-to-t from-red-600 via-blue-600 to-cyan-400 shadow-[0_0_20px_rgba(0,224,240,0.2)] relative z-10 cursor-help"
                      />
                      <span className="text-[9px] text-gray-600 mt-4 font-mono absolute -bottom-8 whitespace-nowrap">
                        {data.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Texto Explicativo */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold mb-8 text-white">El Impacto de un <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Perfil Limpio</span></h2>
            <p className="text-[#A1A7B3] mb-10 leading-relaxed text-lg font-light">
              Eliminar marcas negativas no solo mejora un número en una pantalla; transforma tu poder adquisitivo. Cada elemento disputado con éxito disminuye tu perfil de riesgo ante los prestamistas.
            </p>
            
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                "Aprobaciones Comerciales",
                "Hipotecas con Bajas Tasas",
                "Financiamiento de Autos",
                "Poder de Negociación"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 bg-[#0A182D] p-4 rounded-xl border border-gray-800/50">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                  <span className="text-gray-300 text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* --- PRICING SECTION (NIVELES Y PRECIOS OFICIALES) --- */}
      <section id="pricing-section" className="py-24 px-6 relative z-10 w-full bg-[#05101F] border-t border-gray-800/50">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center mb-20">
            <span className="text-cyan-400 font-semibold tracking-widest uppercase text-xs mb-3 block">Precios y Programas</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              Estructura de Cobros <br className="sm:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Transparente.</span>
            </h2>
            <p className="text-gray-400 text-sm mt-4 max-w-xl mx-auto font-light leading-relaxed">
              El costo del servicio depende de la complejidad de tu caso. Realizamos una auditoría inicial para recomendarte el plan adecuado.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {pricingLevels.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className={`border rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden h-full ${plan.borderClass} ${
                  plan.badge ? "shadow-[0_0_40px_rgba(0,224,240,0.08)] bg-[#0A182D]/70" : "bg-[#0A182D]/40"
                }`}
              >
                {/* Badge de Plan */}
                {plan.badge && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-cyan-400 to-blue-600 text-black text-[9px] font-extrabold px-4 py-1.5 rounded-bl-xl uppercase tracking-widest">
                    {plan.badge}
                  </div>
                )}

                {/* Encabezado */}
                <div>
                  <span className="text-cyan-400 font-semibold text-xs uppercase tracking-widest block mb-2">{plan.level}</span>
                  <h3 className="text-2xl font-bold text-white mb-3">{plan.name}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-6">{plan.desc}</p>
                  
                  {/* Precios */}
                  <div className="py-6 border-y border-gray-800/80 mb-6 flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-white">{plan.setupFee}</span>
                    <span className="text-gray-500 text-xs font-semibold uppercase font-mono">/ de inicio</span>
                    <span className="text-cyan-400 text-sm font-bold ml-1 font-mono">{plan.monthlyFee}</span>
                  </div>

                  {/* Duración y Total */}
                  <div className="grid grid-cols-2 gap-4 bg-black/30 p-3.5 rounded-xl border border-gray-900 mb-8 text-center">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold block mb-1">Duración</span>
                      <span className="text-xs font-semibold text-gray-300 flex items-center justify-center gap-1">
                        <Clock size={12} className="text-cyan-400" /> {plan.duration}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold block mb-1">Inversión Est.</span>
                      <span className="text-xs font-bold text-cyan-400">{plan.totalEst}</span>
                    </div>
                  </div>

                  {/* Coberturas */}
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-4">¿Qué Incluye?</h4>
                  <ul className="space-y-3.5 mb-8">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex gap-2.5 text-xs text-gray-400 leading-relaxed">
                        <CheckCircle2 size={14} className="text-cyan-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer del Plan */}
                <div>
                  <p className="text-[10px] text-gray-500 leading-relaxed italic border-t border-gray-800/80 pt-4 mb-6">
                    💡 **Ideal para:** {plan.idealFor}
                  </p>
                  
                  <button className="w-full bg-gradient-to-r from-cyan-400 to-blue-600 text-black py-4.5 rounded-xl font-bold text-xs tracking-wider uppercase hover:opacity-90 active:scale-[0.98] transition-all transform flex items-center justify-center gap-2 cursor-pointer">
                    Iniciar este Plan <ArrowRight size={14} />
                  </button>
                </div>

              </motion.div>
            ))}
          </div>

          <div className="mt-16 bg-[#0A182D]/40 border border-gray-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-blue-900/10 rounded-xl text-cyan-400 border border-cyan-500/10 shrink-0 mt-1">
                <Info size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">¿No estás seguro de qué nivel necesitas?</h4>
                <p className="text-xs text-gray-400 leading-relaxed max-w-xl">
                  Agenda una consulta de auditoría inicial de crédito. Evaluaremos tu reporte completo de los 3 burós y determinaremos tu nivel exacto de complejidad antes de cualquier cobro.
                </p>
              </div>
            </div>
            <button className="bg-transparent hover:bg-white/5 border border-gray-600 hover:border-white text-white px-6 py-3.5 rounded-xl text-xs font-bold uppercase transition-all tracking-wider shrink-0 cursor-pointer">
              Agendar Auditoría Gratis
            </button>
          </div>

        </div>
      </section>

    </main>
  );
}
