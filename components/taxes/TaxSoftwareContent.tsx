"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CircleCheck,
  ChevronDown,
  FileText,
  GraduationCap,
  Headset,
  Landmark,
  Languages,
  LayoutDashboard,
  Lock,
  PenLine,
  ScanLine,
  Settings,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";
import {
  TAX_AI_BLOCK,
  TAX_FAQS,
  TAX_FEATURES,
  TAX_FORMS,
  TAX_HERO,
  TAX_OFFICE_TEASER,
  TAX_PLAN_COMMON,
  TAX_PLANS,
  TAX_SOFTWARE_CTA,
  TAX_TRAINING,
  TAX_TRUST_BADGES,
  type TaxFeature,
  type TaxPlan,
} from "@/lib/taxes/tax-software-content";

const FEATURE_ICONS: Record<TaxFeature["icon"], React.ComponentType<{ size?: number }>> = {
  ScanLine,
  Users,
  PenLine,
  Landmark,
  Smartphone,
  FileText,
  Lock,
  Languages,
};

const TRAINING_ICONS = [GraduationCap, Settings, Headset];

interface TaxSoftwareContentProps {
  /**
   * "public": página de ventas (/taxes), con espacio para el Navbar fijo.
   * "hub": pestaña dentro del Hub de brokers, sin el padding superior.
   */
  variant: "public" | "hub";
}

