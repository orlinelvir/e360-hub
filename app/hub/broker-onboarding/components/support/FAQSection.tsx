"use client";

import { useState } from "react";
import { Search, ChevronDown, Sparkles } from "lucide-react";

const faqsData = [
  {
    category: "CRM & Plataforma",
    q: "¿Cómo accedo a mi subcuenta StartPoint CRM?",
    a: "Cada broker autorizado recibe un correo de invitación a su subcuenta de CRM con su Location ID exclusivo. Si no lo has recibido, abre un ticket de soporte o solicita el reenvío desde la sección 'Mi Perfil'."
  },
  {
    category: "Comisiones",
    q: "¿Cuándo y cómo recibo el pago de mis comisiones?",
    a: "Las comisiones se procesan los días viernes de cada semana mediante la vía seleccionada en tu perfil (Depósito Directo / ACH o Zelle). Aplica para préstamos fondeados o servicios cerrados hasta el miércoles anterior."
  },
  {
    category: "Underwriting",
    q: "¿Qué documentación necesita un cliente para Préstamo de Negocio (MCA)?",
    a: "El cliente debe presentar: 1) Últimos 4 estados de cuenta bancarios de la empresa, 2) Identificación oficial vigente del dueño, 3) Número EIN y Voided Check de la cuenta corporativa."
  },
  {
    category: "Servicios",
    q: "¿Puedo referir clientes si no tengo licencias de seguros?",
    a: "¡Sí! Como broker registrado en E360 Hub puedes referir clientes de seguros de auto, casa o comercial. Si no cuentas con licencia personal, nuestro departamento de suscripción procesa el caso y tú recibes honorarios por referido."
  },
  {
    category: "Underwriting",
    q: "¿Qué hago si mi cliente figura con fondos insuficientes (NSF) excesivos?",
    a: "Si el cliente tiene más de 3-4 marcajes de NSF en un mismo mes, sugerimos esperar a cerrar el ciclo bancario actual manteniendo saldo positivo antes de someter la aplicación a los bancos."
  }
];

interface FAQSectionProps {
  onAskAI: (question: string) => void;
}

export default function FAQSection({ onAskAI }: FAQSectionProps) {
  const [search, setSearch] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const filteredFaqs = faqsData.filter(f => 
    f.q.toLowerCase().includes(search.toLowerCase()) || 
    f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[#0A182D]/40 border border-gray-800 rounded-3xl p-6 lg:p-8 space-y-6">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className="text-2xl font-extrabold text-white mb-2">Preguntas Frecuentes</h2>
        <p className="text-sm text-gray-400">Encuentra respuestas rápidas a las dudas más comunes de nuestros brokers.</p>
      </div>

      <div className="max-w-2xl mx-auto relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar pregunta clave..."
          className="w-full bg-[#05101F] border border-gray-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 shadow-inner"
        />
      </div>

      <div className="max-w-3xl mx-auto space-y-3 pt-4">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={idx} className="bg-[#05101F] border border-gray-800/80 rounded-2xl overflow-hidden transition-all">
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-4 md:p-5 text-left flex items-center justify-between gap-4 hover:bg-gray-800/30 transition-colors"
                >
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-wider mb-1 block">
                      {faq.category}
                    </span>
                    <span className={`font-semibold text-sm ${isOpen ? 'text-white' : 'text-gray-300'}`}>
                      {faq.q}
                    </span>
                  </div>
                  <ChevronDown size={18} className={`shrink-0 text-gray-500 transition-transform duration-300 ${isOpen ? "rotate-180 text-cyan-400" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-sm text-gray-400 leading-relaxed border-t border-gray-900/50 mt-1">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm mb-4">No encontramos respuestas exactas para "{search}".</p>
            <button
              onClick={() => onAskAI(search)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-xs font-bold transition-colors"
            >
              <Sparkles size={16} />
              Preguntar al Asistente IA
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
