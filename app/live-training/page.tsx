"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, Video, Users, ArrowRight, PlayCircle } from "lucide-react";

export default function LiveTraining() {
  const schedule = [
    { day: "Domingo", time: "10:00 AM EST", topic: "Estrategias de Fondeo y Cierre" },
    { day: "Lunes", time: "07:00 PM EST", topic: "Sistemas de CRM y Automatización" },
    { day: "Martes", time: "07:00 PM EST", topic: "Reparación de Crédito Avanzada" },
    { day: "Miércoles", time: "12:00 PM EST", topic: "Estructura Corporativa y Ventas" },
  ];

  return (
    <main className="min-h-screen bg-[#05101F] text-white flex flex-col relative overflow-hidden">
      
      {/* Fondo con resplandor cian */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-600/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span className="text-cyan-400 font-semibold tracking-widest uppercase text-xs mb-6 block flex items-center justify-center gap-2">
            <Video size={16} /> E360 • Live Academy
          </span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
            Domina el Ecosistema <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-400 to-blue-600">
              En Vivo.
            </span>
          </h1>
          <p className="text-[#A1A7B3] text-lg max-w-2xl mx-auto leading-relaxed">
            Sesiones interactivas semanales para brokers y socios. Aprende a utilizar nuestras herramientas de fondeo, reparación y CRM para escalar tu negocio al máximo nivel.
          </p>
        </motion.div>
      </section>

      {/* Cronograma Semanal */}
      <section className="py-16 px-6 relative z-10 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {schedule.map((item, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-[#0A182D] border border-gray-800 rounded-2xl p-6 hover:border-cyan-500/50 transition-all group"
            >
              <div className="text-cyan-400 mb-4 flex justify-between items-start">
                <Calendar size={24} />
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-tighter">Sesión Semanal</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{item.day}</h3>
              <div className="flex items-center gap-2 text-cyan-400/80 text-sm font-semibold mb-4">
                <Clock size={14} /> {item.time}
              </div>
              <p className="text-gray-400 text-xs leading-relaxed border-t border-gray-800 pt-4">
                {item.topic}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Sección de "Qué esperar" */}
      <section className="py-20 px-6 relative z-10 w-full bg-[#030812] border-y border-gray-800/50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl font-bold">Por qué asistir a los <span className="text-cyan-400">Live Trainings</span></h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="bg-blue-900/30 p-3 rounded-xl text-cyan-400 h-fit"><Users size={24}/></div>
                <div>
                  <h4 className="font-bold text-lg text-white">Q&A en Tiempo Real</h4>
                  <p className="text-sm text-gray-400">Resuelve tus dudas directamente con los expertos de E360 mientras analizamos casos reales.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-blue-900/30 p-3 rounded-xl text-cyan-400 h-fit"><PlayCircle size={24}/></div>
                <div>
                  <h4 className="font-bold text-lg text-white">Acceso a Grabaciones</h4>
                  <p className="text-sm text-gray-400">¿Te perdiste una clase? Todos los socios tienen acceso a la biblioteca de sesiones pasadas en el CRM.</p>
                </div>
              </div>
            </div>
            <button className="bg-gradient-to-r from-cyan-400 to-blue-600 text-black px-8 py-4 rounded-lg font-bold flex items-center gap-2 hover:scale-105 transition-transform">
              Unirse a la Próxima Clase <ArrowRight size={20} />
            </button>
          </div>
          <div className="relative">
             <div className="aspect-video bg-[#0A182D] rounded-2xl border border-gray-700 overflow-hidden relative flex items-center justify-center">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <div className="text-center z-10">
                   <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/40 mx-auto mb-4 animate-pulse">
                      <Video size={32} className="text-cyan-400" />
                   </div>
                   <span className="text-sm font-mono text-gray-400">Próxima transmisión en vivo próximamente...</span>
                </div>
             </div>
          </div>
        </div>
      </section>

    </main>
  );
}