"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Headphones, 
  Calendar, 
  MessageSquare, 
  Phone, 
  Send, 
  HelpCircle, 
  ChevronDown, 
  Search, 
  CheckCircle2, 
  Clock, 
  Briefcase, 
  ShieldCheck, 
  Calculator, 
  Laptop, 
  X,
  AlertCircle,
  Construction
} from "lucide-react";
import { SupportTicket } from "../types";

interface SoporteSectionProps {
  brokerName: string;
}

const faqsData = [
  {
    question: "¿Cómo accedo a mi subcuenta GoHighLevel (GHL)?",
    answer: "Cada broker autorizado de Emprende 360 recibe un correo de invitación a su subcuenta de GHL con su Location ID exclusivo. Si no has recibido la invitación, abre un ticket de soporte o solicita el reenvío desde la sección 'Mi Perfil'."
  },
  {
    question: "¿Cuándo y cómo recibo el pago de mis comisiones?",
    answer: "Las comisiones se procesan los días viernes de cada semana mediante la vía seleccionada en tu perfil (Depósito Directo / ACH o Zelle). Para préstamos fondeados o servicios cerrados hasta el miércoles anterior."
  },
  {
    question: "¿Qué documentación necesita un cliente para Préstamo de Negocio (MCA)?",
    answer: "El cliente debe presentar: 1) Últimos 3 estados de cuenta bancarios de la empresa, 2) Identificación oficial vigente del dueño, 3) Número EIN y Voided Check de la cuenta corporativa."
  },
  {
    question: "¿Puedo referir clientes si no tengo licencias de seguros?",
    answer: "¡Sí! Como broker registrado en E360 Hub puedes referir clientes de seguros de auto, casa o comercial. Si no cuentas con licencia personal, nuestro departamento de suscripción procesa el caso y tú recibes un honorario por referido."
  },
  {
    question: "¿Qué hago si mi cliente figura con fondos insuficientes (NSF) excesivos?",
    answer: "Si el cliente tiene más de 3-4 marcajes de NSF en un mismo mes, sugerimos esperar a cerrar el ciclo bancario actual manteniendo saldo positivo antes de someter la aplicación a los bancos."
  }
];

import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getBrokerTickets, createBrokerTicket, SupportTicketData } from "@/lib/services/broker-service";

