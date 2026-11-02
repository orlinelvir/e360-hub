"use client";

import { motion } from "framer-motion";
import { Lock, Sparkles, Shield, DollarSign, Users, FileText, ArrowRight, Eye, PhoneCall } from "lucide-react";

interface TaxOfficePaywallProps {
  onEnableDemo: () => void;
  brokerName: string;
}

export default function TaxOfficePaywall({ onEnableDemo, brokerName }: TaxOfficePaywallProps) {
  const whatsappNumber = "17869680370";
  const whatsappMsg = encodeURIComponent(
    `Hola equipo E360, soy ${brokerName}. Quiero activar el módulo de "Oficina Virtual E360" para la temporada de taxes en mi cuenta de broker.`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMsg}`;

  const features = [
    {
      icon: Users,
      title: "Expediente Centralizado de Casos",
      desc: "Seguimiento en vivo desde la recepción de W-2s y 1099s hasta el e-file y la aceptación por el IRS.",
    },
    {
      icon: DollarSign,
      title: "Cobro Directo del Reembolso",
      desc: "Integración con los 4 bancos líderes (TPG, Refund Advantage, Republic, EPS) para que cobres sin que el cliente pague de su bolsillo.",
    },
    {
      icon: Users,
      title: "Reparto de Comisiones & Splits",
      desc: "Desglose automático de honorarios por preparador, retención del fee E360 ($60/decl si aplica) y reportes 1099-NEC.",
    },
    {
      icon: FileText,
      title: "Plantillas Legales & Consentimiento 7216",
      desc: "Formularios digitales listos: Consentimiento IRS 7216, Contrato de Prestación de Servicios y Cuestionario de Admisión.",
    },
  ];

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-[#0A182D] via-[#05101F] to-[#030914] p-8 md:p-14 shadow-2xl">
      {/* Glow ambiental E360 (Electric Cyan & Deep Blue) */}
      <div className="absolute top-0 right-1/4 -z-0 h-96 w-96 rounded-full bg-cyan-500/15 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 -z-0 h-96 w-96 rounded-full bg-blue-600/15 blur-[140px] pointer-events-none" />

      {/* Contenido Superior */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Badge Cyan E360 */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 text-xs font-extrabold uppercase tracking-widest mb-6 shadow-[0_0_15px_rgba(0,224,240,0.15)]">
          <Sparkles size={14} className="text-cyan-400" />
          <span>Módulo Pro • Temporada Fiscal 2025 - 2026</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
          Tu Oficina Virtual de Taxes{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-500">
            en un Solo Lugar.
          </span>
        </h1>

        <p className="mt-4 text-sm md:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Diseñado exclusivamente para que los brokers y preparadores de Emprende 360 gestionen cientos de declaraciones sin hojas de cálculo desorganizadas, con cobro bancario automático y reparto de comisiones.
        </p>

        {/* Acciones Principales con Estilo Cyan Oficial E360 */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_0_30px_rgba(0,224,240,0.35)] flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Lock size={16} />
            <span>Desbloquear Oficina Virtual</span>
            <ArrowRight size={16} />
          </a>

          <button
            onClick={onEnableDemo}
            className="w-full sm:w-auto px-6 py-4 bg-gray-900/80 hover:bg-gray-800 border border-gray-700/80 hover:border-cyan-500/50 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer group"
          >
            <Eye size={16} className="text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Explorar Modo Demostración</span>
          </button>
        </div>

        <p className="mt-3 text-[11px] text-gray-400">
          ¿Ya adquiriste tu licencia de software o mentoría? Contacta a soporte para activar tu acceso inmediatamente.
        </p>
      </div>

      {/* Grid de Funcionalidades */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto mt-12">
        {features.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#05101F]/80 border border-gray-800/80 hover:border-cyan-500/30 p-5 rounded-2xl transition-all flex items-start gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <Icon size={20} />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">{item.title}</h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tarjeta de Planes / Formas de Acceso */}
      <div className="relative z-10 max-w-4xl mx-auto mt-10 p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-blue-950/40 border border-cyan-500/25 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Shield size={24} />
          </div>
          <div>
            <h5 className="font-extrabold text-white text-sm md:text-base">
              ¿Cómo se activa la Oficina Virtual?
            </h5>
            <p className="text-xs text-gray-300 mt-0.5">
              Viene incluida al adquirir el <strong>Software de Taxes E360 ($899/año)</strong> o el programa de <strong>Mentoría Fiscal ($150 + desde $60/decl)</strong>.
            </p>
          </div>
        </div>

        <a
          href="https://wa.me/17869680370?text=Hola%20E360,%20deseo%20activar%20mi%20Oficina%20Virtual%20de%20Taxes"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-5 py-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
        >
          <PhoneCall size={14} />
          <span>Hablar con un Asesor</span>
        </a>
      </div>
    </div>
  );
}
