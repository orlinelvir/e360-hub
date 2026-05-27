"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    title: string;
    icon: React.ReactNode;
    details: string[];
    process: string[];
    cta: string;
  } | null;
}

export default function ProductModal({ isOpen, onClose, product }: ProductModalProps) {
  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] cursor-pointer"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl bg-[#0A182D] border border-gray-800 rounded-3xl z-[70] overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-gradient-to-r from-cyan-500/5 to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400">
                  {product.icon}
                </div>
                <h3 className="text-2xl font-bold text-white">{product.title}</h3>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-8 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                
                {/* Beneficios */}
                <div>
                  <h4 className="text-cyan-400 font-bold uppercase tracking-wider text-xs mb-6">Beneficios Clave</h4>
                  <ul className="space-y-4">
                    {product.details.map((detail, idx) => (
                      <li key={idx} className="flex gap-3 text-gray-300 text-sm leading-relaxed">
                        <CheckCircle2 size={18} className="text-cyan-500 shrink-0 mt-0.5" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Proceso */}
                <div className="bg-[#05101F] p-6 rounded-2xl border border-gray-800">
                  <h4 className="text-white font-bold text-sm mb-6 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-cyan-400" /> Hoja de Ruta
                  </h4>
                  <div className="space-y-6 relative">
                    {/* Linea vertical conectora */}
                    <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-800" />
                    
                    {product.process.map((step, idx) => (
                      <div key={idx} className="flex gap-4 relative z-10">
                        <div className="w-6 h-6 rounded-full bg-[#0A182D] border border-cyan-500/50 flex items-center justify-center text-[10px] font-bold text-cyan-400">
                          {idx + 1}
                        </div>
                        <p className="text-gray-400 text-xs leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Footer / CTA */}
            <div className="p-8 border-t border-gray-800 bg-[#05101F]/50">
              <button className="w-full bg-gradient-to-r from-cyan-400 to-blue-600 text-black py-4 rounded-xl font-bold text-lg hover:from-cyan-300 hover:to-blue-500 transition-all transform hover:scale-[1.02] shadow-[0_0_30px_rgba(0,224,240,0.2)] flex items-center justify-center gap-3">
                {product.cta} <ArrowRight size={20} />
              </button>
              <p className="text-center text-[10px] text-gray-500 mt-4 uppercase tracking-widest font-medium">
                Sin impacto inicial en tu puntaje de crédito
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
