"use client";

import {
  Headphones,
  ClipboardList,
  UserPlus,
  RefreshCw,
  Megaphone,
  Landmark,
  Home,
  Calculator,
  Phone,
  MessageSquare,
  Ticket,
  Calendar,
  Video,
  ExternalLink,
  ArrowRight,
  Building2,
  Star,
  BarChart3,
  GraduationCap,
  Wallet
} from "lucide-react";

interface DepartmentCardsProps {
  onOpenTicket: (category: string) => void;
  onNavigateToServices: () => void;
}

type Channel = "sms" | "wa";

interface Department {
  id: string;
  name: string;
  title: string;
  desc: string;
  phone: string;
  digits: string;
  primaryChannel: Channel;
  extraAction?: { label: string; href: string; icon: typeof Calendar };
  schedule?: string[];
  icon: typeof Headphones;
  color: "cyan" | "purple" | "emerald" | "amber" | "indigo" | "pink" | "blue" | "orange";
}

// Directorio oficial "Emprende 360 — Contactos por Departamento" (uso exclusivo de brokers).
const departments: Department[] = [
  {
    id: "general",
    name: "Mario",
    title: "Servicio al Cliente",
    desc: "Primer filtro de soporte para dudas de plataforma, técnicas y seguimiento general.",
    phone: "+1 (681) 236-1239",
    digits: "16812361239",
    primaryChannel: "sms",
    schedule: ["Lunes 9am – 6pm", "Mar – Vie 9am – 10pm", "Sábado 10am – 4pm"],
    icon: Headphones,
    color: "cyan"
  },
  {
    id: "aplicaciones",
    name: "Anthony",
    title: "Departamento de Aplicaciones",
    desc: "Atención exclusiva para estatus de aplicaciones financieras, underwriting y comisiones.",
    phone: "+1 (747) 966-4788",
    digits: "17479664788",
    primaryChannel: "sms",
    icon: ClipboardList,
    color: "purple"
  },
  {
    id: "induccion",
    name: "Laura",
    title: "Departamento de Inducción",
    desc: "Onboarding de nuevos brokers y dudas sobre el proceso de bienvenida.",
    phone: "+1 (775) 369-4853",
    digits: "17753694853",
    primaryChannel: "sms",
    icon: UserPlus,
    color: "indigo"
  },
  {
    id: "crm_credito",
    name: "Fernando",
    title: "CRM & Reparación de Crédito",
    desc: "Soporte técnico de StartPoint CRM y dudas sobre el proceso de Reparación de Crédito.",
    phone: "+1 (201) 365-2055",
    digits: "12013652055",
    primaryChannel: "sms",
    icon: RefreshCw,
    color: "blue"
  },
  {
    id: "mercadeo",
    name: "Samantha",
    title: "Departamento de Mercadeo",
    desc: "Material promocional, campañas y solicitudes de marketing.",
    phone: "+1 (786) 481-0166",
    digits: "17864810166",
    primaryChannel: "sms",
    icon: Megaphone,
    color: "pink"
  },
  {
    id: "prestamos_info",
    name: "JP",
    title: "Información de Préstamos",
    desc: "Consultas generales sobre productos de financiamiento. Solo por WhatsApp.",
    phone: "+1 (862) 424-4738",
    digits: "18624244738",
    primaryChannel: "wa",
    icon: Landmark,
    color: "amber"
  },
  {
    id: "hipotecarios",
    name: "Pete",
    title: "Préstamos Hipotecarios",
    desc: "Consultas sobre préstamos hipotecarios y bienes raíces. Envía texto antes de llamar.",
    phone: "+1 (732) 362-1347",
    digits: "17323621347",
    primaryChannel: "sms",
    extraAction: {
      label: "Agendar Llamada",
      href: "https://api.leadconnectorhq.com/widget/booking/DbvDERXMrAKQIURAyumH",
      icon: Calendar
    },
    icon: Home,
    color: "orange"
  },
  {
    id: "taxes_legal",
    name: "Valentina",
    title: "Impuestos & Inmigración",
    desc: "Gestiones fiscales, declaraciones y trámites migratorios con citas personalizadas.",
    phone: "+1 (908) 733-2891",
    digits: "19087332891",
    primaryChannel: "wa",
    extraAction: {
      label: "Unirse al Zoom",
      href: "https://meet.google.com/gbk-bzki-kcd?pli=1",
      icon: Video
    },
    schedule: ["Zoom abierto Lun – Vie, 10am – 6pm"],
    icon: Calculator,
    color: "emerald"
  }
];

