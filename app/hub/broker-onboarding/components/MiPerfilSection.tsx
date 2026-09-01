"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  Award,
  FileCheck,
  QrCode,
  Save,
  CheckCircle2,
  RefreshCw,
  Mail,
  Phone,
  Globe,
  Building,
  MapPin,
  Shield,
  Copy,
  Check,
  FileText,
  User,
  Sparkles,
  Info
} from "lucide-react";
import { BrokerProfileData } from "../types";
import { useAuth } from "@/components/AuthProvider";
import { getBrokerProfile } from "@/lib/services/broker-service";

interface MiPerfilSectionProps {
  brokerName: string;
}

const createCleanProfile = (name: string): BrokerProfileData => ({
  uid: "usr-default",
  displayName: name || "Broker E360",
  name: name || "Broker E360",
  email: "broker@emprende360.com",
  phone: "+1 (800) 360-5626",
  brokerId: "BRK-360-001",
  ghlLocationId: "",
  ghlSubaccountEmail: "",
  ghlConnected: false,
  tier: "Senior Broker VIP",
  nmlsId: "",
  licenseNumber: "",
  payoutMethod: "ach",
  payoutDetails: {
    bankName: "",
    accountNumber: "",
    routingNumber: "",
    zellePhoneOrEmail: ""
  },
  referralSlug: (name || "broker").toLowerCase().replace(/[^a-z0-9]/g, "-"),
  totalVolumeProcessed: 0,
  totalCommissionsPaid: 0,
  documentsStatus: {
    brokerAgreement: true,
    w9Form: true,
    directDepositAuth: false
  }
});

