"use client";

import { useState, useEffect } from "react";
import { Search, ChevronDown, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

interface FaqItem {
  category: string;
  q: string;
  a: string;
}

interface FAQSectionProps {
  onAskAI: (question: string) => void;
}

function inferCategory(question: string): string {
  const q = question.toLowerCase();
  if (q.includes("crm") || q.includes("hub") || q.includes("plataforma") || q.includes("sync")) return "CRM & Plataforma";
  if (q.includes("comision") || q.includes("pago") || q.includes("zelle") || q.includes("ach")) return "Comisiones";
  if (q.includes("seguro") || q.includes("poliza") || q.includes("cotizacion")) return "Seguros";
  if (q.includes("credito") || q.includes("fico") || q.includes("score") || q.includes("reparacion")) return "Crédito & Fondeo";
  if (q.includes("llc") || q.includes("empresa") || q.includes("incorporacion") || q.includes("ein")) return "Corporativo";
  if (q.includes("impuesto") || q.includes("tax") || q.includes("itin")) return "Taxes & Inmigración";
  if (q.includes("marketing") || q.includes("publicidad") || q.includes("post")) return "Marketing";
  return "General";
}

export default function FAQSection({ onAskAI }: FAQSectionProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [faqsData, setFaqsData] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchFaqs = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/support/faqs", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Error al cargar FAQs");
        const data = await res.json();
        const items: FaqItem[] = (data.faqs || []).map((f: { question?: string; answer?: string; category?: string }) => ({
          category: f.category || inferCategory(f.question || ""),
          q: f.question || "",
          a: f.answer || ""
        }));
        setFaqsData(items);
      } catch (err) {
        console.error("Error cargando FAQs:", err);
        setError("No se pudieron cargar las FAQs. Intenta recargar la página.");
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, [user]);

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

      {error && (
        <div className="max-w-2xl mx-auto p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 text-center">
          {error}
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-3 pt-4">
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Cargando preguntas frecuentes...
          </div>
        ) : filteredFaqs.length > 0 ? (
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
            <p className="text-gray-400 text-sm mb-4">No encontramos respuestas exactas para &quot;{search}&quot;.</p>
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
