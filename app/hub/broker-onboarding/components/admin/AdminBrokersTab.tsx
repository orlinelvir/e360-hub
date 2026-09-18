"use client";

import { useState, useMemo } from "react";
import {
  Search, Mail, Phone, CheckCircle2, Loader2, Send, X, ShieldCheck,
  Settings2, KeyRound, Lock, Unlock, AlertTriangle, RefreshCw
} from "lucide-react";
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
  referralEarnings?: number;
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

interface BrokerAuthStatus {
  disabled?: boolean;
  emailVerified?: boolean;
  creationTime?: string;
  lastSignInTime?: string | null;
  providerIds?: string[];
  notFound?: boolean;
}

interface BrokerGhlDetail {
  ghlLocationId: string;
  ghlSubaccountEmail: string;
  ghlConnected: boolean;
  ghlApiKeyPreview: string;
}

export default function AdminBrokersTab({ brokers, loading, onRefresh }: AdminBrokersTabProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState<string>("");
  const [pendingUid, setPendingUid] = useState<string | null>(null);
  const [messageTarget, setMessageTarget] = useState<BrokerItem | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [actionError, setActionError] = useState("");

  const [detailTarget, setDetailTarget] = useState<BrokerItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<BrokerAuthStatus | null>(null);
  const [ghlDetail, setGhlDetail] = useState<BrokerGhlDetail | null>(null);
  const [detailError, setDetailError] = useState("");
  const [detailNotice, setDetailNotice] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isTogglingAccount, setIsTogglingAccount] = useState(false);
  const [isVerifyingGhl, setIsVerifyingGhl] = useState(false);
  const [isSavingGhl, setIsSavingGhl] = useState(false);
  const [ghlForm, setGhlForm] = useState({ ghlLocationId: "", ghlSubaccountEmail: "", ghlApiKey: "" });

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

  const openDetail = async (broker: BrokerItem) => {
    setDetailTarget(broker);
    setDetailError("");
    setDetailNotice("");
    setAuthStatus(null);
    setGhlDetail(null);
    setDetailLoading(true);
    try {
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/brokers/onboarding?brokerId=${broker.uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar el detalle del broker");
      setAuthStatus(data.authStatus);
      setGhlDetail(data.ghl);
      setGhlForm({
        ghlLocationId: data.ghl?.ghlLocationId || "",
        ghlSubaccountEmail: data.ghl?.ghlSubaccountEmail || "",
        ghlApiKey: ""
      });
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailTarget(null);
    setAuthStatus(null);
    setGhlDetail(null);
    setDetailError("");
    setDetailNotice("");
  };

  const handleSendPasswordReset = async () => {
    if (!detailTarget) return;
    setIsSendingReset(true);
    setDetailError("");
    setDetailNotice("");
    try {
      await callOnboardingAction(detailTarget.uid, { action: "send_password_reset" });
      setDetailNotice(`Se envió un correo de reset de contraseña a ${detailTarget.email}.`);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleToggleAccountDisabled = async () => {
    if (!detailTarget || !authStatus) return;
    const nextDisabled = !authStatus.disabled;
    setIsTogglingAccount(true);
    setDetailError("");
    setDetailNotice("");
    try {
      await callOnboardingAction(detailTarget.uid, { action: "set_account_disabled", disabled: nextDisabled });
      setAuthStatus((prev) => (prev ? { ...prev, disabled: nextDisabled } : prev));
      setDetailNotice(nextDisabled ? "Cuenta deshabilitada — ya no podrá iniciar sesión." : "Cuenta habilitada de nuevo.");
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsTogglingAccount(false);
    }
  };

  const handleVerifyGhl = async () => {
    if (!detailTarget) return;
    setIsVerifyingGhl(true);
    setDetailError("");
    setDetailNotice("");
    try {
      const result = await callOnboardingAction(detailTarget.uid, { action: "verify_ghl_credentials" });
      setDetailNotice(result?.valid ? `Conexión verificada: ${result.locationName || "subcuenta OK"}.` : (result?.error || "Las credenciales no son válidas."));
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsVerifyingGhl(false);
    }
  };

  const handleSaveGhlCredentials = async () => {
    if (!detailTarget) return;
    setIsSavingGhl(true);
    setDetailError("");
    setDetailNotice("");
    try {
      const data = await callOnboardingAction(detailTarget.uid, {
        action: "update_ghl_credentials",
        ghlLocationId: ghlForm.ghlLocationId.trim(),
        ghlSubaccountEmail: ghlForm.ghlSubaccountEmail.trim(),
        ghlApiKey: ghlForm.ghlApiKey.trim()
      });
      setGhlDetail((prev) => (prev ? { ...prev, ghlLocationId: ghlForm.ghlLocationId.trim(), ghlSubaccountEmail: ghlForm.ghlSubaccountEmail.trim(), ghlConnected: Boolean(data?.ghlConnected) } : prev));
      setGhlForm((prev) => ({ ...prev, ghlApiKey: "" }));
      setDetailNotice("Credenciales de GHL actualizadas.");
      onRefresh();
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSavingGhl(false);
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString("es-US", { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return value;
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
                      {Boolean(b.referralEarnings) && (
                        <span className="block mt-1 text-[10px] text-emerald-400 font-bold">
                          Referidos: ${b.referralEarnings!.toLocaleString()}
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
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openDetail(b)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg text-[10px] font-bold transition-colors"
                        >
                          <Settings2 size={12} />
                          Detalle
                        </button>
                        <button
                          onClick={() => setMessageTarget(b)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-[10px] font-bold transition-colors"
                        >
                          <Send size={12} />
                          Mensaje
                        </button>
                      </div>
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

      {detailTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0A182D] border border-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#0A182D]">
              <div>
                <h3 className="text-lg font-bold text-white">Control Avanzado del Cliente</h3>
                <p className="text-xs text-gray-400 mt-1">{detailTarget.displayName} — {detailTarget.email}</p>
              </div>
              <button onClick={closeDetail} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {detailLoading ? (
                <div className="py-10 text-center text-gray-400 text-sm flex items-center justify-center gap-3">
                  <Loader2 size={18} className="animate-spin text-cyan-400" />
                  <span>Cargando detalle...</span>
                </div>
              ) : (
                <>
                  {detailError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">{detailError}</div>
                  )}
                  {detailNotice && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400">{detailNotice}</div>
                  )}

                  {/* Estado de la cuenta / login */}
                  <div className="bg-[#05101F] border border-gray-800 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Cuenta e Inicio de Sesión</h4>
                    {authStatus?.notFound ? (
                      <div className="flex items-center gap-2 text-amber-400 text-xs">
                        <AlertTriangle size={14} />
                        No se encontró esta cuenta en Firebase Auth — puede haber sido eliminada o el uid no coincide.
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <p className="text-gray-500">Estado: <span className={authStatus?.disabled ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>{authStatus?.disabled ? "Deshabilitada" : "Habilitada"}</span></p>
                          <p className="text-gray-500">Email verificado: <span className="text-gray-300 font-bold">{authStatus?.emailVerified ? "Sí" : "No"}</span></p>
                          <p className="text-gray-500">Creada: <span className="text-gray-300">{formatDate(authStatus?.creationTime)}</span></p>
                          <p className="text-gray-500">Último acceso: <span className="text-gray-300">{formatDate(authStatus?.lastSignInTime)}</span></p>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            onClick={handleSendPasswordReset}
                            disabled={isSendingReset}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50"
                          >
                            {isSendingReset ? <Loader2 size={13} className="animate-spin" /> : <KeyRound size={13} />}
                            Enviar reset de contraseña
                          </button>
                          <button
                            onClick={handleToggleAccountDisabled}
                            disabled={isTogglingAccount}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 border rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50 ${
                              authStatus?.disabled
                                ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30"
                            }`}
                          >
                            {isTogglingAccount ? <Loader2 size={13} className="animate-spin" /> : authStatus?.disabled ? <Unlock size={13} /> : <Lock size={13} />}
                            {authStatus?.disabled ? "Habilitar cuenta" : "Deshabilitar cuenta"}
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-500">
                          El reset de contraseña envía un enlace de un solo uso al correo del cliente. Deshabilitar la cuenta bloquea su inicio de sesión de inmediato.
                        </p>
                      </>
                    )}
                  </div>

                  {/* Subcuenta de GHL */}
                  <div className="bg-[#05101F] border border-gray-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Subcuenta de GHL</h4>
                      {ghlDetail?.ghlConnected ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-md text-[10px] font-bold">
                          <CheckCircle2 size={11} /> Conectada
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-800 text-gray-400 border border-gray-700 rounded-md text-[10px] font-bold">Sin conectar</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Location ID</label>
                        <input
                          type="text"
                          value={ghlForm.ghlLocationId}
                          onChange={(e) => setGhlForm((prev) => ({ ...prev, ghlLocationId: e.target.value }))}
                          className="w-full px-3 py-2 bg-[#0A182D] border border-gray-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Email de la subcuenta</label>
                        <input
                          type="text"
                          value={ghlForm.ghlSubaccountEmail}
                          onChange={(e) => setGhlForm((prev) => ({ ...prev, ghlSubaccountEmail: e.target.value }))}
                          className="w-full px-3 py-2 bg-[#0A182D] border border-gray-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-1">
                          Token PIT {ghlDetail?.ghlApiKeyPreview && <span className="text-gray-600">(guardado: {ghlDetail.ghlApiKeyPreview})</span>}
                        </label>
                        <input
                          type="password"
                          value={ghlForm.ghlApiKey}
                          onChange={(e) => setGhlForm((prev) => ({ ...prev, ghlApiKey: e.target.value }))}
                          placeholder="Dejar en blanco para no cambiar"
                          className="w-full px-3 py-2 bg-[#0A182D] border border-gray-700 rounded-lg text-white text-xs placeholder-gray-600 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={handleSaveGhlCredentials}
                        disabled={isSavingGhl}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50"
                      >
                        {isSavingGhl ? <Loader2 size={13} className="animate-spin" /> : <Settings2 size={13} />}
                        Guardar cambios
                      </button>
                      <button
                        onClick={handleVerifyGhl}
                        disabled={isVerifyingGhl}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50"
                      >
                        {isVerifyingGhl ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                        Verificar conexión
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
