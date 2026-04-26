"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, FileSearch, TrendingUp } from "lucide-react";

export default function CreditRepair() {
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

          <button className="bg-gradient-to-r from-cyan-400 to-blue-600 text-black px-8 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-cyan-300 transition-all mx-auto transform hover:scale-105 shadow-[0_0_20px_rgba(0,224,240,0.3)]">
            Solicitar Auditoría Gratuita <ArrowRight size={20} />
          </button>
        </motion.div>
      </section>

      {/* Sección Interactiva: Cómo Funciona (El Análisis) */}
      <section className="py-20 px-6 relative z-10 max-w-6xl mx-auto w-full">
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

      {/* --- PEGAR DEBAJO DE LA SECCIÓN "EL PROCESO DE RESTAURACIÓN TÉCNICA" --- */}

      {/* Sección de Resultados / Proyección Visual */}
      <section className="py-24 px-6 relative z-10 w-full bg-[#030812] border-y border-gray-800/50">
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

      {/* --- FIN DE LA SECCIÓN DE RESULTADOS --- */}

    </main>
  );
}