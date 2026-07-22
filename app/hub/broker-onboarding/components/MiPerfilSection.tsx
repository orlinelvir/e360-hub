"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  ShieldCheck, 
  ExternalLink, 
  Copy, 
  Check, 
  CreditCard, 
  Building, 
  Award, 
  FileCheck, 
  QrCode, 
  Save, 
  CheckCircle2, 
  RefreshCw, 
  Lock, 
  Mail, 
  Phone, 
  Globe,
  Download,
  Construction
} from "lucide-react";
import { BrokerProfileData } from "../types";

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
  ghlLocationId: process.env.NEXT_PUBLIC_GHL_DEFAULT_LOCATION_ID || "",
  ghlSubaccountEmail: "",
  ghlConnected: false,
  tier: "Senior Broker",
  nmlsId: "Por registrar",
  licenseNumber: "Por registrar",
  payoutMethod: "zelle",
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

import { useAuth } from "@/components/AuthProvider";
import { getBrokerProfile, updateBrokerProfile } from "@/lib/services/broker-service";

export default function MiPerfilSection({ brokerName }: MiPerfilSectionProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<BrokerProfileData>(createCleanProfile(brokerName));
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [isSyncingGHL, setIsSyncingGHL] = useState(false);

  // Form states
  const [payoutMethod, setPayoutMethod] = useState<"ach" | "zelle" | "wire">("zelle");
  const [zelleValue, setZelleValue] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNum, setAccountNum] = useState("");
  const [routingNum, setRoutingNum] = useState("");

  useEffect(() => {
    if (!user) return;

    getBrokerProfile(user.uid, brokerName, user.email || "").then((data: any) => {
      setProfile((prev) => ({ 
        ...prev, 
        ...data,
        name: data.displayName || data.name || prev.name,
        brokerId: `BRK-${data.uid ? data.uid.substring(0, 6).toUpperCase() : "360"}`
      }));
      setPayoutMethod(data.payoutMethod || "zelle");
      setZelleValue(data.payoutDetails?.zellePhoneOrEmail || "");
      setBankName(data.payoutDetails?.bankName || "");
      setAccountNum(data.payoutDetails?.accountNumber || "");
      setRoutingNum(data.payoutDetails?.routingNumber || "");
    }).catch(err => {
      console.error("Error cargando perfil desde Firestore:", err);
    });
  }, [user, brokerName]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const updated: BrokerProfileData = {
      ...profile,
      payoutMethod,
      payoutDetails: {
        bankName,
        accountNumber: accountNum,
        routingNumber: routingNum,
        zellePhoneOrEmail: zelleValue
      }
    };
    setProfile(updated);

    try {
      await updateBrokerProfile(user.uid, {
        payoutMethod,
        payoutDetails: {
          bankName,
          accountNumber: accountNum,
          routingNumber: routingNum,
          zellePhoneOrEmail: zelleValue
        }
      });
      setIsSavedToast(true);
      setTimeout(() => setIsSavedToast(false), 2500);
    } catch (err) {
      console.error("Error guardando perfil en Firestore:", err);
    }
  };

  const handleSyncGHL = () => {
    setIsSyncingGHL(true);
    setTimeout(() => {
      setIsSyncingGHL(false);
    }, 1500);
  };

  const handleSaveCRMConfig = async () => {
    if (!user) return;
    try {
      await updateBrokerProfile(user.uid, {
        ghlLocationId: profile.ghlLocationId || "",
        ghlApiKey: profile.ghlApiKey || "",
        ghlConnected: Boolean(profile.ghlLocationId && profile.ghlApiKey)
      });
      setIsSavedToast(true);
      setTimeout(() => {
        setIsSavedToast(false);
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error("Error al guardar credenciales CRM en el perfil:", err);
    }
  };

  const referralUrl = `https://emprende360.com/ref/${profile.referralSlug}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const displayName = profile.displayName || profile.name || brokerName || "Broker E360";

  return (
    <div className="space-y-8">
      
      {/* AVISO DE SECCIÓN EN DESARROLLO / PRUEBAS BETA */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-inner">
        <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/30 shrink-0">
          <Construction size={20} />
        </div>
        <div>
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
            <span>Módulo en Desarrollo / Versión Beta</span>
            <span className="bg-amber-500/20 text-amber-300 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-amber-500/40">BETA PRUEBAS</span>
          </h4>
          <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
            La gestión de perfil se encuentra en fase de pruebas activas. Puedes guardar y personalizar tus métodos de cobro e información de broker libremente.
          </p>
        </div>
      </div>
      
      {/* CARD DE ENCABEZADO DE PERFIL & TIER */}
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
                <span className="text-xs font-mono text-gray-500">ID: {profile.brokerId || `BRK-${user?.uid ? user.uid.substring(0, 6).toUpperCase() : "360"}`}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
                {displayName}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mt-2">
                <span className="flex items-center gap-1.5">
                  <Mail size={14} className="text-cyan-500" />
                  {profile.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone size={14} className="text-cyan-500" />
                  {profile.phone}
                </span>
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

      {/* ESTADO CONEXIÓN CRM SUBCUENTA */}
      <div className="bg-[#0A182D]/60 border border-cyan-500/30 rounded-3xl p-6 relative overflow-hidden space-y-4">
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
              <p className="text-xs text-gray-400 mt-1">
                Vinculación directa de CRM para la gestión individual de Leads y Pipeline de comisiones.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleSaveCRMConfig}
              className="flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,224,240,0.2)] hover:opacity-90"
            >
              <Save size={14} />
              <span>Guardar Config</span>
            </button>

            <button
              onClick={handleSyncGHL}
              disabled={isSyncingGHL}
              className="flex-1 md:flex-none px-4 py-2.5 bg-[#05101F] hover:bg-gray-800 border border-gray-800 text-gray-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw size={14} className={isSyncingGHL ? "animate-spin text-cyan-400" : ""} />
              <span>Verificar Sync</span>
            </button>
            
            <a
              href="https://app.startpoint.biz"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 md:flex-none px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Abrir StartPoint CRM</span>
              <ExternalLink size={14} />
            </a>
          </div>

        </div>

        {/* Campos de Configuración CRM de la Subcuenta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-800/80">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
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
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
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

      {/* ENLACE ÚNICO DE REFERIDO Y CODIGO QR (PRÓXIMAMENTE) */}
      <div className="bg-[#0A182D]/40 border border-gray-800/80 rounded-3xl p-6 md:p-8 space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <QrCode size={18} className="text-cyan-400" />
            <span>Enlace de Captura de Clientes & Código QR</span>
          </h3>
          <span className="bg-amber-500/10 text-amber-400 text-[10px] font-mono font-extrabold px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5">
            <Lock size={12} />
            <span>PRÓXIMAMENTE</span>
          </span>
        </div>

        <div className="bg-[#05101F]/80 border border-amber-500/20 rounded-2xl p-6 text-center space-y-2">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 mx-auto">
            <Lock size={22} />
          </div>
          <h4 className="text-sm font-bold text-white">Módulo de Referidos & QR en Desarrollo</h4>
          <p className="text-xs text-gray-400 max-w-lg mx-auto leading-relaxed">
            La generación automática de URLs de captura personalizada y código QR dinámico para tu subcuenta se activará en la próxima actualización de la plataforma.
          </p>
        </div>
      </div>

      {/* CONFIGURACIÓN DE PAGO DE COMISIONES & DOCUMENTOS (GRID 2 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO METODOS DE PAGO (PRÓXIMAMENTE) */}
        <div className="bg-[#0A182D]/40 border border-gray-800/80 rounded-3xl p-6 md:p-8 space-y-4 relative overflow-hidden flex flex-col justify-between">
          <div className="border-b border-gray-800/80 pb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard size={18} className="text-emerald-400" />
              <span>Configuración de Cobro de Comisiones</span>
            </h3>
            <span className="bg-amber-500/10 text-amber-400 text-[10px] font-mono font-extrabold px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5">
              <Lock size={12} />
              <span>PRÓXIMAMENTE</span>
            </span>
          </div>

          <div className="bg-[#05101F]/80 border border-amber-500/20 rounded-2xl p-6 text-center space-y-2 my-auto">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 mx-auto">
              <Lock size={22} />
            </div>
            <h4 className="text-sm font-bold text-white">Dispersión Automática de Comisiones en Desarrollo</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              El portal automatizado para asociar tus datos de Zelle, ACH y transferencias para pagos de los viernes se habilitará en la versión 2.0.
            </p>
          </div>
        </div>

        {/* COLUMNA DERECHA: BÓVEDA DE DOCUMENTOS (PRÓXIMAMENTE) */}
        <div className="bg-[#0A182D]/40 border border-gray-800/80 rounded-3xl p-6 md:p-8 space-y-4 relative overflow-hidden flex flex-col justify-between">
          <div className="border-b border-gray-800/80 pb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck size={18} className="text-cyan-400" />
              <span>Bóveda de Documentos & Licencias</span>
            </h3>
            <span className="bg-amber-500/10 text-amber-400 text-[10px] font-mono font-extrabold px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5">
              <Lock size={12} />
              <span>PRÓXIMAMENTE</span>
            </span>
          </div>

          <div className="bg-[#05101F]/80 border border-amber-500/20 rounded-2xl p-6 text-center space-y-2 my-auto">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 mx-auto">
              <Lock size={22} />
            </div>
            <h4 className="text-sm font-bold text-white">Bóveda Digital en Desarrollo</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              La carga y consulta digital de tu contrato W-9, póliza de broker y licencias estatales estará disponible en el próximo release.
            </p>
          </div>
        </div>

      </div>

      {/* Toast de Guardado */}
      <AnimatePresence>
        {isSavedToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-black px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center gap-2"
          >
            <CheckCircle2 size={16} />
            <span>Configuración Guardada Exitosamente</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