interface Resource {
  id: string;
  label: string;
  desc: string;
  icon: typeof Star;
  action: { type: "internal" } | { type: "external"; href: string };
}

// "Formularios y Recursos" del mismo directorio. Los que ya son servicios nativos del Hub
// (con formulario propio que sincroniza a GHL) navegan a Inicio/Servicios en vez de salir
// a un link externo viejo.
const resources: Resource[] = [
  { id: "business-loan", label: "Préstamos de Negocios", desc: "Aplicación en línea — ve a Inicio / Servicios", icon: Building2, action: { type: "internal" } },
  { id: "credit-repair", label: "Reparación de Crédito", desc: "Comenzar proceso — ve a Inicio / Servicios", icon: Star, action: { type: "internal" } },
  { id: "incorporation", label: "Registro de Compañía", desc: "Formulario de inscripción — ve a Inicio / Servicios", icon: ClipboardList, action: { type: "internal" } },
  {
    id: "credit-report",
    label: "Reporte de Crédito Personal",
    desc: "Ver perfil de crédito (IdentityIQ)",
    icon: BarChart3,
    action: { type: "external", href: "https://member.identityiq.com/sc-securepreferred.aspx?offercode=43128078" }
  },
  { id: "personal-loan", label: "Préstamos Personales", desc: "Aplicar ahora — ve a Inicio / Servicios", icon: Wallet, action: { type: "internal" } },
  {
    id: "banks",
    label: "Plataforma de Bancos",
    desc: "Lista de bancos disponibles",
    icon: Landmark,
    action: { type: "external", href: "https://docs.google.com/spreadsheets/d/1-aNKno39Klfz2epZLE2mUjYRNYv_tVB63qGvGyoCK6E/edit?gid=828467088#gid=828467088" }
  },
  { id: "mortgage-loan", label: "Préstamos Hipotecarios", desc: "Información y proceso — ve a Inicio / Servicios", icon: Home, action: { type: "internal" } },
  { id: "e360-library", label: "E360 Library", desc: "Acceso al curso", icon: GraduationCap, action: { type: "external", href: "https://e360library.com" } },
  {
    id: "zoom-taxes",
    label: "Zoom — Impuestos & Inmigración",
    desc: "Lun – Vie 10am – 6pm",
    icon: Video,
    action: { type: "external", href: "https://meet.google.com/gbk-bzki-kcd?pli=1" }
  }
];

const getColorClasses = (color: Department["color"]) => {
  switch (color) {
    case "cyan": return { chip: "bg-cyan-500/10 text-cyan-400", border: "border-cyan-500/40 hover:border-cyan-400", iconBg: "group-hover:bg-cyan-500/20" };
    case "purple": return { chip: "bg-purple-500/10 text-purple-400", border: "border-purple-500/40 hover:border-purple-400", iconBg: "group-hover:bg-purple-500/20" };
    case "emerald": return { chip: "bg-emerald-500/10 text-emerald-400", border: "border-emerald-500/40 hover:border-emerald-400", iconBg: "group-hover:bg-emerald-500/20" };
    case "amber": return { chip: "bg-amber-500/10 text-amber-400", border: "border-amber-500/40 hover:border-amber-400", iconBg: "group-hover:bg-amber-500/20" };
    case "indigo": return { chip: "bg-indigo-500/10 text-indigo-400", border: "border-indigo-500/40 hover:border-indigo-400", iconBg: "group-hover:bg-indigo-500/20" };
    case "pink": return { chip: "bg-pink-500/10 text-pink-400", border: "border-pink-500/40 hover:border-pink-400", iconBg: "group-hover:bg-pink-500/20" };
    case "blue": return { chip: "bg-blue-500/10 text-blue-400", border: "border-blue-500/40 hover:border-blue-400", iconBg: "group-hover:bg-blue-500/20" };
    case "orange": return { chip: "bg-orange-500/10 text-orange-400", border: "border-orange-500/40 hover:border-orange-400", iconBg: "group-hover:bg-orange-500/20" };
  }
};

