"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CreditCard, Landmark, Zap, User, Clock, Calendar, BarChart3, Info } from "lucide-react";
import ProductModal from "@/components/ProductModal";

const products = [
  {
    title: "Tarjeta de Crédito Empresarial",
    icon: <CreditCard size={28} />,
    requirements: [
      { label: "Score Mínimo", value: "700+" },
      { label: "Tiempo en Negocio", value: "0 días (Apto LLC nuevas)" },
      { label: "Tiempo de Fondeo", value: "7-14 días hábiles" }
    ],
    details: [
      "Límites altos (hasta $150k)",
      "0% de interés introductorio por 12-18 meses",
      "No aparece en tu reporte personal",
      "Reporta a Dun & Bradstreet",
      "Ideal para capital de trabajo inicial"
    ],
    process: [
      "Estructuración de perfil comercial",
      "Validación de cumplimiento LLC",
      "Sometimiento a bancos aliados",
      "Recepción de tarjetas físicas"
    ],
    cta: "Aplicar para Tarjeta Business",
    color: "cyan"
  },
  {
    title: "Líneas de Crédito y SBA",
    icon: <Landmark size={28} />,
    requirements: [
      { label: "Score Mínimo", value: "680+" },
      { label: "Tiempo en Negocio", value: "1 año o más" },
      { label: "Tiempo de Fondeo", value: "30-45 días hábiles" }
    ],
    note: "Requiere mostrar rentabilidad fiscal.",
    details: [
      "Fondos gubernamentales garantizados",
      "Tasas de interés más bajas del mercado",
      "Plazos de pago extendidos (hasta 10 años)",
      "Sin penalidad por pago anticipado",
      "Uso flexible para expansión o compra"
    ],
    process: [
      "Análisis de declaraciones de impuestos",
      "Preparación de paquete financiero",
      "Sometimiento a prestamistas SBA",
      "Aprobación y cierre notariado"
    ],
    cta: "Consultar Programas SBA",
    color: "blue"
  },
  {
    title: "Adelanto de Capital (MCA)",
    icon: <Zap size={28} />,
    requirements: [
      { label: "Score Mínimo", value: "550+" },
      { label: "Tiempo en Negocio", value: "4 meses+" },
      { label: "Ingresos", value: "$5,000+" },
      { label: "Tiempo de Fondeo", value: "24-48 horas" }
    ],
    badge: "Más Rápido",
    details: [
      "Aprobación basada en flujo de caja",
      "Sin colateral requerido",
      "Ideal para emergencias o inventario",
      "Proceso 100% digital y rápido",
      "Pagos automáticos flexibles"
    ],
    process: [
      "Sincronización de estados bancarios",
      "Oferta en menos de 4 horas",
      "Firma de contrato digital",
      "Transferencia ACH inmediata"
    ],
    cta: "Obtener Capital Hoy",
    color: "yellow"
  },
  {
    title: "Préstamo Personal",
    icon: <User size={28} />,
    requirements: [
      { label: "Score Mínimo", value: "700+" },
      { label: "Documentación", value: "Comprobante de ingresos + 2 declaraciones" }
    ],
    note: "Debe contactar al equipo E360 directamente para la documentación personalizada.",
    details: [
      "Fondeo basado en ingresos personales",
      "Sin restricciones de uso comercial",
      "Plazos fijos y cuotas constantes",
      "Consolidación de deudas de alto interés",
      "Fondos depositados directamente"
    ],
    process: [
      "Verificación de ingresos W2/1099",
      "Análisis de relación deuda/ingreso",
      "Matching con banco correspondiente",
      "Desembolso a cuenta personal"
    ],
    cta: "Contactar Especialista",
    color: "purple"
  }
];

