"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const syllabus = [
  {
    week: "Semana 1",
    title: "Fundamentos y Estructura Corporativa",
    desc: "Cómo blindar un negocio antes de pedir dinero. Incorporación de LLCs, obtención de EIN, cuentas bancarias comerciales y perfiles en Dun & Bradstreet."
  },
  {
    week: "Semana 2",
    title: "Dominio de Restauración de Crédito",
    desc: "Leyes FCRA y FDCPA. Técnicas avanzadas de disputa con burós de crédito para eliminar colecciones, pagos tardíos y bancarrotas."
  },
  {
    week: "Semana 3",
    title: "Fondeo Comercial y Personal",
    desc: "Estructuración de expedientes para aprobación garantizada. Cómo acceder a líneas de crédito de alto límite y préstamos a término sin colateral."
  },
  {
    week: "Semana 4",
    title: "Sistemas, CRM y Escala de Agencia",
    desc: "Automatización total. Implementación de GoHighLevel, embudos de venta, automatización de citas y cómo cobrar a tus clientes como un verdadero Broker."
  }
];

export default function WeeklySyllabus() {
  const [activeWeek, setActiveWeek] = useState<number | null>(0); // La primera semana empieza abierta

  return (
    <section id="syllabus" className="py-32 px-6 relative z-10 w-full bg-[#030812]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Hoja de Ruta del <span className="text-cyan-400">Programa</span></h2>
          <p className="text-gray-400 text-lg">Un proceso intensivo de 4 semanas para transformar tu negocio.</p>
        </div>

        <div className="space-y-4">
          {syllabus.map((item, index) => {
            const isActive = activeWeek === index;
            return (
              <div 
                key={index} 
                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isActive ? 'border-cyan-500/50 bg-[#0A182D]' : 'border-gray-800 bg-[#05101F] hover:border-gray-600'}`}
              >
                <button 
                  className="w-full px-8 py-6 flex items-center justify-between text-left focus:outline-none"
                  onClick={() => setActiveWeek(isActive ? null : index)}
                >
                  <div className="flex items-center gap-6">
                    <span className={`text-sm font-bold uppercase tracking-widest ${isActive ? 'text-cyan-400' : 'text-gray-500'}`}>
                      {item.week}
                    </span>
                    <h3 className={`text-xl md:text-2xl font-semibold ${isActive ? 'text-white' : 'text-gray-300'}`}>
                      {item.title}
                    </h3>
                  </div>
                  <motion.div 
                    animate={{ rotate: isActive ? 180 : 0 }} 
                    transition={{ duration: 0.3 }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-800 text-gray-400'}`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </motion.div>
                </button>
                
                <motion.div 
                  initial={false}
                  animate={{ height: isActive ? "auto" : 0, opacity: isActive ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-8 pb-6 pt-2 ml-20 text-gray-400 text-lg leading-relaxed border-t border-gray-800/50 mt-2">
                    {item.desc}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
