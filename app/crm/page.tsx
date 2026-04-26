"use client";

import { motion } from "framer-motion";
import { ArrowRight, Bot, CreditCard, GitMerge, LayoutDashboard, MessageSquare, Workflow, Zap } from "lucide-react";
export default function CRM() {
  return (
    <main className="min-h-screen bg-[#05101F] text-white flex flex-col relative overflow-hidden">
      
      {/* Resplandor de fondo (Cian tecnológico) */}
      <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-cyan-500/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Hero Section - CRM */}
      <section className="pt-32 pb-20 px-6 relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-cyan-400 font-semibold tracking-widest uppercase text-xs mb-6 block flex items-center justify-center gap-2">
            <Bot size={16} /> E360 • AI Powered System
          </span>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
            Tu Agencia en <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-400 to-blue-600">
              Piloto Automático.
            </span>
          </h1>
          
          <p className="text-[#A1A7B3] text-lg md:text-xl mb-12 max-w-3xl mx-auto leading-relaxed">
            Reemplaza docenas de herramientas costosas. Nuestro CRM unifica tus embudos, calendarios, seguimientos e inteligencia artificial en un solo ecosistema diseñado para cerrar más tratos.
          </p>

          <button className="bg-gradient-to-r from-cyan-400 to-blue-600 text-black px-8 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-cyan-300 transition-all mx-auto transform hover:scale-105 shadow-[0_0_20px_rgba(0,224,240,0.3)]">
            Ver Demo del Sistema <ArrowRight size={20} />
          </button>
        </motion.div>
      </section>

      {/* Sección de Características (Bento Box) */}
      <section className="py-20 px-6 relative z-10 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Tarjeta 1: Bandeja Unificada */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-[#0A182D] border border-gray-800 rounded-2xl p-8 hover:border-cyan-500/50 transition-all group"
          >
            <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-6 text-cyan-400 group-hover:scale-110 transition-transform">
              <MessageSquare size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Bandeja Unificada</h3>
            <p className="text-gray-400 text-sm leading-relaxed">SMS, Correos, Instagram, Facebook y Webchat. Responde a todos tus prospectos desde una sola pantalla sin cambiar de aplicación.</p>
          </motion.div>

          {/* Tarjeta 2: Embudos */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} viewport={{ once: true }}
            className="bg-[#0A182D] border border-gray-800 rounded-2xl p-8 hover:border-cyan-500/50 transition-all group"
          >
            <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-6 text-cyan-400 group-hover:scale-110 transition-transform">
              <LayoutDashboard size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Funnels & Websites</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Crea páginas de alta conversión con nuestro constructor drag-and-drop. Integrado directamente con tus calendarios y pagos.</p>
          </motion.div>

          {/* Tarjeta 3: Pipelines */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} viewport={{ once: true }}
            className="bg-[#0A182D] border border-gray-800 rounded-2xl p-8 hover:border-cyan-500/50 transition-all group"
          >
            <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-6 text-cyan-400 group-hover:scale-110 transition-transform">
              <GitMerge size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Gestión de Pipelines</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Visualiza exactamente dónde está el dinero. Mueve a tus prospectos por etapas de fondeo y dispara acciones automáticamente.</p>
          </motion.div>

        </div>
      </section>

      {/* Sección Interactiva: El constructor de Workflows */}
      <section className="py-20 px-6 relative z-10 w-full bg-[#030812] border-y border-gray-800/50 overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          
          {/* Texto Explicativo */}
          <div className="lg:w-1/3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-6">
              <Workflow size={14} /> Workflows Visuales
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-white">
              No trabajes más.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Trabaja más inteligente.</span>
            </h2>
            <p className="text-[#A1A7B3] mb-8 leading-relaxed">
              Diseña lógicas complejas sin escribir una línea de código. Si un lead entra de Facebook, el sistema le envía un SMS en 5 minutos. Si responde, la IA agenda una llamada por ti.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">✓</div>
                Nurturing automático de leads fríos
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">✓</div>
                Recordatorios de citas multi-canal
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">✓</div>
                Asignación inteligente a tu equipo
              </li>
            </ul>
          </div>

          {/* Animación del Workflow Builder */}
          <div className="lg:w-2/3 w-full bg-[#0A182D] rounded-2xl border border-gray-800 p-8 shadow-2xl relative min-h-[400px] flex items-center justify-center font-mono">
            
            {/* Cuadrícula de fondo simulando el lienzo */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <div className="relative z-10 flex flex-col items-center gap-6 w-full">
              
              {/* Nodo 1: Disparador */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                className="bg-[#05101F] border border-cyan-500/50 rounded-lg p-4 w-64 shadow-[0_0_15px_rgba(0,224,240,0.15)] flex items-center gap-4"
              >
                <div className="bg-cyan-900/50 p-2 rounded text-cyan-400"><Zap size={20} /></div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Trigger</div>
                  <div className="text-sm font-bold text-white">Nuevo Lead (Facebook)</div>
                </div>
              </motion.div>

              {/* Línea de conexión animada */}
              <motion.div 
                initial={{ height: 0 }} whileInView={{ height: 24 }} transition={{ delay: 0.3, duration: 0.5 }} viewport={{ once: true }}
                className="w-0.5 bg-cyan-500/50"
              />

              {/* Nodo 2: Condición / Espera */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 }} viewport={{ once: true }}
                className="bg-[#05101F] border border-gray-700 rounded-lg p-4 w-64 flex items-center gap-4"
              >
                <div className="bg-gray-800 p-2 rounded text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Acción</div>
                  <div className="text-sm font-bold text-white">Esperar 5 Minutos</div>
                </div>
              </motion.div>

              {/* Línea de conexión animada 2 */}
              <motion.div 
                initial={{ height: 0 }} whileInView={{ height: 24 }} transition={{ delay: 1.1, duration: 0.5 }} viewport={{ once: true }}
                className="w-0.5 bg-cyan-500/50"
              />

              {/* Rama Divisora */}
              <div className="flex gap-8 relative">
                <motion.div initial={{ width: 0 }} whileInView={{ width: "100%" }} transition={{ delay: 1.6, duration: 0.5 }} viewport={{ once: true }} className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 bg-cyan-500/50" />
                
                {/* Rama Izquierda (SMS) */}
                <div className="flex flex-col items-center pt-6">
                  <motion.div initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 2.1 }} viewport={{ once: true }} className="w-0.5 h-4 bg-cyan-500/50 mb-2" />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: 2.3 }} viewport={{ once: true }}
                    className="bg-[#05101F] border border-blue-500/50 rounded-lg p-4 w-48 text-center"
                  >
                    <div className="text-xs text-gray-400 mb-1">Paso 3A</div>
                    <div className="text-sm font-bold text-blue-400">Enviar SMS</div>
                  </motion.div>
                </div>

                {/* Rama Derecha (Email) */}
                <div className="flex flex-col items-center pt-6">
                  <motion.div initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 2.1 }} viewport={{ once: true }} className="w-0.5 h-4 bg-cyan-500/50 mb-2" />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: 2.3 }} viewport={{ once: true }}
                    className="bg-[#05101F] border border-green-500/50 rounded-lg p-4 w-48 text-center"
                  >
                    <div className="text-xs text-gray-400 mb-1">Paso 3B</div>
                    <div className="text-sm font-bold text-green-400">Email + Bot IA</div>
                  </motion.div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* --- NUEVA SECCIÓN: CENTRO DE REPUTACIÓN Y COMUNICACIÓN --- */}
        <section className="py-24 px-6 relative z-10 max-w-6xl mx-auto w-full border-t border-gray-800/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Mockup de Reputación y Webchat */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="relative order-2 lg:order-1"
            >
              <div className="bg-[#0A182D] rounded-3xl border border-gray-800 p-8 relative overflow-hidden">
                {/* Indicadores de Reseñas */}
                <div className="space-y-4">
                  <div className="bg-[#05101F] p-4 rounded-xl border border-gray-700 flex items-center justify-between group hover:border-cyan-500/50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-xs">G</div>
                      <div>
                        <div className="text-sm font-bold">Google Business Profile</div>
                        <div className="text-[10px] text-gray-500">Solicitud de reseña enviada automáticamente</div>
                      </div>
                    </div>
                    <span className="text-xs text-green-400 font-mono">Enviado</span>
                  </div>
                  
                  {/* Webchat Widget */}
                  <div className="absolute bottom-4 right-4 w-48 bg-[#05101F] border border-cyan-500/30 rounded-2xl p-4 shadow-2xl transform rotate-2 group">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-[10px] font-bold text-white uppercase">Asistente E360</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-gray-800 rounded"></div>
                      <div className="h-2 w-3/4 bg-gray-800 rounded"></div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-800 flex justify-end">
                      <div className="w-6 h-6 rounded-full bg-cyan-400"></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Texto: Autoridad y Omnicanalidad */}
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white leading-tight">
                Domina la Conversación y <br />
                <span className="text-cyan-400">Tu Reputación.</span>
              </h2>
              <p className="text-[#A1A7B3] mb-8 leading-relaxed">
                Nuestra plataforma automatiza la solicitud de reseñas en Google y centraliza todos tus canales. No importa si te escriben por Instagram, Facebook o el chat de tu web; respondes desde un solo lugar para que ningún lead se enfríe.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0A182D] p-4 rounded-xl border border-gray-800">
                  <div className="text-cyan-400 font-bold text-xl mb-1">98%</div>
                  <div className="text-xs text-gray-500 uppercase font-mono">Tasa de Apertura SMS</div>
                </div>
                <div className="bg-[#0A182D] p-4 rounded-xl border border-gray-800">
                  <div className="text-cyan-400 font-bold text-xl mb-1">+40%</div>
                  <div className="text-xs text-gray-500 uppercase font-mono">Reseñas en 30 días</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- NUEVA SECCIÓN: ACADEMIA DIGITAL (LMS) --- */}
        <section className="py-24 px-6 relative z-10 w-full bg-gradient-to-b from-transparent to-[#030812]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Educa y <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Escala tu Conocimiento.</span></h2>
              <p className="text-[#A1A7B3] text-lg max-w-3xl mx-auto">
                No solo gestionas clientes, creas comunidades. El sistema incluye un portal de membresías para alojar tus cursos, entrenamientos y recursos exclusivos bajo tu propia marca.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "Cursos Ilimitados", desc: "Sube módulos de video y material descargable para tus brokers o clientes.", icon: <LayoutDashboard size={20}/> },
                { title: "Pagos Integrados", desc: "Acepta tarjetas de crédito directamente para vender tus consultorías o acceso a la academia.", icon: <CreditCard size={20}/> },
                { title: "Apps Móviles", desc: "Tus alumnos pueden acceder al contenido desde cualquier dispositivo 24/7.", icon: <Bot size={20}/> }
              ].map((item, i) => (
                <motion.div 
                  key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="bg-[#0A182D] border border-gray-800 p-8 rounded-3xl hover:border-blue-500/30 transition-all text-center"
                >
                  <div className="w-12 h-12 bg-blue-900/30 rounded-full flex items-center justify-center text-cyan-400 mx-auto mb-6">
                    {item.icon}
                  </div>
                  <h4 className="text-xl font-bold mb-3">{item.title}</h4>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* --- SECCIÓN DE CIERRE DE SOFTWARE --- */}
        <section className="py-24 px-6 text-center relative z-10 border-t border-gray-800/50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-8">Todas las herramientas que necesitas en <span className="text-cyan-400 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">una sola suscripción.</span></h2>
            <div className="flex flex-wrap justify-center gap-4 text-xs font-mono text-gray-500 mb-12">
              <span className="px-3 py-1 border border-gray-800 rounded-full">Email Marketing</span>
              <span className="px-3 py-1 border border-gray-800 rounded-full">Funnel Builder</span>
              <span className="px-3 py-1 border border-gray-800 rounded-full">Call Tracking</span>
              <span className="px-3 py-1 border border-gray-800 rounded-full">Social Planner</span>
              <span className="px-3 py-1 border border-gray-800 rounded-full">AI Content</span>
              <span className="px-3 py-1 border border-gray-800 rounded-full">Invoicing</span>
            </div>
          </div>
        </section>

        {/* --- NUEVA SECCIÓN: CENTRO DE REPUTACIÓN Y COMUNICACIÓN --- */}
        <section className="py-24 px-6 relative z-10 max-w-6xl mx-auto w-full border-t border-gray-800/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Mockup de Reputación y Webchat */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="relative order-2 lg:order-1"
            >
              <div className="bg-[#0A182D] rounded-3xl border border-gray-800 p-8 relative overflow-hidden">
                {/* Indicadores de Reseñas */}
                <div className="space-y-4">
                  <div className="bg-[#05101F] p-4 rounded-xl border border-gray-700 flex items-center justify-between group hover:border-cyan-500/50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-xs">G</div>
                      <div>
                        <div className="text-sm font-bold">Google Business Profile</div>
                        <div className="text-[10px] text-gray-500">Solicitud de reseña enviada automáticamente</div>
                      </div>
                    </div>
                    <span className="text-xs text-green-400 font-mono">Enviado</span>
                  </div>
                  
                  {/* Webchat Widget */}
                  <div className="absolute bottom-4 right-4 w-48 bg-[#05101F] border border-cyan-500/30 rounded-2xl p-4 shadow-2xl transform rotate-2 group">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-[10px] font-bold text-white uppercase">Asistente E360</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-gray-800 rounded"></div>
                      <div className="h-2 w-3/4 bg-gray-800 rounded"></div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-800 flex justify-end">
                      <div className="w-6 h-6 rounded-full bg-cyan-400"></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Texto: Autoridad y Omnicanalidad */}
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white leading-tight">
                Domina la Conversación y <br />
                <span className="text-cyan-400">Tu Reputación.</span>
              </h2>
              <p className="text-[#A1A7B3] mb-8 leading-relaxed">
                Nuestra plataforma automatiza la solicitud de reseñas en Google y centraliza todos tus canales. No importa si te escriben por Instagram, Facebook o el chat de tu web; respondes desde un solo lugar para que ningún lead se enfríe.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0A182D] p-4 rounded-xl border border-gray-800">
                  <div className="text-cyan-400 font-bold text-xl mb-1">98%</div>
                  <div className="text-xs text-gray-500 uppercase font-mono">Tasa de Apertura SMS</div>
                </div>
                <div className="bg-[#0A182D] p-4 rounded-xl border border-gray-800">
                  <div className="text-cyan-400 font-bold text-xl mb-1">+40%</div>
                  <div className="text-xs text-gray-500 uppercase font-mono">Reseñas en 30 días</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- NUEVA SECCIÓN: ACADEMIA DIGITAL (LMS) --- */}
        <section className="py-24 px-6 relative z-10 w-full bg-gradient-to-b from-transparent to-[#030812]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Educa y <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Escala tu Conocimiento.</span></h2>
              <p className="text-[#A1A7B3] text-lg max-w-3xl mx-auto">
                No solo gestionas clientes, creas comunidades. El sistema incluye un portal de membresías para alojar tus cursos, entrenamientos y recursos exclusivos bajo tu propia marca.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "Cursos Ilimitados", desc: "Sube módulos de video y material descargable para tus brokers o clientes.", icon: <LayoutDashboard size={20}/> },
                { title: "Pagos Integrados", desc: "Acepta tarjetas de crédito directamente para vender tus consultorías o acceso a la academia.", icon: <CreditCard size={20}/> },
                { title: "Apps Móviles", desc: "Tus alumnos pueden acceder al contenido desde cualquier dispositivo 24/7.", icon: <Bot size={20}/> }
              ].map((item, i) => (
                <motion.div 
                  key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="bg-[#0A182D] border border-gray-800 p-8 rounded-3xl hover:border-blue-500/30 transition-all text-center"
                >
                  <div className="w-12 h-12 bg-blue-900/30 rounded-full flex items-center justify-center text-cyan-400 mx-auto mb-6">
                    {item.icon}
                  </div>
                  <h4 className="text-xl font-bold mb-3">{item.title}</h4>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* --- SECCIÓN DE CIERRE DE SOFTWARE (Actualizada) --- */}
        <section className="py-24 px-6 text-center relative z-10 border-t border-gray-800/50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-8">Todas las herramientas que necesitas en <span className="text-cyan-400 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">una sola suscripción.</span></h2>
            <div className="flex flex-wrap justify-center gap-4 text-xs font-mono text-gray-500 mb-12">
              <span className="px-3 py-1 border border-gray-800 rounded-full">Email Marketing</span>
              <span className="px-3 py-1 border border-gray-800 rounded-full">Funnel Builder</span>
              <span className="px-3 py-1 border border-gray-800 rounded-full">Call Tracking</span>
              <span className="px-3 py-1 border border-gray-800 rounded-full">Social Planner</span>
              <span className="px-3 py-1 border border-gray-800 rounded-full">AI Content</span>
              <span className="px-3 py-1 border border-gray-800 rounded-full">Invoicing</span>
            </div>
            {/* Botón actualizado sin prueba gratuita */}
            <button className="bg-gradient-to-r from-cyan-400 to-blue-600 text-black px-10 py-5 rounded-full font-bold text-lg hover:from-cyan-300 hover:to-blue-500 transition-all transform hover:scale-[1.02] shadow-[0_0_30px_rgba(0,224,240,0.2)]">
              Solicitar Acceso al Sistema
            </button>
          </div>
        </section>

    </main>
  );
}