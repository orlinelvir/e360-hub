"use client";

import { Headphones, ShieldCheck, Calculator, Briefcase, Phone, MessageSquare, Ticket } from "lucide-react";

interface DepartmentCardsProps {
  onOpenTicket: (category: string) => void;
}

export default function DepartmentCards({ onOpenTicket }: DepartmentCardsProps) {
  const departments = [
    {
      id: "general",
      name: "Fernando (Gerente General)",
      title: "Soporte General & Reparación de Crédito",
      desc: "Atención directa con Gerencia para plataforma, dudas técnicas y Reparación de Crédito.",
      schedule1: "Canal 1: 2:00 PM – 10:00 PM EST (Solo SMS)",
      schedule2: "Canal 2: 9:00 AM – 3:00 PM EST (Solo SMS)",
      phone: "+1 (681) 236-1239",
      sms: "16812361239",
      wa: null,
      icon: Headphones,
      color: "cyan"
    },
    {
      id: "commission",
      name: "Anthony Elvir",
      title: "Financiamientos & Estatus de Casos",
      desc: "Atención exclusiva para estatus de aplicaciones financieras, underwriting y comisiones.",
      phone: "+1 (747) 966-4788",
      wa: "17479664788",
      icon: ShieldCheck,
      color: "purple"
    },
    {
      id: "taxes_legal",
      name: "RL MultiServices",
      title: "Taxes & Inmigración",
      desc: "Gestiones fiscales, declaraciones y trámites migratorios con citas personalizadas.",
      phone: "+1 (908) 733-2891",
      wa: "19087332891",
      calendly: "https://calendly.com/servicios-rlhispanoservices/45min",
      icon: Calculator,
      color: "emerald"
    },
    {
      id: "underwriting",
      name: "James (Cliq Capital)",
      title: "Préstamo Negocio (< 680 FICO)",
      desc: "Underwriter James para evaluación de préstamos MCA y flujo de caja.",
      phone: "+1 (646) 472-9408",
      wa: null,
      icon: Briefcase,
      color: "amber"
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "cyan": return "bg-cyan-500/10 text-cyan-400 border-cyan-500/40 hover:border-cyan-400 group-hover:bg-cyan-500/20";
      case "purple": return "bg-purple-500/10 text-purple-400 border-purple-500/40 hover:border-purple-400 group-hover:bg-purple-500/20";
      case "emerald": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/40 hover:border-emerald-400 group-hover:bg-emerald-500/20";
      case "amber": return "bg-amber-500/10 text-amber-400 border-amber-500/40 hover:border-amber-400 group-hover:bg-amber-500/20";
      default: return "";
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Phone size={16} className="text-cyan-400" />
        <span>Líneas Directas por Departamento</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {departments.map((dep, i) => {
          const Icon = dep.icon;
          const colorClass = getColorClasses(dep.color);
          
          return (
            <div key={i} className={`bg-[#0A182D]/60 hover:bg-[#0A182D]/90 border p-5 rounded-2xl transition-all group shadow-sm flex flex-col justify-between ${colorClass.split(' ')[2]}`}>
              <div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]} ${colorClass.split(' ')[4]}`}>
                  <Icon size={20} />
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`px-2 py-0.5 rounded font-extrabold text-[9px] uppercase tracking-wider ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]}`}>
                    {dep.name}
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm mt-2">{dep.title}</h4>
                <p className="text-[11px] text-gray-400 mt-1 mb-2">{dep.desc}</p>

                {dep.schedule1 && (
                  <div className="bg-[#05101F] border border-cyan-500/20 rounded-xl p-2.5 space-y-1 mb-3">
                    <p className="text-[10px] font-mono text-cyan-300 font-bold">⏰ {dep.schedule1}</p>
                    {dep.schedule2 && (
                      <p className="text-[10px] font-mono text-cyan-400 font-bold">⏰ {dep.schedule2}</p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-2 pt-3 border-t border-gray-800/80">
                <div className="flex gap-2">
                  {dep.calendly ? (
                    <a
                      href={dep.calendly}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg text-xs font-extrabold transition-colors shadow-sm"
                    >
                      Agendar Cita
                    </a>
                  ) : dep.sms ? (
                    <a
                      href={`sms:${dep.phone.replace(/[^0-9+]/g, '')}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg text-xs font-extrabold transition-colors shadow-sm"
                    >
                      <MessageSquare size={14} /> Enviar SMS
                    </a>
                  ) : dep.wa ? (
                    <a
                      href={`https://wa.me/${dep.wa}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold transition-colors"
                    >
                      <MessageSquare size={14} /> WhatsApp
                    </a>
                  ) : (
                    <a
                      href={`tel:${dep.phone.replace(/[^0-9+]/g, '')}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold transition-colors"
                    >
                      <Phone size={14} /> Llamar
                    </a>
                  )}
                  <button
                    onClick={() => onOpenTicket(dep.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Ticket size={14} /> Ticket
                  </button>
                </div>
                <p className={`text-xs font-mono font-bold text-center ${colorClass.split(' ')[1]}`}>
                  {dep.phone}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
