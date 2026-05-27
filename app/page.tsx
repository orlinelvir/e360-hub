"use client";

import { motion } from "framer-motion";
import { ArrowRight, GraduationCap, Users, Building, PlayCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import AnimatedNumber from "@/components/AnimatedNumber";
import WeeklySyllabus from "@/components/WeeklySyllabus";
import BankRollover from "@/components/BankRollover";
import VideoCard from "@/components/VideoCard";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#030812] text-white flex flex-col relative overflow-hidden">
      
      {/* --- HERO SECTION CINEMÁTICO --- */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Fondo con Video Real - AUTORIDAD YAMPIERO */}
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-60" 
          >
            <source src="/IMG_0004.MOV" type="video/quicktime" />
            <source src="/IMG_0004.MOV" type="video/mp4" />
          </video>
          
          {/* Degradados más suaves para la prueba */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#030812]/50 via-transparent to-[#030812]" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-6xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-sm font-semibold mb-8 backdrop-blur-md">
              <GraduationCap size={16} />
              Instituto de Negocios y Capital
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 leading-[1.1]">
              Domina el Negocio <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-400 to-blue-600 italic pr-4">
                del Capital.
              </span>
            </h1>
            
            <p className="text-gray-300 text-lg md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              Capacitación de élite para dueños de negocios multiservicios. Aprende a estructurar, reparar y fondear empresas mientras construyes tu propia agencia financiera.
            </p>

            {/* Botones de Acción - Psicología High-Ticket */}
            <div className="flex flex-col items-center">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full">
                <button className="bg-white text-black px-10 py-5 rounded-full font-bold text-lg flex items-center justify-center gap-3 hover:bg-cyan-400 hover:text-black active:scale-95 transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.15)] w-full sm:w-auto">
                  Aplicar a la Academia <ArrowRight size={20} />
                </button>
                <button className="px-10 py-5 rounded-full font-semibold border border-gray-600 text-white flex items-center justify-center gap-3 hover:bg-white hover:text-black active:scale-95 transition-all w-full sm:w-auto backdrop-blur-md">
                  <PlayCircle size={20} className="text-cyan-400 group-hover:text-black" /> Verificar Disponibilidad
                </button>
              </div>
              
              {/* Micro-copy de escasez y autoridad */}
              <div className="mt-8 flex items-center justify-center gap-3 opacity-90">
                <div className="flex -space-x-3">
                  <div className="relative w-8 h-8 rounded-full border-2 border-[#030812] overflow-hidden shadow-lg">
                    <Image src="https://randomuser.me/api/portraits/men/32.jpg" alt="Estudiante de la Academia E360" fill className="object-cover" />
                  </div>
                  <div className="relative w-8 h-8 rounded-full border-2 border-[#030812] overflow-hidden shadow-lg">
                    <Image src="https://randomuser.me/api/portraits/women/44.jpg" alt="Estudiante de la Academia E360" fill className="object-cover" />
                  </div>
                  <div className="relative w-8 h-8 rounded-full border-2 border-[#030812] overflow-hidden shadow-lg">
                    <Image src="https://randomuser.me/api/portraits/men/68.jpg" alt="Estudiante de la Academia E360" fill className="object-cover" />
                  </div>
                </div>
                <p className="text-sm font-medium tracking-wide text-gray-300">
                  <span className="text-cyan-400 font-bold">Cohorte actual:</span> Selección rigurosa de perfiles.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- EL PROBLEMA / LA AUDIENCIA (Por qué E360) --- */}
      <section className="py-32 px-6 relative z-10 w-full bg-[#05101F]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
                Diseñado para <br/>
                <span className="text-cyan-400">Emprendedores Multiservicios.</span>
              </h2>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed font-light">
                Entendemos que ya tienes una cartera de clientes. Lo que te falta es la infraestructura para ofrecerles soluciones de capital sin depender de terceros.
              </p>
              
              <div className="space-y-6">
                {[
                  { title: "Nuevos Corredores", desc: "Aprende la industria financiera desde cero con clases en vivo y mentoría." },
                  { title: "Agencias Existentes", desc: "Integra reparación de crédito y fondeo comercial a tus servicios actuales." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-6 rounded-2xl bg-[#0A182D] border border-gray-800 hover:border-cyan-500/30 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-cyan-900/30 flex items-center justify-center text-cyan-400 shrink-0">
                      <Users size={20} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">{item.title}</h4>
                      <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Imagen Editorial de la Academia */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1 }}
              className="relative h-[600px] rounded-3xl overflow-hidden border border-gray-800"
            >
              <Image 
                src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070&auto=format&fit=crop" 
                alt="Sesión de mentoría en E360 Hub" 
                fill 
                className="object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05101F] via-transparent to-transparent" />
              
              <div className="absolute bottom-10 left-10 right-10 bg-[#0A182D]/80 backdrop-blur-xl p-8 rounded-2xl border border-gray-700">
                <div className="text-cyan-400 font-bold text-3xl mb-2">+40 Hrs</div>
                <div className="text-white font-medium">De entrenamiento intensivo semanal</div>
                <div className="mt-4 flex gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full">Domingos</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full">Lunes a Miércoles</span>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* --- LOS PILARES DEL INSTITUTO (Grid Elegante) --- */}
      <section className="py-32 px-6 relative z-10 w-full bg-[#030812]">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6">El Plan de Estudios</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              No solo te enseñamos la teoría. Te entregamos la tecnología y el respaldo bancario para que operes desde el primer día.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            
            <Link href="/funding" className="group">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-[#0A182D] p-10 rounded-3xl border border-gray-800 group-hover:border-cyan-500/50 transition-all h-full relative overflow-hidden">
                <div className="w-16 h-16 rounded-2xl bg-blue-900/30 flex items-center justify-center text-cyan-400 mb-8 group-hover:scale-110 transition-transform">
                  <Building size={32} />
                </div>
                <h3 className="text-3xl font-bold mb-4">Capital y Fondeo</h3>
                <p className="text-gray-400 mb-8 text-lg">Aprende a analizar perfiles de riesgo y estructurar financiamiento comercial, personal e inmobiliario en USA e Internacional.</p>
                <span className="text-cyan-400 font-bold flex items-center gap-2">Explorar Módulo <ArrowRight size={16}/></span>
              </motion.div>
            </Link>

            <Link href="/credit-repair" className="group">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-[#0A182D] p-10 rounded-3xl border border-gray-800 group-hover:border-cyan-500/50 transition-all h-full relative overflow-hidden">
                <div className="w-16 h-16 rounded-2xl bg-blue-900/30 flex items-center justify-center text-cyan-400 mb-8 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <h3 className="text-3xl font-bold mb-4">Restauración de Crédito</h3>
                <p className="text-gray-400 mb-8 text-lg">Domina las leyes FCRA y FDCPA. Te enseñamos el proceso técnico para eliminar marcas negativas y elevar el score de tus clientes.</p>
                <span className="text-cyan-400 font-bold flex items-center gap-2">Explorar Módulo <ArrowRight size={16}/></span>
              </motion.div>
            </Link>

            <Link href="/incorporation" className="group">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-[#0A182D] p-10 rounded-3xl border border-gray-800 group-hover:border-cyan-500/50 transition-all h-full relative overflow-hidden">
                <div className="w-16 h-16 rounded-2xl bg-blue-900/30 flex items-center justify-center text-cyan-400 mb-8 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="text-3xl font-bold mb-4">Estructura Corporativa</h3>
                <p className="text-gray-400 mb-8 text-lg">Guía paso a paso para incorporar empresas en USA (LLC, Corp), tramitar ITIN, EIN y preparar negocios para financiamiento pesado.</p>
                <span className="text-cyan-400 font-bold flex items-center gap-2">Explorar Módulo <ArrowRight size={16}/></span>
              </motion.div>
            </Link>

            <Link href="/crm" className="group">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-[#0A182D] p-10 rounded-3xl border border-gray-800 group-hover:border-cyan-500/50 transition-all h-full relative overflow-hidden">
                <div className="w-16 h-16 rounded-2xl bg-blue-900/30 flex items-center justify-center text-cyan-400 mb-8 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
                </div>
                <h3 className="text-3xl font-bold mb-4">Tecnología y Escala (CRM)</h3>
                <p className="text-gray-400 mb-8 text-lg">Implementación de sistemas automatizados. Accede a nuestra plataforma todo en uno para gestionar prospectos, contratos y citas.</p>
                <span className="text-cyan-400 font-bold flex items-center gap-2">Explorar Módulo <ArrowRight size={16}/></span>
              </motion.div>
            </Link>
          </div>
        </div>
      </section>

      {/* --- ACORDEÓN DEL PLAN DE ESTUDIOS --- */}
      <WeeklySyllabus />

      {/* --- SECCIÓN DEL MENTOR (Autoridad de Yampiero) --- */}
      <section className="py-32 px-6 relative z-10 w-full bg-[#030812] overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* Foto de Yampiero con efecto de marco iluminado */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative lg:w-1/2"
            >
              <div className="relative z-10 rounded-3xl overflow-hidden border border-gray-800 shadow-2xl h-[600px]">
                <Image 
                  src="/IMG_0011.JPEG" 
                  alt="Yampiero de Dios - Fundador de E360 Hub" 
                  fill
                  className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
                />
              </div>
              {/* Elementos decorativos de fondo */}
              <div className="absolute -bottom-6 -right-6 w-64 h-64 bg-cyan-500/10 blur-3xl rounded-full -z-10" />
              <div className="absolute -top-6 -left-6 w-32 h-32 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-3xl" />
            </motion.div>

            {/* Contenido de Texto */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:w-1/2"
            >
              <span className="text-cyan-400 font-bold tracking-widest uppercase text-xs mb-4 block">Fundador e Instructor Principal</span>
              <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white leading-tight">
                Liderado por <br/>
                <span className="italic font-light">Yampiero de Dios</span>
              </h2>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed font-light">
                Con años de experiencia en la estructuración de capital y restauración de crédito en el mercado estadounidense, Yampiero ha diseñado este instituto para acortar la curva de aprendizaje de emprendedores que buscan libertad financiera real.
              </p>
              
              <div className="grid grid-cols-2 gap-8 mb-10">
                <div>
                  <div className="text-white font-bold mb-1">Misión</div>
                  <p className="text-gray-500 text-sm leading-relaxed">Democratizar el acceso al capital comercial para la comunidad latina.</p>
                </div>
                <div>
                  <div className="text-white font-bold mb-1">Visión</div>
                  <p className="text-gray-500 text-sm leading-relaxed">Crear la red de brokers más influyente de la industria.</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* Firma o Elemento de Marca */}
                <div className="h-px w-12 bg-cyan-500" />
                <p className="text-sm font-mono text-cyan-400 uppercase tracking-widest">E360 Hub Executive Director</p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* --- EL MURO DEL ÉXITO (Súper Animado) --- */}
      <section className="py-32 px-6 relative z-10 w-full bg-[#05101F] border-t border-gray-800/50 overflow-hidden">
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <motion.span 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-cyan-400 font-semibold tracking-widest uppercase text-xs mb-4 block"
            >
              Resultados Comprobados
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.8 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white tracking-tight"
            >
              El Muro del <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Éxito.</span>
            </motion.h2>
          </div>

          {/* Métricas con Contador Dinámico */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {[
              { end: 15, prefix: "$", suffix: "M+", label: "Capital Estructurado", delay: 0 },
              { end: 250, prefix: "", suffix: "+", label: "Brokers Certificados", delay: 0.2 },
              { end: 100, prefix: "", suffix: "%", label: "Casos de Estudio Reales", delay: 0.4 }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -10, scale: 1.02 }} 
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="bg-gradient-to-b from-[#0A182D] to-[#05101F] border border-gray-800 p-8 rounded-3xl text-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-cyan-500/30 group"
              >
                <div className="text-5xl md:text-6xl font-extrabold text-white mb-2 tracking-tighter group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-blue-500 transition-all duration-500">
                  <AnimatedNumber end={stat.end} prefix={stat.prefix} suffix={stat.suffix} delay={stat.delay} />
                </div>
                <div className="text-cyan-400 font-medium tracking-widest uppercase text-[11px]">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Tarjetas de Testimonios con Estrellas Dinámicas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                name: "Carlos M.", role: "Dueño de Agencia, TX", img: "https://randomuser.me/api/portraits/men/45.jpg",
                text: "Pasé de simplemente referir clientes a otros bancos, a estructurar mis propios expedientes de fondeo. El módulo de crédito corporativo cambió las reglas del juego."
              },
              { 
                name: "Laura G.", role: "Broker Independiente, FL", img: "https://randomuser.me/api/portraits/women/68.jpg",
                text: "La profundidad técnica de las leyes FCRA que enseñan en E360 no la vi en ningún otro lado. Logré borrar colecciones difíciles en mi primer mes de aplicar el método."
              },
              { 
                name: "David R.", role: "Emprendedor Multiservicios, CA", img: "https://randomuser.me/api/portraits/men/22.jpg",
                text: "Entré por la capacitación y me quedé por la infraestructura. Tener acceso a la plataforma CRM y a las conexiones con prestamistas directos me ahorró más de 2 años."
              }
            ].map((testimonial, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                whileHover={{ y: -5 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.8 }}
                className="bg-[#0A182D]/60 backdrop-blur-sm border border-gray-800 p-8 rounded-3xl relative hover:border-cyan-500/40 transition-all duration-300 shadow-xl flex flex-col group"
              >
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, star) => (
                    <motion.svg 
                      key={star} 
                      initial={{ color: "#374151", filter: "drop-shadow(0 0 0px transparent)" }} 
                      whileInView={{ color: "#22d3ee", filter: "drop-shadow(0 0 8px rgba(34,211,238,0.8))" }} 
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ delay: i * 0.2 + star * 0.15, duration: 0.5 }} 
                      className="w-5 h-5" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </motion.svg>
                  ))}
                </div>

                <p className="text-gray-300 font-light mb-8 relative z-10 text-sm leading-relaxed flex-grow">
                  "{testimonial.text}"
                </p>

                <div className="flex items-center gap-4 mt-auto">
                  <div className="relative w-12 h-12 rounded-full border border-gray-600 overflow-hidden shadow-sm">
                    <Image src={testimonial.img} alt={testimonial.name} fill className="object-cover" />
                  </div>
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      {testimonial.name}
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- BANCOS ALIADOS (MARQUEE) --- */}
      <BankRollover />

      {/* --- EXPERIENCIA EN VIVO --- */}
      <section className="py-32 px-6 relative z-10 w-full bg-[#030812] border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Experiencia <span className="text-cyan-400">en Vivo</span></h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Sumérgete en nuestra cultura. Eventos, mentorías y nuestras instalaciones diseñadas para el alto rendimiento.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "/video-academia.mp4", "/IMG_0005.MOV", "/IMG_0006.MOV",
              "/IMG_0007.MOV", "/IMG_0008.MOV", "/IMG_0009.MOV"
            ].map((video, i) => (
              <VideoCard key={i} src={video} index={i} />
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