export default function FundingClient() {
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-[#05101F] text-white flex flex-col relative overflow-hidden">
      
      {/* Resplandor de fondo */}
      <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-40 left-0 w-[400px] h-[400px] bg-cyan-400/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Hero Section - Fondeo */}
      <section className="pt-32 pb-20 px-6 relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-cyan-400 font-semibold tracking-widest uppercase text-xs mb-6 block">
            E360 • Capital Solutions
          </span>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
            Productos de Fondeo <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-400 to-blue-600">
              Estructurados para el Éxito.
            </span>
          </h1>
          
          <p className="text-[#A1A7B3] text-lg md:text-xl mb-12 max-w-3xl mx-auto leading-relaxed">
            Sin la burocracia de los bancos tradicionales. Accede a capital estratégico diseñado para cada etapa de tu negocio, con procesos de validación ágiles y transparentes.
          </p>

          <button className="bg-gradient-to-r from-cyan-400 to-blue-600 text-black px-8 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-cyan-300 active:scale-95 transition-all mx-auto transform hover:scale-105 shadow-[0_0_20px_rgba(0,224,240,0.3)]">
            Evaluar mi Escenario de Fondeo <ArrowRight size={20} />
          </button>
        </motion.div>
      </section>

      {/* Sección de Tarjetas de Productos */}
      <section className="py-20 px-6 relative z-10 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {products.map((product, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#0A182D] border border-gray-800 rounded-3xl p-8 hover:border-cyan-500/40 transition-all group relative overflow-hidden flex flex-col h-full"
            >
              {/* Badge si existe */}
              {product.badge && (
                <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-widest">
                  {product.badge}
                </div>
              )}

              {/* Encabezado de la Tarjeta */}
              <div className="flex items-center gap-5 mb-8">
                <div className={`w-14 h-14 bg-gray-900 border border-gray-700 rounded-2xl flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform`}>
                  {product.icon}
                </div>
                <h3 className="text-2xl font-bold text-white leading-tight">{product.title}</h3>
              </div>

              {/* Lista de Requerimientos */}
              <div className="space-y-5 flex-grow">
                {product.requirements.map((req, j) => (
                  <div key={j} className="flex items-start justify-between gap-4 border-b border-gray-800/50 pb-3">
                    <span className="text-gray-500 text-sm font-medium">{req.label}</span>
                    <span className="text-gray-200 text-sm font-bold text-right">{req.value}</span>
                  </div>
                ))}
              </div>

              {/* Nota Adicional */}
              {product.note && (
                <div className="mt-8 p-4 rounded-xl bg-blue-950/20 border border-blue-900/30 flex gap-3 items-start">
                  <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-300 leading-relaxed italic">
                    {product.note}
                  </p>
                </div>
              )}

              {/* Botón de acción interno */}
              <div className="mt-8 pt-6 border-t border-gray-800/50 flex justify-end">
                <button 
                  onClick={() => handleOpenModal(product)}
                  className="text-cyan-400 text-sm font-bold flex items-center gap-2 group-hover:translate-x-2 transition-transform cursor-pointer"
                >
                  Más Información <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Modal Detallado */}
      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        product={selectedProduct} 
      />

      {/* Sección Interactiva: Velocidad de Aprobación */}
      <section className="py-20 px-6 relative z-10 w-full bg-[#030812] border-y border-gray-800/50">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-[#0A182D] to-[#05101F] border border-cyan-500/30 rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="w-full md:w-1/2 relative">
                <div className="absolute -inset-4 bg-cyan-500/10 blur-xl rounded-full"></div>
                <h3 className="text-4xl font-bold text-white mb-4 relative z-10">
                  De la solicitud a la cuenta en <span className="text-cyan-400">24 a 72 hrs</span>
                </h3>
                <p className="text-gray-400 relative z-10 mb-6">
                  Nuestra tecnología agiliza el proceso de validación conectando tu perfil directamente con los fondos.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#05101F] border border-cyan-500/30 text-xs text-cyan-400 relative z-10 shadow-inner">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="font-medium tracking-wide uppercase text-[10px]">Horas laborables (Sáb. y Dom. excluidos)</span>
                </div>
              </div>
              <div className="w-full md:w-1/2 space-y-4 relative z-10">
                <div className="bg-[#05101F] p-4 rounded-xl border border-gray-700 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-300">1. Aplicación Recibida</span>
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">✓</div>
                </div>
                <div className="bg-[#05101F] p-4 rounded-xl border border-gray-700 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-300">2. Match con Prestamistas</span>
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">✓</div>
                </div>
                <div className="bg-cyan-900/20 p-4 rounded-xl border border-cyan-500/40 flex items-center justify-between relative overflow-hidden">
                  <motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent" />
                  <span className="text-sm font-bold text-cyan-400 relative z-10">3. Fondos Depositados</span>
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 relative z-10 animate-pulse"><Zap size={14} /></div>
                </div>
              </div>
            </div>
          </div>
      </section>
    </main>
  );
}
