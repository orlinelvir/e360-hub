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
  Calculator,
  ShieldCheck,
  Wallet,
  Clock,
  ExternalLink,
} from "lucide-react";
import {
  TAX_AI_BLOCK,
  TAX_BANK_SECTION,
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
  Calculator,
  LayoutDashboard,
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
    ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-black px-8 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all hover:scale-105 shadow-[0_0_20px_rgba(0,224,240,0.3)] cursor-pointer"
    : "border border-gray-700 text-white px-8 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 hover:border-cyan-400/60 hover:text-cyan-300 active:scale-95 transition-all cursor-pointer";
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
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-400 text-black text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest shadow-md">
          Más Popular
        </span>
      )}
      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
      <p className="text-sm text-gray-400 mt-1">{plan.tagline}</p>

      <div className="mt-6 mb-6">
        {plan.price === null ? (
          <span className="inline-block text-sm font-semibold text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 px-3.5 py-1.5 rounded-lg">
            Tarifa de temporada por confirmar
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
          className="mt-8 text-center font-semibold py-3 rounded-lg border border-dashed border-gray-700 text-gray-500 cursor-not-allowed text-sm"
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
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-3">
          {TAX_TRUST_BADGES.map((badge) => (
            <div
              key={badge}
              className="flex items-center gap-2 bg-[#0A182D] border border-gray-800 rounded-xl px-4 py-3 text-xs md:text-sm text-gray-300 font-medium"
            >
              <CircleCheck size={16} className="text-cyan-400 shrink-0" />
              <span>{badge}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ASISTENTE DE IA & PRIVACIDAD ESTRICTA */}
      <section className="relative z-10 px-6 py-16 bg-[#030812] border-y border-gray-800/50">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="bg-gradient-to-r from-[#0A182D] to-[#05101F] border border-cyan-500/30 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row gap-10 items-center">
            <div className="md:w-3/5">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400 mb-4">
                <Sparkles size={14} /> {TAX_AI_BLOCK.eyebrow}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{TAX_AI_BLOCK.title}</h2>
              <p className="text-gray-300 leading-relaxed mb-6">{TAX_AI_BLOCK.description}</p>
              
              <div className="flex flex-wrap gap-2">
                {TAX_AI_BLOCK.documents.map((doc) => (
                  <span
                    key={doc}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#05101F] border border-gray-700 text-xs font-semibold text-gray-200"
                  >
                    <FileText size={14} className="text-cyan-400" /> {doc}
                  </span>
                ))}
              </div>
            </div>

            <div className="md:w-2/5 space-y-4">
              <div className="p-5 rounded-2xl bg-[#05101F] border border-cyan-500/40">
                <div className="flex items-center gap-3 mb-2 text-cyan-300 font-bold text-sm">
                  <ShieldCheck size={18} className="text-cyan-400" />
                  <span>Seguridad de Datos de tus Clientes</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {TAX_AI_BLOCK.privacyGuarantee}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#05101F] border border-blue-500/30">
                <div className="flex items-center gap-3 mb-2 text-blue-300 font-bold text-sm">
                  <ScanLine size={18} className="text-blue-400" />
                  <span>Control Humano en Todo Momento</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {TAX_AI_BLOCK.humanOversight}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTOS BANCARIOS Y ADELANTOS DE REEMBOLSO */}
      <section className="relative z-10 px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-cyan-400 font-bold uppercase tracking-widest text-xs mb-3 block">
            {TAX_BANK_SECTION.eyebrow}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {TAX_BANK_SECTION.title}
          </h2>
          <p className="text-gray-400 max-w-3xl mx-auto leading-relaxed">
            {TAX_BANK_SECTION.subtitle}
          </p>
        </div>

        {/* 3 Beneficios bancarios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {TAX_BANK_SECTION.highlights.map((h, idx) => (
            <div
              key={h.title}
              className="bg-[#0A182D] border border-gray-800 rounded-2xl p-6 relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-700 flex items-center justify-center text-cyan-400 mb-5">
                {idx === 0 && <Clock size={22} />}
                {idx === 1 && <Wallet size={22} />}
                {idx === 2 && <Landmark size={22} />}
              </div>
              <h3 className="font-bold text-lg text-white mb-2">{h.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{h.desc}</p>
            </div>
          ))}
        </div>

        {/* Bancos aliados */}
        <div className="bg-[#030812] border border-gray-800/80 rounded-3xl p-8">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 text-center mb-6">
            Bancos Fiscales Integrados en la Plataforma
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {TAX_BANK_SECTION.partners.map((p) => (
              <a
                key={p.name}
                href={p.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col justify-between p-4 rounded-xl bg-[#0A182D] border border-gray-800 hover:border-cyan-500/50 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                    <span>{p.name}</span>
                    <ExternalLink size={12} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2 leading-tight">{p.tagline}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FUNCIONES COMPLETAS (CORE FEATURES) */}
      <section className="relative z-10 px-6 py-20 bg-[#030812] border-y border-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Todo lo que necesita una oficina de taxes moderna</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Una plataforma integral pensada para optimizar cada etapa del flujo de trabajo de tu equipo.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {TAX_FEATURES.map((feature, i) => {
              const Icon = FEATURE_ICONS[feature.icon];
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 5) * 0.06 }}
                  className="bg-[#0A182D] border border-gray-800 rounded-2xl p-6 hover:border-cyan-500/40 transition-all group relative flex flex-col justify-between"
                >
                  <div>
                    {feature.badge && (
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 px-2 py-0.5 rounded mb-4">
                        {feature.badge}
                      </span>
                    )}
                    <div className="w-12 h-12 bg-gray-900 border border-gray-700 rounded-xl flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-110 transition-transform">
                      <Icon size={22} />
                    </div>
                    <h3 className="font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FORMULARIOS Y NOVEDADES TRIBUTARIAS */}
      <section className="relative z-10 px-6 py-20 max-w-6xl mx-auto">
        <div className="bg-[#0A182D] border border-gray-800 rounded-3xl p-8 md:p-12 space-y-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Formularios y Cobertura Tributaria Completa</h2>
            <p className="text-gray-400 leading-relaxed">{TAX_FORMS.note}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">Individuales (1040 Series)</h3>
              <div className="flex flex-wrap gap-2">
                {TAX_FORMS.individual.map((form) => (
                  <span key={form} className="px-3 py-1.5 rounded-lg bg-[#05101F] border border-gray-700 text-xs font-mono">
                    {form}
                  </span>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">Corporativos y Negocios</h3>
              <div className="flex flex-wrap gap-2">
                {TAX_FORMS.business.map((form) => (
                  <span key={form} className="px-3 py-1.5 rounded-lg bg-[#05101F] border border-gray-700 text-xs font-mono">
                    {form}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Actualizaciones tributarias 2025/2026 */}
          <div className="p-6 rounded-2xl bg-[#05101F] border border-cyan-500/30">
            <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-300 mb-4 flex items-center gap-2">
              <Sparkles size={16} /> Actualizado para la Temporada Fiscal Vigente
            </h3>
            <ul className="space-y-2">
              {TAX_FORMS.updates2025.map((up) => (
                <li key={up} className="flex items-start gap-2 text-xs md:text-sm text-gray-300">
                  <CircleCheck size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span>{up}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* PLANES */}
      <section id="planes" className="relative z-10 px-6 py-20 bg-[#030812] border-y border-gray-800/50 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Modalidades de la Temporada</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Elige la modalidad que se ajusta a tu oficina.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TAX_PLANS.map((plan, i) => (
              <PlanCard key={plan.id} plan={plan} index={i} />
            ))}
          </div>
          <div className="mt-10 bg-[#0A182D] border border-gray-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">
              Todas las modalidades incluyen de fábrica
            </h3>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TAX_PLAN_COMMON.map((item) => (
                <li key={item} className="flex gap-2 text-xs md:text-sm text-gray-300">
                  <CircleCheck size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
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
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">Preguntas Frecuentes</h2>
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