export default function SoporteSection({ brokerName }: SoporteSectionProps) {
  const { user } = useAuth();
  const [searchFaq, setSearchFaq] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Modal Agendamiento
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("2026-07-22");
  const [selectedTime, setSelectedTime] = useState("10:00 AM");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Tickets
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState<SupportTicket["category"]>("general");
  const [ticketPriority, setTicketPriority] = useState<SupportTicket["priority"]>("medium");
  const [ticketDescription, setTicketDescription] = useState("");

  useEffect(() => {
    if (!user) return;
    getBrokerTickets(user.uid).then((storedTickets: any[]) => {
      setTickets(storedTickets as SupportTicket[]);
    }).catch(err => {
      console.error("Error cargando tickets de Firestore:", err);
    });
  }, [user]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDescription.trim()) return;

    const newTicketPayload: SupportTicketData = {
      subject: ticketSubject.trim(),
      category: ticketCategory,
      priority: ticketPriority,
      status: "open",
      createdAt: new Date().toISOString().split("T")[0],
      description: ticketDescription.trim()
    };

    if (user) {
      try {
        const docId = await createBrokerTicket(user.uid, newTicketPayload);
        const newTicket: SupportTicket = {
          id: docId,
          ...newTicketPayload
        };
        setTickets([newTicket, ...tickets]);
      } catch (err) {
        console.error("Error al crear ticket en Firestore:", err);
      }
    }

    setIsTicketModalOpen(false);
    setTicketSubject("");
    setTicketDescription("");
  };

  const filteredFaqs = faqsData.filter(faq => 
    faq.question.toLowerCase().includes(searchFaq.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchFaq.toLowerCase())
  );

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setIsCalendarOpen(false);
    }, 2000);
  };

  return (
    <div className="space-y-8">

      {/* AVISO DE SECCIÓN EN DESARROLLO / PRUEBAS BETA */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-inner">
        <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/30 shrink-0">
          <Construction size={20} />
        </div>
        <div>
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
            <span>Módulo en Desarrollo / Versión Beta</span>
            <span className="bg-amber-500/20 text-amber-300 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-amber-500/40">BETA PRUEBAS</span>
          </h4>
          <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
            El centro de soporte VIP se encuentra en fase de pruebas activas. Puedes generar tickets de prueba y explorar el flujo de asistencia.
          </p>
        </div>
      </div>
      
      {/* BANNER PRINCIPAL DE SOPORTE VIP */}
      <div className="bg-gradient-to-r from-[#0A182D] via-[#102747] to-[#0A182D] border border-cyan-500/30 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 border border-cyan-400/40 rounded-2xl flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_25px_rgba(0,224,240,0.2)]">
              <Headphones size={32} />
            </div>
            <div>
              <span className="inline-block px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest mb-1">
                Centro de Atención Exclusivo Broker Desk
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                Soporte & Asistencia VIP 1 a 1
              </h2>
              <p className="text-xs text-gray-400 mt-1 max-w-xl leading-relaxed">
                Asistencia inmediata para underwriting, comisiones, subcuentas GHL o agendamiento de citas prioritarias con nuestros especialistas.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <a
              href="https://wa.me/18003605626"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              <MessageSquare size={16} />
              <span>WhatsApp VIP Directo</span>
            </a>

            <button
              onClick={() => setIsCalendarOpen(true)}
              className="w-full sm:w-auto px-5 py-3.5 bg-gradient-to-r from-cyan-400 to-blue-600 hover:opacity-90 text-black font-extrabold rounded-xl text-xs transition-opacity flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,224,240,0.2)]"
            >
              <Calendar size={16} />
              <span>Agendar Llamada GHL</span>
            </button>
          </div>
        </div>
      </div>

      {/* LÍNEAS DIRECTAS POR DEPARTAMENTO */}
      <div>
        <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Phone size={16} />
          <span>Líneas Directas de Soporte Telefónico</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* CANAL PRINCIPAL */}
          <a
            href="tel:+12013652055"
            className="bg-[#0A182D]/60 hover:bg-[#0A182D]/90 border border-cyan-500/40 hover:border-cyan-400 p-5 rounded-2xl transition-all group shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 mb-3 group-hover:bg-cyan-500/20">
                <Briefcase size={20} />
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 font-extrabold text-[9px] uppercase tracking-wider rounded">Canal Fundamental</span>
              </div>
              <h4 className="font-bold text-white text-sm">Atención Principal Brokers & Underwriting</h4>
              <p className="text-[11px] text-gray-400 mt-1">Línea directa para aprobación de casos, comisiones y consultas urgentes</p>
            </div>
            <p className="text-xs font-mono font-bold text-cyan-400 mt-4 pt-3 border-t border-gray-800/80">
              +1 (201) 365-2055
            </p>
          </a>

          {/* CANAL SECUNDARIO */}
          <a
            href="tel:+19172845636"
            className="bg-[#0A182D]/60 hover:bg-[#0A182D]/90 border border-gray-800 hover:border-purple-500/40 p-5 rounded-2xl transition-all group shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 mb-3 group-hover:bg-purple-500/20">
                <ShieldCheck size={20} />
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 font-extrabold text-[9px] uppercase tracking-wider rounded">Canal Secundario</span>
              </div>
              <h4 className="font-bold text-white text-sm">Soporte Operativo & Asistencia GHL</h4>
              <p className="text-[11px] text-gray-400 mt-1">Asistencia de subcuentas, tickets generales y documentación</p>
            </div>
            <p className="text-xs font-mono font-bold text-purple-400 mt-4 pt-3 border-t border-gray-800/80">
              +1 (917) 284-5636
            </p>
          </a>

        </div>
      </div>

      {/* SISTEMA DE TICKETS Y PREGUNTAS FRECUENTES (GRID 2 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLUMNA IZQUIERDA: MIS TICKETS */}
        <div className="bg-[#0A182D]/40 border border-gray-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <div>
              <h3 className="text-base font-bold text-white">Tickets de Soporte Activos</h3>
              <p className="text-xs text-gray-400">Seguimiento de solicitudes enviadas al equipo E360</p>
            </div>
            <button
              onClick={() => setIsTicketModalOpen(true)}
              className="px-3.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Send size={14} />
              <span>Nuevo Ticket</span>
            </button>
          </div>

          <div className="space-y-3">
            {tickets.map((tck) => (
              <div
                key={tck.id}
                className="bg-[#05101F] border border-gray-800 rounded-2xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">{tck.id}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    En Proceso
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white">{tck.subject}</h4>
                <p className="text-[11px] text-gray-400 line-clamp-2">{tck.description}</p>
                <div className="flex items-center justify-between text-[10px] text-gray-500 pt-2 border-t border-gray-900">
                  <span>Categoría: <strong className="text-gray-300 capitalize">{tck.category}</strong></span>
                  <span>{tck.createdAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMNA DERECHA: FAQ INTERACTIVO */}
        <div className="bg-[#0A182D]/40 border border-gray-800 rounded-3xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">Preguntas Frecuentes (FAQ)</h3>
            <p className="text-xs text-gray-400">Respuestas rápidas para resolver dudas inmediatas</p>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchFaq}
              onChange={(e) => setSearchFaq(e.target.value)}
              placeholder="Buscar pregunta clave..."
              className="w-full bg-[#05101F] border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-[#05101F] border border-gray-800/80 rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 text-left font-semibold text-xs text-white flex items-center justify-between gap-3 hover:text-cyan-400 transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown size={16} className={`shrink-0 transition-transform ${isOpen ? "rotate-180 text-cyan-400" : "text-gray-500"}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-gray-300 leading-relaxed border-t border-gray-900 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* MODAL DE AGENDAMIENTO GHL CALENDAR */}
      <AnimatePresence>
        {isCalendarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCalendarOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto z-50 w-full max-w-lg max-h-[90vh] bg-[#0A182D] border border-gray-800 rounded-3xl p-6 md:p-8 overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-white">Agendar Cita de Soporte (GHL)</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Sesión de coaching o ayuda técnica 1 a 1</p>
                </div>
                <button
                  onClick={() => setIsCalendarOpen(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              {bookingSuccess ? (
                <div className="py-12 text-center space-y-3">
                  <CheckCircle2 size={48} className="mx-auto text-emerald-400 animate-bounce" />
                  <h3 className="text-lg font-bold text-white">¡Cita Agendada Exitosamente!</h3>
                  <p className="text-xs text-gray-400">Hemos enviado la confirmación y el enlace de Zoom al correo oficial de tu subcuenta.</p>
                </div>
              ) : (
                <form onSubmit={handleBookAppointment} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-300 uppercase mb-1">Seleccionar Fecha</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-300 uppercase mb-1">Horario Disponible (EST)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["09:00 AM", "10:00 AM", "11:30 AM", "02:00 PM", "03:30 PM", "04:30 PM"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSelectedTime(t)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                            selectedTime === t
                              ? "bg-cyan-500 text-black border-cyan-400 font-extrabold"
                              : "bg-[#05101F] text-gray-300 border-gray-800 hover:border-gray-700"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-300 uppercase mb-1">Tema Principal de la Sesión</label>
                    <input
                      type="text"
                      placeholder="Ej: Calificación de caso de Préstamo MCA grande..."
                      className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-800">
                    <button
                      type="button"
                      onClick={() => setIsCalendarOpen(false)}
                      className="px-4 py-2.5 text-gray-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-extrabold rounded-xl text-xs"
                    >
                      Confirmar Cita en GHL
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODAL CREAR TICKET */}
      <AnimatePresence>
        {isTicketModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTicketModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto z-50 w-full max-w-lg max-h-[90vh] bg-[#0A182D] border border-gray-800 rounded-3xl p-6 md:p-8 overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-white">Crear Ticket de Soporte</h2>
                  <p className="text-xs text-gray-400 mt-0.5">El equipo de E360 responderá a la brevedad</p>
                </div>
                <button
                  onClick={() => setIsTicketModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-300 uppercase mb-1">Asunto del Ticket *</label>
                  <input
                    type="text"
                    required
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="Ej: Dudas sobre depósito de comisión..."
                    className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-300 uppercase mb-1">Categoría</label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value as any)}
                      className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="commission">Comisiones</option>
                      <option value="underwriting">Underwriting / Requisitos</option>
                      <option value="ghl_crm">GoHighLevel CRM</option>
                      <option value="general">Consulta General</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-300 uppercase mb-1">Prioridad</label>
                    <select
                      value={ticketPriority}
                      onChange={(e) => setTicketPriority(e.target.value as any)}
                      className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta / Urgente</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 uppercase mb-1">Descripción de la Solicitud *</label>
                  <textarea
                    rows={4}
                    required
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                    placeholder="Explica en detalle tu consulta o inconveniente..."
                    className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsTicketModalOpen(false)}
                    className="px-4 py-2.5 text-gray-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-cyan-500 text-black font-extrabold rounded-xl text-xs"
                  >
                    Enviar Ticket
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