export default function DepartmentCards({ onOpenTicket, onNavigateToServices }: DepartmentCardsProps) {
  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Phone size={16} className="text-cyan-400" />
          <span>Líneas Directas por Departamento</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {departments.map((dep) => {
            const Icon = dep.icon;
            const colors = getColorClasses(dep.color);
            const ExtraIcon = dep.extraAction?.icon;

            return (
              <div key={dep.id} className={`bg-[#0A182D]/60 hover:bg-[#0A182D]/90 border p-5 rounded-2xl transition-all group shadow-sm flex flex-col justify-between ${colors.border}`}>
                <div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${colors.chip} ${colors.iconBg}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`px-2 py-0.5 rounded font-extrabold text-[9px] uppercase tracking-wider ${colors.chip}`}>
                      {dep.name}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm mt-2">{dep.title}</h4>
                  <p className="text-[11px] text-gray-400 mt-1 mb-2">{dep.desc}</p>

                  {dep.schedule && (
                    <div className="bg-[#05101F] border border-cyan-500/20 rounded-xl p-2.5 space-y-1 mb-3">
                      {dep.schedule.map((s, idx) => (
                        <p key={idx} className="text-[10px] font-mono text-cyan-300 font-bold">⏰ {s}</p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-3 border-t border-gray-800/80">
                  {dep.extraAction && ExtraIcon && (
                    <a
                      href={dep.extraAction.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg text-xs font-extrabold transition-colors shadow-sm"
                    >
                      <ExtraIcon size={14} /> {dep.extraAction.label}
                    </a>
                  )}
                  <div className="flex gap-2">
                    {dep.primaryChannel === "wa" ? (
                      <a
                        href={`https://wa.me/${dep.digits}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold transition-colors"
                      >
                        <MessageSquare size={14} /> WhatsApp
                      </a>
                    ) : (
                      <a
                        href={`sms:${dep.digits}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg text-xs font-extrabold transition-colors shadow-sm"
                      >
                        <MessageSquare size={14} /> Enviar SMS
                      </a>
                    )}
                    <button
                      onClick={() => onOpenTicket(dep.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-bold transition-colors"
                    >
                      <Ticket size={14} /> Ticket
                    </button>
                  </div>
                  <a href={`tel:${dep.digits}`} className={`block text-xs font-mono font-bold text-center hover:underline ${colors.chip.split(" ")[1]}`}>
                    {dep.phone}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
          <ExternalLink size={16} className="text-cyan-400" />
          <span>Formularios y Recursos</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {resources.map((res) => {
            const Icon = res.icon;
            const content = (
              <>
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{res.label}</p>
                  <p className="text-[11px] text-gray-400 truncate">{res.desc}</p>
                </div>
                <ArrowRight size={16} className="text-gray-500 shrink-0" />
              </>
            );

            return res.action.type === "internal" ? (
              <button
                key={res.id}
                onClick={onNavigateToServices}
                className="flex items-center gap-3 bg-[#0A182D]/60 hover:bg-[#0A182D]/90 border border-gray-800 hover:border-cyan-500/40 p-4 rounded-2xl transition-all text-left"
              >
                {content}
              </button>
            ) : (
              <a
                key={res.id}
                href={res.action.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-[#0A182D]/60 hover:bg-[#0A182D]/90 border border-gray-800 hover:border-cyan-500/40 p-4 rounded-2xl transition-all"
              >
                {content}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