function formatPrice(price: number | null): string {
  if (price === null) return "Por confirmar";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Botón principal. Mientras el destino no esté definido, lleva a la sección de
 * planes en vez de a un link roto.
 */
function CtaLink({
  url,
  children,
  primary,
}: {
  url: string | null;
  children: React.ReactNode;
  primary?: boolean;
}) {
  const className = primary
    ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-black px-8 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all hover:scale-105 shadow-[0_0_20px_rgba(0,224,240,0.3)]"
    : "border border-gray-700 text-white px-8 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 hover:border-cyan-400/60 hover:text-cyan-300 active:scale-95 transition-all";
  const isExternal = url !== null;
  return (
    <a
      href={url ?? "#planes"}
      className={className}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

function PlanCard({ plan, index }: { plan: TaxPlan; index: number }) {
  const ctaReady = TAX_SOFTWARE_CTA.buyUrl !== null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className={`relative flex flex-col rounded-3xl p-8 border bg-[#0A182D] ${
        plan.featured ? "border-cyan-500/50 shadow-[0_0_40px_rgba(0,224,240,0.12)]" : "border-gray-800"
      }`}
    >
      {plan.featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-400 text-black text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest">
          Recomendado
        </span>
      )}
      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
      <p className="text-sm text-gray-500 mt-1">{plan.tagline}</p>

      <div className="mt-6 mb-6">
        {plan.price === null ? (
          <span className="inline-block text-sm font-semibold text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-lg">
            Precio por confirmar
          </span>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">{formatPrice(plan.price)}</span>
            {plan.priceNote && <span className="text-sm text-gray-500">{plan.priceNote}</span>}
          </div>
        )}
      </div>

      <ul className="space-y-3 flex-grow">
        {plan.highlights.map((item) => (
          <li key={item} className="flex gap-3 text-sm text-gray-300">
            <CircleCheck size={18} className="text-cyan-400 shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      {ctaReady ? (
        <a
          href={TAX_SOFTWARE_CTA.buyUrl ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-8 text-center font-semibold py-3 rounded-lg transition-all ${
            plan.featured
              ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-black hover:scale-[1.02]"
              : "border border-gray-700 text-white hover:border-cyan-400/60"
          }`}
        >
          Adquirir {plan.name}
        </a>
      ) : (
        <span
          aria-disabled="true"
          className="mt-8 text-center font-semibold py-3 rounded-lg border border-dashed border-gray-700 text-gray-500 cursor-not-allowed"
        >
          Disponible muy pronto
        </span>
      )}
    </motion.div>
  );
}

export default function TaxSoftwareContent({ variant }: TaxSoftwareContentProps) {
  const isPublic = variant === "public";

  return (
    <div
      className={`relative overflow-hidden text-white ${
        isPublic ? "min-h-screen bg-[#05101F]" : "rounded-3xl bg-[#05101F] border border-gray-800/60"
      }`}
    >
      {/* Resplandor de fondo */}
      <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-40 left-0 w-[400px] h-[400px] bg-cyan-400/5 blur-[120px] rounded-full pointer-events-none" />

      {/* HERO */}
      <section
        className={`px-6 relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto ${
          isPublic ? "pt-32 pb-16" : "pt-14 pb-12"
        }`}
      >
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span className="text-cyan-400 font-semibold tracking-widest uppercase text-xs mb-6 block">
            {TAX_HERO.eyebrow}
          </span>
          <h1 className={`font-bold tracking-tight mb-8 ${isPublic ? "text-5xl md:text-7xl" : "text-4xl md:text-5xl"}`}>
            {TAX_HERO.title} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-400 to-blue-600">
              {TAX_HERO.titleAccent}
            </span>
          </h1>
          <p className="text-[#A1A7B3] text-lg md:text-xl mb-10 max-w-3xl mx-auto leading-relaxed">
            {TAX_HERO.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <CtaLink url={TAX_SOFTWARE_CTA.buyUrl} primary>
              Adquirir el software <ArrowRight size={20} />
            </CtaLink>
            <CtaLink url={TAX_SOFTWARE_CTA.trialUrl}>Solicitar una demo</CtaLink>
          </div>
        </motion.div>
      </section>

      {/* BARRA DE CONFIANZA */}
      <section className="relative z-10 px-6 pb-16">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          {TAX_TRUST_BADGES.map((badge) => (
            <div
              key={badge}
              className="flex items-center gap-2 bg-[#0A182D] border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-300"
            >
              <CircleCheck size={16} className="text-cyan-400 shrink-0" />
              <span>{badge}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ASISTENTE DE IA */}
      <section className="relative z-10 px-6 py-16 bg-[#030812] border-y border-gray-800/50">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-[#0A182D] to-[#05101F] border border-cyan-500/30 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row gap-10 items-center">
          <div className="md:w-3/5">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400 mb-4">
              <Sparkles size={14} /> {TAX_AI_BLOCK.eyebrow}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{TAX_AI_BLOCK.title}</h2>
            <p className="text-gray-400 leading-relaxed">{TAX_AI_BLOCK.description}</p>
          </div>
          <div className="md:w-2/5 flex flex-wrap gap-3 justify-center">
            {TAX_AI_BLOCK.documents.map((doc) => (
              <span
                key={doc}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#05101F] border border-gray-700 text-sm font-semibold text-gray-200"
              >
                <FileText size={16} className="text-cyan-400" /> {doc}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FUNCIONES */}
      <section className="relative z-10 px-6 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Todo lo que necesita una oficina de taxes moderna</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Una sola plataforma para preparar, firmar, cobrar y transmitir.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TAX_FEATURES.map((feature, i) => {
            const Icon = FEATURE_ICONS[feature.icon];
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 4) * 0.08 }}
                className="bg-[#0A182D] border border-gray-800 rounded-2xl p-6 hover:border-cyan-500/40 transition-all group"
              >
                <div className="w-12 h-12 bg-gray-900 border border-gray-700 rounded-xl flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-110 transition-transform">
                  <Icon size={22} />
                </div>
                <h3 className="font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* FORMULARIOS */}
      <section className="relative z-10 px-6 pb-20 max-w-5xl mx-auto">
        <div className="bg-[#0A182D] border border-gray-800 rounded-3xl p-8 md:p-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Formularios incluidos</h2>
          <p className="text-gray-400 mb-8">{TAX_FORMS.note}</p>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">Individuales</h3>
              <div className="flex flex-wrap gap-2">
                {TAX_FORMS.individual.map((form) => (
                  <span key={form} className="px-3 py-1.5 rounded-lg bg-[#05101F] border border-gray-700 text-sm font-mono">
                    {form}
                  </span>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">Negocios y corporaciones</h3>
              <div className="flex flex-wrap gap-2">
                {TAX_FORMS.business.map((form) => (
                  <span key={form} className="px-3 py-1.5 rounded-lg bg-[#05101F] border border-gray-700 text-sm font-mono">
                    {form}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLANES */}
      <section id="planes" className="relative z-10 px-6 py-20 bg-[#030812] border-y border-gray-800/50 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Modalidades de la temporada</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Elige la modalidad que se ajusta a tu oficina.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TAX_PLANS.map((plan, i) => (
              <PlanCard key={plan.id} plan={plan} index={i} />
            ))}
          </div>
          <div className="mt-10 bg-[#0A182D] border border-gray-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">
              Todas las modalidades incluyen
            </h3>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TAX_PLAN_COMMON.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-gray-300">
                  <CircleCheck size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* OFICINA VIRTUAL (PRÓXIMAMENTE) */}
      <section className="relative z-10 px-6 py-20 max-w-5xl mx-auto">
        <div className="border border-dashed border-cyan-500/30 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <LayoutDashboard size={26} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1 rounded-full">
              {TAX_OFFICE_TEASER.eyebrow}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold mt-4 mb-3">{TAX_OFFICE_TEASER.title}</h2>
            <p className="text-gray-400 leading-relaxed mb-6">{TAX_OFFICE_TEASER.description}</p>
            <div className="flex flex-wrap gap-2">
              {TAX_OFFICE_TEASER.items.map((item) => (
                <span key={item} className="text-xs text-gray-300 bg-[#0A182D] border border-gray-800 px-3 py-1.5 rounded-lg">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CAPACITACIÓN Y SOPORTE */}
      <section className="relative z-10 px-6 pb-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{TAX_TRAINING.title}</h2>
          <p className="text-gray-400">{TAX_TRAINING.description}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TAX_TRAINING.items.map((item, i) => {
            const Icon = TRAINING_ICONS[i] ?? Headset;
            return (
              <div key={item.title} className="bg-[#0A182D] border border-gray-800 rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-700 flex items-center justify-center text-cyan-400 mb-5">
                  <Icon size={22} />
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* PREGUNTAS FRECUENTES */}
      <section className="relative z-10 px-6 py-20 bg-[#030812] border-t border-gray-800/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {TAX_FAQS.map((faq) => (
              <details
                key={faq.question}
                className="group bg-[#0A182D] border border-gray-800 rounded-2xl open:border-cyan-500/30"
              >
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-5 font-semibold text-white [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <ChevronDown size={18} className="text-gray-500 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="px-5 pb-5 text-sm text-gray-400 leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* LLAMADA A LA ACCIÓN FINAL */}
      <section className="relative z-10 px-6 py-20 text-center max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Prepárate para esta temporada de taxes</h2>
        <p className="text-gray-400 mb-8">
          Lleva tu oficina a la nube con el respaldo, la capacitación y el soporte de Emprende 360.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <CtaLink url={TAX_SOFTWARE_CTA.buyUrl} primary>
            Adquirir el software <ArrowRight size={20} />
          </CtaLink>
          <CtaLink url={TAX_SOFTWARE_CTA.trialUrl}>Solicitar una demo</CtaLink>
        </div>
      </section>
    </div>
  );
}
