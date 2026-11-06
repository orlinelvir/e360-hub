"use client";

import { motion } from "framer-motion";
import {
  Megaphone,
  GraduationCap,
  FileText,
  PlayCircle,
  ExternalLink,
  Copy,
  Check,
  Download,
  Award,
  Image as ImageIcon,
  Phone
} from "lucide-react";
import { useState } from "react";
import { GUIDES } from "@/lib/ai/guides";
import { ONBOARDING_RECAP_VIDEOS } from "@/lib/ai/videos";
import CrmQuizSection from "./quiz/CrmQuizSection";

interface ResourceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}

function ResourceCard({ icon, title, description, children }: ResourceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-[#0A182D]/60 border border-gray-800 rounded-3xl p-6 md:p-8 space-y-5"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 border border-cyan-500/20">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

interface CopyableItemProps {
  label: string;
  content: string;
}

function CopyableItem({ label, content }: CopyableItemProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#05101F] border border-gray-800 rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-wider">{label}</span>
        <button
          onClick={handleCopy}
          className="text-xs text-gray-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  );
}

const POST_TEMPLATES = [
  {
    title: "Préstamo de Negocio",
    content: "¿Tu negocio necesita capital para crecer? 🚀 Ayudo a dueños de negocios a obtener préstamos empresariales de $10,000 a $500,000+ con mínima documentación. Sin costo por consulta. Escríbeme al DM o al 📞 [tu teléfono]."
  },
  {
    title: "Reparación de Crédito",
    content: "¿Tu puntaje de crédito te está costando dinero? 💳 Ayudo a remover cuentas negativas de tu reporte usando la ley FCRA. Resultados en 30-45 días. Consulta gratuita. 📞 [tu teléfono]"
  },
  {
    title: "Seguros",
    content: "¿Buscas seguro de auto, casa o negocio? 🛡️ Cotizo con múltiples aseguradoras para conseguirte la mejor cobertura al mejor precio. Sin compromiso. Escríbeme al DM."
  }
];

const SALES_SCRIPTS = [
  {
    title: "Apertura en frío (llamada)",
    content: `"Hola [nombre], soy [tu nombre], broker financiero con E360. Te llamo porque ayudo a dueños de negocio como tú a conseguir capital de trabajo sin las complicaciones de los bancos tradicionales. ¿Tienes 2 minutos para que te haga una pregunta rápida?"`
  },
  {
    title: "Cierre de cita",
    content: `"Perfecto. Lo único que necesito para darte una precalificación honesta son tus últimos 4 estados de cuenta bancarios. Podemos revisarlo en una llamada de 10 minutos. ¿Te funciona mañana a las [hora] o pasado a las [hora]?"`
  }
];

export default function ResourcesSection() {
  const [showQuiz, setShowQuiz] = useState(false);

  return (
    <div className="space-y-8">
      {showQuiz && <CrmQuizSection onClose={() => setShowQuiz(false)} />}
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#0A182D] via-[#102747] to-[#0A182D] border border-cyan-500/30 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 border border-cyan-400/40 rounded-2xl flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_25px_rgba(0,224,240,0.2)]">
              <Megaphone size={32} />
            </div>
            <div>
              <span className="inline-block px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest mb-1">
                Centro de Recursos
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                Marketing & Capacitación
              </h2>
              <p className="text-xs text-gray-400 mt-1 max-w-xl leading-relaxed">
                Todo lo que necesitas para promocionar tus servicios y capacitarte como broker E360.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plantillas de posts */}
        <ResourceCard
          icon={<ImageIcon size={22} />}
          title="Plantillas de Redes Sociales"
          description="Copia, personaliza y publica."
        >
          <div className="space-y-3">
            {POST_TEMPLATES.map((post, idx) => (
              <CopyableItem key={idx} label={post.title} content={post.content} />
            ))}
          </div>
        </ResourceCard>

        {/* Scripts de venta */}
        <ResourceCard
          icon={<Phone size={22} />}
          title="Scripts de Venta"
          description="Guiones probados para abrir y cerrar conversaciones."
        >
          <div className="space-y-3">
            {SALES_SCRIPTS.map((script, idx) => (
              <CopyableItem key={idx} label={script.title} content={script.content} />
            ))}
          </div>
        </ResourceCard>

        {/* Capacitación */}
        <ResourceCard
          icon={<GraduationCap size={22} />}
          title="Capacitación E360"
          description="Accede a la biblioteca completa de entrenamientos."
        >
          <a
            href="https://e360library.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-[#05101F] border border-gray-800 hover:border-cyan-500/40 rounded-xl transition-colors group"
          >
            <div className="flex items-center gap-3">
              <PlayCircle size={20} className="text-cyan-400" />
              <div>
                <p className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">Biblioteca E360</p>
                <p className="text-[10px] text-gray-400">Videos, clases grabadas y cursos por producto</p>
              </div>
            </div>
            <ExternalLink size={16} className="text-gray-500 group-hover:text-cyan-400" />
          </a>
          <div className="text-xs text-gray-400 leading-relaxed">
            <p className="mb-2"><strong className="text-gray-300">Horarios de clases en vivo (EST):</strong></p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Lunes y Martes 7:00 PM</li>
              <li>Miércoles 12:00 PM</li>
              <li>Jueves 5:00 PM <em>(sujeto a cambios)</em></li>
              <li>Domingos 9:00 PM</li>
            </ul>
          </div>
          <button
            type="button"
            onClick={() => setShowQuiz(true)}
            className="w-full flex items-center justify-between p-4 bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-400 rounded-xl transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Award size={20} className="text-cyan-400" />
              <div className="text-left">
                <p className="text-sm font-bold text-white">Examen de Conocimiento del CRM</p>
                <p className="text-[10px] text-gray-400">Pon a prueba lo que aprendiste en tu onboarding</p>
              </div>
            </div>
          </button>
        </ResourceCard>

        {/* Guías y documentos */}
        <ResourceCard
          icon={<FileText size={22} />}
          title="Biblioteca de Guías"
          description="Descarga el material oficial del catálogo E360."
        >
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {GUIDES.map((guide) => (
              <a
                key={guide.slug}
                href={`/api/guides/${guide.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 bg-[#05101F] border border-gray-800 hover:border-cyan-500/40 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={18} className="text-cyan-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-300 group-hover:text-white truncate">{guide.title}</p>
                    <p className="text-[10px] text-gray-500 truncate">{guide.description}</p>
                  </div>
                </div>
                <Download size={14} className="text-gray-500 group-hover:text-cyan-400 shrink-0 ml-2" />
              </a>
            ))}
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            ¿Necesitas material específico que no está aquí? Abre un ticket en Soporte VIP → Marketing y Contenido.
          </p>
        </ResourceCard>

        {/* Recapitulado en video — Hub + CRM */}
        <ResourceCard
          icon={<PlayCircle size={22} />}
          title="Recapitulado: Hub + CRM"
          description="Repasa cualquier parte de tu onboarding cuando quieras."
        >
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {ONBOARDING_RECAP_VIDEOS.map((video) =>
              video.url ? (
                <a
                  key={video.slug}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 bg-[#05101F] border border-gray-800 hover:border-cyan-500/40 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <PlayCircle size={18} className="text-cyan-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-300 group-hover:text-white truncate">{video.title}</p>
                      <p className="text-[10px] text-gray-500 truncate">{video.description}</p>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-gray-500 group-hover:text-cyan-400 shrink-0 ml-2" />
                </a>
              ) : (
                <div key={video.slug} className="flex items-center justify-between p-3.5 bg-[#05101F]/60 border border-gray-800/60 rounded-xl opacity-60">
                  <div className="flex items-center gap-3 min-w-0">
                    <PlayCircle size={18} className="text-gray-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-400 truncate">{video.title}</p>
                      <p className="text-[10px] text-gray-600 truncate">{video.description}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 shrink-0 ml-2">Próximamente</span>
                </div>
              )
            )}
          </div>
        </ResourceCard>
      </div>
    </div>
  );
}
