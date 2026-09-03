"use client";

import { useState, useMemo } from "react";
import { Search, Mail, Phone, CheckCircle2, Loader2, Send, X, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { OnboardingStage } from "../../types";

export interface BrokerItem {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  tier: string;
  role: string;
  ghlConnected: boolean;
  ghlLocationId: string;
  onboardingStage?: OnboardingStage;
  packagePaid?: boolean;
  createdAt: string;
  totalClients: number;
  totalVolume: number;
  pendingSyncCount: number;
}

interface AdminBrokersTabProps {
  brokers: BrokerItem[];
  loading: boolean;
  onRefresh: () => void;
}

const STAGE_LABELS: Record<OnboardingStage, string> = {
  ventas: "Ventas",
  onboarding_basico: "Onboarding Básico",
  onboarding_crm: "Onboarding CRM",
  redes_sociales: "Redes Sociales",
  completado: "Completado"
};

const STAGE_OPTIONS = Object.keys(STAGE_LABELS) as OnboardingStage[];

export default function AdminBrokersTab({ brokers, loading, onRefresh }: AdminBrokersTabProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState<string>("");
  const [pendingUid, setPendingUid] = useState<string | null>(null);
  const [messageTarget, setMessageTarget] = useState<BrokerItem | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [actionError, setActionError] = useState("");

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return brokers;
    const q = search.toLowerCase();
    return brokers.filter(
      (b) =>
        b.displayName.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        b.uid.toLowerCase().includes(q) ||
        b.tier.toLowerCase().includes(q)
    );
  }, [brokers, search]);

  const callOnboardingAction = async (brokerId: string, payload: Record<string, unknown>) => {
    if (!user) return null;
    const token = await user.getIdToken();
    const res = await fetch("/api/admin/brokers/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ brokerId, ...payload })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al procesar la acción");
    return data;
  };

  const handleStageChange = async (brokerId: string, stage: OnboardingStage) => {
    setActionError("");
    setPendingUid(brokerId);
    try {
      await callOnboardingAction(brokerId, { action: "advance_stage", stage });
      onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setPendingUid(null);
    }
  };

  const handleCheckPayment = async (brokerId: string) => {
    setActionError("");
    setPendingUid(brokerId);
    try {
      await callOnboardingAction(brokerId, { action: "check_payment" });
      onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setPendingUid(null);
    }
  };

  const handleSendMessage = async () => {
    if (!messageTarget || !messageText.trim()) return;
    setIsSendingMessage(true);
    setActionError("");
    try {
      await callOnboardingAction(messageTarget.uid, { action: "send_message", message: messageText.trim() });
      setMessageSent(true);
      setTimeout(() => {
        setMessageTarget(null);
        setMessageText("");
        setMessageSent(false);
      }, 1800);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar broker por nombre, email o tier..."
            className="w-full bg-[#05101F] border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <p className="text-xs text-gray-400 self-end sm:self-center">
          Total: <span className="text-cyan-400 font-bold">{filtered.length}</span> brokers
        </p>
      </div>

      {actionError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">{actionError}</div>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm flex items-center justify-center gap-3">
          <Loader2 size={18} className="animate-spin text-cyan-400" />
          <span>Cargando lista de brokers...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-gray-500 bg-[#0A182D]/40 border border-gray-800 rounded-2xl">
          No se encontraron brokers registrados.
        </div>
      ) : (
        <div className="bg-[#0A182D]/50 border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#05101F] text-gray-400 uppercase font-mono text-[10px] tracking-wider border-b border-gray-800">
                <tr>
                  <th className="p-4">Broker / Contacto</th>
                  <th className="p-4">Tier & Rol</th>
                  <th className="p-4">Etapa de Onboarding</th>
                  <th className="p-4">Pago $750</th>
                  <th className="p-4 text-center">Clientes</th>
                  <th className="p-4 text-right">Volumen</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filtered.map((b) => (
                  <tr key={b.uid} className="hover:bg-[#05101F]/80 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-white text-sm">{b.displayName}</p>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Mail size={12} /> {b.email || "(sin email)"}
                      </p>
                      {b.phone && (
                        <p className="text-[11px] text-gray-500 flex items-center gap-1">
                          <Phone size={12} /> {b.phone}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="inline-block px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-md font-bold text-[10px]">
                        {b.tier}
                      </span>
                      {b.role === "admin" && (
                        <span className="ml-1 inline-block px-1.5 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-[9px] font-bold">
                          ADMIN
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <select
                        value={b.onboardingStage || "ventas"}
                        disabled={pendingUid === b.uid}
                        onChange={(e) => handleStageChange(b.uid, e.target.value as OnboardingStage)}
                        className="bg-[#05101F] border border-gray-700 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                      >
                        {STAGE_OPTIONS.map((stage) => (
                          <option key={stage} value={stage}>{STAGE_LABELS[stage]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">
                      {b.packagePaid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-md text-[10px] font-bold">
                          <CheckCircle2 size={12} /> Pagado
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCheckPayment(b.uid)}
                          disabled={pendingUid === b.uid}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-md text-[10px] font-bold disabled:opacity-50"
                        >
                          {pendingUid === b.uid ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                          Verificar
                        </button>
                      )}
                    </td>
                    <td className="p-4 text-center font-bold text-white text-sm">
                      {b.totalClients}
                      {b.pendingSyncCount > 0 && (
                        <span className="block text-[10px] text-amber-400 font-mono">({b.pendingSyncCount} pend.)</span>
                      )}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-emerald-400 text-sm">
                      {formatMoney(b.totalVolume)}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setMessageTarget(b)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-[10px] font-bold transition-colors"
                      >
                        <Send size={12} />
                        Mensaje
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {messageTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0A182D] border border-gray-800 rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Enviar Mensaje</h3>
                <p className="text-xs text-gray-400 mt-1">{messageTarget.displayName} — {messageTarget.email}</p>
              </div>
              <button onClick={() => { setMessageTarget(null); setMessageText(""); setActionError(""); }} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={4}
                placeholder="Ej: Hola, aquí tienes el enlace para agendar tu cita de Onboarding Básico: https://..."
                className="w-full px-4 py-3 bg-[#05101F] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none resize-none text-sm"
              />
              <p className="text-[11px] text-gray-500">
                Se envía por correo y como notificación dentro del Hub — útil para compartir el enlace de agenda vigente.
              </p>

              {actionError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">{actionError}</div>
              )}
              {messageSent && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400">
                  ✓ Mensaje enviado.
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setMessageTarget(null); setMessageText(""); setActionError(""); }}
                  disabled={isSendingMessage}
                  className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={isSendingMessage || !messageText.trim()}
                  className="flex-1 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSendingMessage ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