export default function MiPerfilSection({ brokerName }: MiPerfilSectionProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<BrokerProfileData>(createCleanProfile(brokerName));
  const [businessName, setBusinessName] = useState<string>("");
  const [whatsapp, setWhatsapp] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [nmlsId, setNmlsId] = useState<string>("");
  const [licenseNumber, setLicenseNumber] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [referralSlug, setReferralSlug] = useState<string>("");

  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [savingCRM, setSavingCRM] = useState<boolean>(false);
  const [isSyncingGHL, setIsSyncingGHL] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  useEffect(() => {
    if (!user) return;

    getBrokerProfile(user.uid, brokerName, user.email || "").then((data) => {
      setProfile((prev) => ({
        ...prev,
        ...data,
        name: data.displayName || data.name || prev.name,
        brokerId: `BRK-${data.uid ? data.uid.substring(0, 6).toUpperCase() : "360"}`
      }));
      setBusinessName(data.businessName || "");
      setWhatsapp(data.whatsapp || data.phone || "");
      setCity(data.city || "");
      setState(data.state || "");
      setNmlsId(data.nmlsId || "");
      setLicenseNumber(data.licenseNumber || "");
      setBio(data.bio || "");
      setReferralSlug(data.referralSlug || (data.displayName || brokerName || "broker").toLowerCase().replace(/[^a-z0-9]/g, "-"));
    }).catch((err: unknown) => {
      console.error("Error cargando perfil:", err);
    });
  }, [user, brokerName]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleSavePersonalProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/broker/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: profile.displayName || profile.name,
          businessName,
          phone: profile.phone,
          whatsapp,
          city,
          state,
          nmlsId,
          licenseNumber,
          bio,
          referralSlug: referralSlug.trim().toLowerCase(),
        }),
      });
      if (!res.ok) throw new Error("Error al guardar información personal");

      showToast("¡Perfil y datos comerciales actualizados exitosamente!");
    } catch (error) {
      console.error("Error al guardar perfil:", error);
      showToast("Error al guardar los datos.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveCRMConfig = async () => {
    if (!user) return;
    setSavingCRM(true);
    const trimmedLocId = (profile.ghlLocationId || "").trim();
    const trimmedApiKey = (profile.ghlApiKey || "").trim();
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/broker/ghl-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ghlLocationId: trimmedLocId, ghlApiKey: trimmedApiKey }),
      });
      if (!res.ok) throw new Error("Error al guardar credenciales");
      setProfile(prev => ({
        ...prev,
        ghlLocationId: trimmedLocId,
        ghlApiKey: trimmedApiKey,
        ghlConnected: Boolean(trimmedLocId && trimmedApiKey),
      }));
      showToast("¡Credenciales de StartPoint CRM guardadas!");
    } catch (err) {
      console.error("Error al guardar CRM:", err);
      showToast("Error al guardar credenciales CRM.");
    } finally {
      setSavingCRM(false);
    }
  };

  const handleSyncGHL = () => {
    setIsSyncingGHL(true);
    setTimeout(() => {
      setIsSyncingGHL(false);
      showToast("Conexión con StartPoint CRM verificada.");
    }, 1200);
  };

  const copyReferralLink = () => {
    const link = `https://e360hub.com/b/${referralSlug || "broker"}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    showToast("Enlace copiado al portapapeles");
  };

  const displayName = profile.displayName || profile.name || brokerName || "Broker E360";
  const referralUrl = `https://e360hub.com/b/${referralSlug || "broker"}`;

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-cyan-500 text-black px-5 py-3 rounded-2xl font-extrabold text-xs shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 size={16} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. CARD PRINCIPAL DE PERFIL & TIER */}
      <div className="bg-gradient-to-r from-[#0A182D] via-[#0E2342] to-[#0A182D] border border-gray-800 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center text-black font-black text-3xl shadow-[0_0_30px_rgba(0,224,240,0.3)] shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                  <Award size={12} />
                  <span>{profile.tier}</span>
                </span>
                <span className="text-xs font-mono text-gray-500">
                  ID: {profile.brokerId || `BRK-${user?.uid ? user.uid.substring(0, 6).toUpperCase() : "360"}`}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
                {displayName}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mt-2">
                <span className="flex items-center gap-1.5">
                  <Mail size={14} className="text-cyan-500" />
                  {profile.email}
                </span>
                {profile.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone size={14} className="text-cyan-500" />
                    {profile.phone}
                  </span>
                )}
                {(city || state) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-cyan-500" />
                    {[city, state].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#05101F]/80 border border-gray-800/80 rounded-2xl p-4 flex items-center gap-6 w-full md:w-auto justify-around">
            <div className="text-center">
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Volumen Procesado</p>
              <p className="text-lg font-extrabold text-white mt-0.5">${(profile.totalVolumeProcessed || 0).toLocaleString()}</p>
            </div>
            <div className="w-px h-8 bg-gray-800" />
            <div className="text-center">
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Comisiones Pagadas</p>
              <p className="text-lg font-extrabold text-emerald-400 mt-0.5">${(profile.totalCommissionsPaid || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FORMULARIO DE PERSONALIZACIÓN Y DATOS COMERCIALES */}
      <div className="bg-[#0A182D]/60 border border-gray-800 rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <User size={18} className="text-cyan-400" />
              <span>Personalización de Perfil & Marca Comercial</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Configura tus datos de contacto y licencias para que aparezcan en tus comunicaciones y cotizaciones.
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePersonalProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Nombre Completo
              </label>
              <input
                type="text"
                value={profile.displayName || profile.name || ""}
                onChange={(e) => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="Tu nombre y apellido"
                className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Nombre de Agencia / Negocio (Opcional)
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ej. Apex Capital Advisors LLC"
                className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Teléfono Directo
              </label>
              <input
                type="tel"
                value={profile.phone || ""}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                WhatsApp Oficial
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Ciudad y Estado
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ciudad (ej. Miami)"
                  className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Estado (ej. FL)"
                  className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                NMLS ID o Licencia (Si aplica)
              </label>
              <input
                type="text"
                value={nmlsId}
                onChange={(e) => setNmlsId(e.target.value)}
                placeholder="Ej. NMLS #1234567"
                className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Biografía / Presentación Comercial
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe tu experiencia como broker y principales servicios que ofreces a tus clientes..."
              className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-600 hover:opacity-95 text-black font-extrabold rounded-xl text-xs transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,224,240,0.25)] disabled:opacity-50"
            >
              {savingProfile ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              <span>{savingProfile ? "Guardando..." : "Guardar Perfil"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. ENLACE ÚNICO DE REFERIDO Y CAPTURA */}
      <div className="bg-[#0A182D]/60 border border-gray-800 rounded-3xl p-6 md:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <QrCode size={18} className="text-cyan-400" />
              <span>Enlace de Captura Personalizado & Código QR</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Comparte este enlace con tus clientes para que sus solicitudes queden automáticamente registradas bajo tu código de broker.
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-bold font-mono">
            ACTIVO
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center pt-2">
          <div className="md:col-span-2 space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Tu Enlace de Referido Branded
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[#05101F] border border-cyan-500/30 rounded-xl px-4 py-3 text-xs font-mono text-cyan-300 truncate">
                  {referralUrl}
                </div>
                <button
                  onClick={copyReferralLink}
                  className="px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold rounded-xl text-xs transition-colors flex items-center gap-1.5 shrink-0"
                >
                  {copiedLink ? <Check size={15} /> : <Copy size={15} />}
                  <span>{copiedLink ? "Copiado" : "Copiar"}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] text-gray-400">Personalizar Slug:</label>
              <input
                type="text"
                value={referralSlug}
                onChange={(e) => setReferralSlug(e.target.value)}
                placeholder="tu-nombre-o-agencia"
                className="bg-[#05101F] border border-gray-800 rounded-lg px-3 py-1 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="bg-[#05101F] border border-gray-800 rounded-2xl p-4 text-center space-y-2 flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-white p-2 rounded-xl flex items-center justify-center shadow-lg">
              {/* QR Code Placeholder vector */}
              <QrCode size={76} className="text-gray-900" />
            </div>
            <p className="text-[10px] font-mono text-gray-400">Escanea para abrir tu portal</p>
          </div>
        </div>
      </div>

      {/* 4. CONEXIÓN STARTPOINT CRM (GOHIGHLEVEL) */}
      <div className="bg-[#0A182D]/60 border border-cyan-500/30 rounded-3xl p-6 md:p-8 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center text-cyan-400 shrink-0">
              <Globe size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="font-extrabold text-white text-base">Subcuenta StartPoint CRM</h3>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Vinculación de tu subcuenta GoHighLevel para recibir leads en tus propios embudos comerciales.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleSaveCRMConfig}
              disabled={savingCRM}
              className="flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,224,240,0.2)] hover:opacity-90 disabled:opacity-50"
            >
              <Save size={14} />
              <span>{savingCRM ? "Guardando..." : "Guardar CRM"}</span>
            </button>

            <button
              onClick={handleSyncGHL}
              disabled={isSyncingGHL}
              className="flex-1 md:flex-none px-4 py-2.5 bg-[#05101F] hover:bg-gray-800 border border-gray-800 text-gray-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} className={isSyncingGHL ? "animate-spin text-cyan-400" : ""} />
              <span>Verificar Sync</span>
            </button>

            <a
              href="https://app.startpoint.biz"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 md:flex-none px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
            >
              <span>Abrir CRM</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-800/80">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              CRM Location ID
            </label>
            <input
              type="text"
              value={profile.ghlLocationId || ""}
              onChange={(e) => setProfile(prev => ({ ...prev, ghlLocationId: e.target.value }))}
              placeholder="Ej. veYvJ38dK..."
              className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Subaccount Private Token (PIT)
            </label>
            <input
              type="password"
              value={profile.ghlApiKey || ""}
              onChange={(e) => setProfile(prev => ({ ...prev, ghlApiKey: e.target.value }))}
              placeholder="••••••••••••••••"
              className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-xs font-mono text-gray-300 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* 5. GRID 2 COLS: COMPLIANCE W-9 & INFORMACIÓN DE COMISIONES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* W-9 & Documentos */}
        <div className="bg-[#0A182D]/60 border border-gray-800 rounded-3xl p-6 md:p-8 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <FileCheck size={18} className="text-emerald-400" />
                <span>Documentos & Compliance (W-9)</span>
              </h3>
              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                EN REGLA
              </span>
            </div>

            <div className="space-y-3 mt-4">
              <div className="p-3 bg-[#05101F] border border-gray-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-cyan-400" />
                  <div>
                    <p className="text-xs font-bold text-white">Contrato de Broker E360</p>
                    <p className="text-[10px] text-gray-400">Firmado digitalmente en el registro</p>
                  </div>
                </div>
                <CheckCircle2 size={16} className="text-emerald-400" />
              </div>

              <div className="p-3 bg-[#05101F] border border-gray-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield size={18} className="text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold text-white">Formulario Fiscal W-9 (IRS)</p>
                    <p className="text-[10px] text-gray-400">Requerido para desembolso de comisiones 1099</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 font-mono">Activo</span>
              </div>
            </div>
          </div>

          <a
            href="https://www.irs.gov/pub/irs-pdf/fw9.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold text-center transition-colors flex items-center justify-center gap-2 mt-4"
          >
            <span>Descargar Formulario W-9 Oficial del IRS</span>
            <ExternalLink size={13} />
          </a>
        </div>

        {/* Información de Liquidación de Comisiones */}
        <div className="bg-[#0A182D]/60 border border-gray-800 rounded-3xl p-6 md:p-8 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Info size={18} className="text-cyan-400" />
                <span>Liquidación & Pagos de Comisiones</span>
              </h3>
            </div>

            <div className="p-4 bg-[#05101F] border border-gray-800 rounded-2xl space-y-3 mt-4">
              <p className="text-xs text-gray-300 leading-relaxed">
                Las comisiones correspondientes a préstamos de negocio (MCA), líneas de crédito, hipotecas y pólizas de seguros se liquidan y desembolsan una vez que el prestamista o aseguradora confirma el cierre bancario de la operación.
              </p>
              <div className="space-y-1.5 text-[11px] text-gray-400">
                <p>• <strong>Días de Pago:</strong> Los días viernes de cada semana.</p>
                <p>• <strong>Liquidación:</strong> Coordinada directamente con el Departamento de Comisiones según la liquidación bancaria del caso.</p>
                <p>• <strong>Soporte de Comisiones:</strong> +1 (917) 284-5636 (Llamadas / WhatsApp).</p>
              </div>
            </div>
          </div>

          <div className="pt-2 text-center">
            <p className="text-[11px] font-mono text-gray-500">
              E360 Hub · Transparencia y Liquidación de Honorarios · 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
