"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    // Fondo Azul Marino Profundo Premium (#05101F)
    <main className="min-h-screen bg-[#05101F] text-white flex flex-col items-center justify-center relative overflow-hidden">
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#00E0F0] opacity-[0.05] blur-[100px] rounded-full pointer-events-none" />

      {/* Aumentamos pt-32 a pt-52 para separar más del Navbar */}
      <div className="z-10 text-center px-6 max-w-5xl pt-52 pb-32">
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Más margen inferior mb-8 */}
          <span className="text-cyan-400 font-semibold tracking-[0.3em] uppercase text-xs mb-8 block">
            House of Entrepreneurship
          </span>
          
          {/* Titular con mb-12 para mayor separación */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-12 leading-tight">
            El Ecosistema Definitivo para <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-400 to-blue-600">
              Corredores de Préstamos
            </span>
            <span className="text-cyan-400 text-6xl md:text-8xl relative -top-3">°</span>
          </h1>
          
          {/* Subtítulo con mb-16 y mayor interlineado */}
          <p className="text-[#A1A7B3] text-lg md:text-xl mb-16 max-w-3xl mx-auto leading-relaxed font-light">
            Infraestructura, fondeo y tecnología de primer nivel. Únete a la <br className="hidden md:block" />
            red nacional y escala tu negocio financiero con nuestras <br className="hidden md:block" />
            asociaciones bancarias y CRM automatizado.
          </p>

          {/* Botones con gap-8 para que no estén pegados */}
          <div className="flex flex-col sm:row items-center justify-center gap-8">
            <button className="bg-gradient-to-r from-cyan-400 to-blue-600 text-black px-10 py-5 rounded-xl font-bold flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-[0_20px_40px_rgba(0,224,240,0.2)]">
              Acceder al Ecosistema <ArrowRight size={20} />
            </button>
            <button className="px-10 py-5 rounded-xl font-medium border border-gray-800 text-gray-400 hover:bg-gray-800/50 hover:text-white transition-all">
              Ver Opciones de Fondeo
            </button>
          </div>
        </motion.div>
        
      </div>
      {/* --- PEGAR ESTO DEBAJO DEL HERO SECTION --- */}
        
        {/* Sección del Proceso (Bento Box) */}
        <div className="w-full max-w-6xl mx-auto mt-40 px-6 pb-32 z-10 relative">
          
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Infraestructura que <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Trabaja por Ti</span>
            </h2>
            <p className="text-[#A1A7B3] text-lg max-w-2xl mx-auto">
              Deja de perseguir clientes. Nuestro ecosistema te da las herramientas, las asociaciones bancarias y el software para automatizar tu éxito.
            </p>
          </div>

          {/* Grid de Bento Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Tarjeta 1: Asociaciones */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-[#0A182D] border border-gray-800 rounded-2xl p-8 hover:border-cyan-500/50 transition-colors group relative overflow-hidden"
            >
              <div className="w-12 h-12 bg-[#05101F] rounded-lg border border-gray-700 flex items-center justify-center mb-6 text-cyan-400 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Asóciate con +800 Bancos</h3>
              <p className="text-[#A1A7B3] text-sm leading-relaxed">
                Acceso directo a instituciones financieras líderes a nivel nacional. Oportunidades exclusivas y comisiones competitivas del 3% al 8%.
              </p>
            </motion.div>

            {/* Tarjeta 2: CRM (Destacada) */}
            {/* --- REEMPLAZAR LA TARJETA 2 CON ESTO --- */}

            {/* Tarjeta 2: CRM Potenciado por IA (Destacada con Mockup) */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gradient-to-b from-[#0A182D] to-[#05101F] border border-cyan-500/30 rounded-2xl p-0 md:col-span-2 relative overflow-hidden group flex flex-col md:flex-row items-center gap-0"
            >
              {/* Brillo interno de fondo */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
              
              {/* Sección de Texto (Izquierda) - Ocupa la mitad en escritorio */}
              <div className="flex flex-col p-8 md:p-10 relative z-10 w-full md:w-1/2 justify-center h-full">
                <div className="w-12 h-12 bg-[#05101F] rounded-lg border border-cyan-500/30 flex items-center justify-center mb-6 text-cyan-400 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">CRM Potenciado por IA</h3>
                <p className="text-[#A1A7B3] text-sm leading-relaxed mb-6">
                  Tu negocio en piloto automático. Embudos de alta conversión, automatización de marketing y seguimiento de prospectos integrado en una sola plataforma de grado corporativo.
                </p>
                <div className="flex gap-2">
                  <span className="text-xs font-semibold bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/20">Embudos</span>
                  <span className="text-xs font-semibold bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">Automatización</span>
                </div>
              </div>

              {/* Sección del Mockup Estilizado (Derecha) - Construido con Tailwind */}
              <div className="w-full md:w-1/2 p-4 md:p-6 md:pl-0 h-full flex items-center">
                <motion.div 
                  className="relative w-full aspect-[4/3] bg-[#05101F] rounded-xl border border-gray-700 overflow-hidden shadow-inner group-hover:border-cyan-500/30 transition-colors"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true, margin: "-100px" }}
                >
                  {/* Barra de título del mockup (Estilo Ventana) */}
                  <div className="h-7 border-b border-gray-800 bg-[#0A182D] flex items-center px-3 gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500/80"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500/80"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500/80"></div>
                    <div className="text-[10px] text-gray-600 font-mono ml-2">crm.emprende360.biz/pipeline</div>
                  </div>

                  {/* Contenido del Mockup - Panel de Control */}
                  <div className="p-3 grid grid-cols-2 gap-2 h-full">
                    
                    {/* Gráfico simplificado */}
                    <div className="col-span-2 bg-[#0A182D] rounded-lg border border-gray-800 h-20 p-2 flex flex-col justify-between">
                      <span className="text-[9px] text-gray-600 font-mono">Volumen de Fondeo Semanal</span>
                      <div className="flex items-end gap-1 h-12">
                        {[40, 60, 80, 50, 90, 70].map((height, i) => (
                          <motion.div 
                            key={i}
                            className="w-full rounded bg-gradient-to-t from-cyan-600/30 to-cyan-400/80" 
                            style={{ height: `${height}%` }}
                            initial={{ scaleY: 0 }}
                            whileInView={{ scaleY: 1 }}
                            transition={{ duration: 0.5, delay: 0.6 + i*0.05 }}
                            viewport={{ once: true }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Leads Recientes */}
                    <div className="bg-[#0A182D] rounded-lg border border-gray-800 h-24 p-2">
                      <span className="text-[9px] text-gray-600 font-mono block mb-2">Nuevos Prospectos</span>
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-2 mb-1.5 border-b border-gray-800 pb-1.5 last:border-b-0 last:mb-0">
                          <div className="w-5 h-5 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-[9px] text-gray-500">{String.fromCharCode(65+i)}</div>
                          <div className="flex-1 space-y-1">
                            <div className="w-16 h-1.5 rounded bg-gray-700"></div>
                            <div className="w-10 h-1 rounded bg-gray-800"></div>
                          </div>
                          <div className={`w-1.5 h-1.5 rounded-full ${i===0 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        </div>
                      ))}
                    </div>

                    {/* Flujo de Automatización */}
                    <div className="bg-[#0A182D] rounded-lg border border-gray-800 h-24 p-2 relative flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-cyan-500/5 blur-[20px]"></div>
                      <div className="text-[9px] text-gray-600 font-mono absolute top-2 left-2">Automatización</div>
                      {/* Iconos de flujo simplificados */}
                      <div className="flex items-center gap-2 z-10">
                        <div className="w-6 h-6 rounded border border-cyan-500/40 bg-cyan-950 flex items-center justify-center text-cyan-400">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <ArrowRight size={14} className="text-gray-700" />
                        <div className="w-6 h-6 rounded border border-blue-500/40 bg-blue-950 flex items-center justify-center text-blue-400">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </div>
                      </div>
                    </div>

                  </div>
                </motion.div>
              </div>

            </motion.div>

            {/* --- FIN DEL REEMPLAZO --- */}

          </div>

          {/* --- PEGAR ESTO DEBAJO DE LA SECCIÓN DE INFRAESTRUCTURA --- */}
        
        {/* Sección de Autoridad y Prueba Social */}
        <div className="w-full max-w-6xl mx-auto mt-20 px-6 pb-32 z-10 relative">
          
          {/* Encabezado de la sección */}
          <div className="text-center mb-16">
            <motion.span 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-cyan-400 font-semibold tracking-[0.2em] uppercase text-xs mb-4 block"
            >
              Resultados Comprobados
            </motion.span>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
              No persigas el dinero.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-100">
                Empieza a moverlo.
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Reproductor de Video Destacado (Entrevistas/Entrenamiento) */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2 bg-[#0A182D] rounded-2xl border border-gray-800 p-2 relative group cursor-pointer overflow-hidden"
            >
              {/* Contenedor del "Video" */}
              <div className="w-full aspect-video bg-[#05101F] rounded-xl relative overflow-hidden flex items-center justify-center border border-gray-800 group-hover:border-cyan-500/30 transition-colors">
                {/* Imagen/Fondo de miniatura (Simulado con gradiente) */}
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 to-cyan-900/20 opacity-50 mix-blend-overlay"></div>
                
                {/* Botón de Play Animado */}
                <div className="w-16 h-16 bg-cyan-500/20 backdrop-blur-md rounded-full flex items-center justify-center border border-cyan-400/50 group-hover:scale-110 group-hover:bg-cyan-500/30 transition-all z-10">
                  <div className="w-0 h-0 border-t-8 border-t-transparent border-l-[14px] border-l-cyan-400 border-b-8 border-b-transparent ml-1"></div>
                </div>

                {/* Etiqueta de Entrevista */}
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md border border-gray-700 px-4 py-2 rounded-lg z-10 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-xs font-medium text-white">Entrevista Exclusiva: Yampiero de Dios</span>
                </div>
              </div>
            </motion.div>

            {/* Columna de Reseñas / Aprobaciones */}
            <div className="flex flex-col gap-6">
              
              {/* Reseña 1 */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-[#0A182D] p-6 rounded-2xl border border-gray-800 hover:border-gray-600 transition-colors flex-1"
              >
                <div className="flex text-cyan-400 mb-3 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <p className="text-[#A1A7B3] text-sm leading-relaxed mb-4 italic">
                  "Dupliqué mis ingresos en 30 días. El acceso directo a los 65 bancos cambió por completo la forma en que estructuro los tratos para mis clientes."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-900 border border-blue-700 flex items-center justify-center text-xs font-bold text-white">HR</div>
                  <div>
                    <div className="text-white text-sm font-semibold">Henry R.</div>
                    <div className="text-gray-500 text-xs">Corredor Activo</div>
                  </div>
                </div>
              </motion.div>

              {/* Reseña 2 */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-[#0A182D] p-6 rounded-2xl border border-gray-800 hover:border-gray-600 transition-colors flex-1"
              >
                <div className="flex text-cyan-400 mb-3 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <p className="text-[#A1A7B3] text-sm leading-relaxed mb-4 italic">
                  "El CRM con IA integrado hace que el seguimiento sea impecable. Pasé de usar 4 herramientas distintas a centralizar todo en E360."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-900 border border-cyan-700 flex items-center justify-center text-xs font-bold text-white">MD</div>
                  <div>
                    <div className="text-white text-sm font-semibold">María D.</div>
                    <div className="text-gray-500 text-xs">Agencia Financiera</div>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </div>
        {/* --- FIN DE LA SECCIÓN DE PRUEBA SOCIAL --- */}
        </div>
        {/* --- FIN DE LA SECCIÓN --- */}

        {/* --- PEGAR ESTO DEBAJO DE LA SECCIÓN DE PRUEBA SOCIAL --- */}
        
        {/* Sección de Call to Action (Cierre y Formulario) */}
        <div className="w-full max-w-4xl mx-auto mt-10 px-6 pb-40 z-10 relative">
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="bg-gradient-to-br from-[#0A182D] via-[#05101F] to-[#0A182D] border border-cyan-500/40 rounded-3xl p-8 md:p-14 relative overflow-hidden shadow-[0_0_40px_rgba(0,224,240,0.1)]"
          >
            {/* Brillos de fondo para el formulario */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="text-center mb-10 relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
                ¿Listo para <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Escalar?</span>
              </h2>
              <p className="text-[#A1A7B3] text-lg">
                Completa el formulario y uno de nuestros especialistas se pondrá en contacto para configurar tu acceso a los más de 65 bancos.
              </p>
            </div>

            {/* Formulario Estilizado */}
            <form className="relative z-10 space-y-5 max-w-xl mx-auto" onSubmit={(e) => e.preventDefault()}>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Input Nombre */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-medium ml-1">Nombre Completo</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Henry R." 
                    className="w-full bg-[#05101F] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  />
                </div>
                
                {/* Input Teléfono */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-medium ml-1">Teléfono</label>
                  <input 
                    type="tel" 
                    placeholder="+1 (555) 000-0000" 
                    className="w-full bg-[#05101F] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  />
                </div>
              </div>

              {/* Input Email */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium ml-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  placeholder="tu@agencia.com" 
                  className="w-full bg-[#05101F] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                />
              </div>

              {/* Botón de Submit */}
              <button className="w-full bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-bold py-4 rounded-lg mt-4 hover:from-cyan-300 hover:to-blue-500 transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(0,224,240,0.3)]">
                Solicitar Acceso al Ecosistema
              </button>
              
              <p className="text-center text-[10px] text-gray-500 mt-4">
                Al enviar tu información, aceptas nuestros términos y condiciones. Tus datos están protegidos.
              </p>
            </form>
          </motion.div>
        </div>
        {/* --- FIN DE LA SECCIÓN DE CALL TO ACTION --- */}
    </main>
  );
}