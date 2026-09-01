"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Send, Sparkles, ArrowUpRight, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  sources?: string[];
  suggestEscalation?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "¿Qué documentos necesita un cliente para MCA?",
  "¿Cómo funciona la reparación de crédito?",
  "¿Cuándo recibo mis comisiones?",
  "¿Cómo configuro mi subcuenta CRM?",
];

interface AIChatWidgetProps {
  onEscalate: (context: string, conversationId: string | null) => void;
}

export default function AIChatWidget({ onEscalate }: AIChatWidgetProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || !user) return;
    
    const newMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text,
          conversationId,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        let parsedError = "Error en la respuesta del asistente";
        try {
          const errObj = JSON.parse(errorText);
          parsedError = errObj.error || parsedError;
        } catch {
          // Si no era JSON, usar texto por defecto
        }
        throw new Error(parsedError);
      }

      const data = await res.json();

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources,
          suggestEscalation: data.suggestEscalation,
        },
      ]);
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "Hubo un error de conexión con el asistente. Por favor, intenta de nuevo.";
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: errMsg,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#0A182D]/60 border border-gray-800 rounded-3xl flex flex-col h-[600px] overflow-hidden shadow-2xl relative">
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
      
      {/* Header */}
      <div className="p-5 border-b border-gray-800/80 bg-[#05101F]/80 flex items-center gap-4 z-10">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(0,224,240,0.2)]">
          <Bot size={22} />
        </div>
        <div>
          <h3 className="font-extrabold text-white text-base flex items-center gap-2">
            Asistente IA E360
            <span className="bg-cyan-500/20 text-cyan-400 text-[9px] px-2 py-0.5 rounded-full border border-cyan-500/30 uppercase tracking-widest">En Línea</span>
          </h3>
          <p className="text-xs text-gray-400">Respuestas inmediatas sobre servicios, CRM y comisiones</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400 flex items-center justify-center shadow-[0_0_25px_rgba(0,224,240,0.15)]">
              <Sparkles size={32} />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-bold text-white">¿En qué puedo ayudarte hoy?</h4>
              <p className="text-xs text-gray-400 max-w-sm">
                Soy tu asistente especializado en el catálogo de servicios E360, configuraciones de StartPoint CRM y políticas de comisiones.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg mt-4">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  className="p-3 text-left bg-[#05101F] hover:bg-gray-800/80 border border-gray-800/80 hover:border-cyan-500/40 rounded-xl text-xs text-gray-300 hover:text-white transition-all shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={i}
                className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
              >
                {msg.role !== "system" && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "user" ? "bg-blue-600/20 text-blue-400" : "bg-cyan-500/20 text-cyan-400"
                  }`}>
                    {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                  </div>
                )}
                
                <div className={`space-y-2 ${msg.role === "user" ? "text-right" : ""}`}>
                  <div className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user" 
                      ? "bg-blue-600/20 border border-blue-500/30 text-white rounded-tr-sm" 
                      : msg.role === "system"
                        ? "bg-red-500/10 border border-red-500/30 text-red-400 text-xs w-full text-center"
                        : "bg-[#05101F] border border-gray-800 text-gray-300 rounded-tl-sm shadow-sm"
                  }`}>
                    {msg.content}
                  </div>
                  
                  {/* Fuentes citadas */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.sources.map((src, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-gray-800/60 border border-gray-700 rounded-md text-[9px] font-mono text-gray-400">
                          {src}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Sugerencia de Escalación */}
                  {msg.suggestEscalation && (
                    <div className="mt-3">
                      <button
                        onClick={() => onEscalate(messages.map(m => `${m.role}: ${m.content}`).join('\n'), conversationId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-bold transition-colors"
                      >
                        <AlertCircle size={14} />
                        Escalar a un Agente Humano
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                  <Bot size={14} />
                </div>
                <div className="p-4 rounded-2xl bg-[#05101F] border border-gray-800 rounded-tl-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-[#05101F]/90 border-t border-gray-800/80 z-10">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Escribe tu consulta aquí..."
            className="w-full bg-[#0A182D] border border-gray-800 rounded-xl py-3.5 pl-4 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 shadow-inner disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
