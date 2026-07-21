"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, 
  ExternalLink, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  HelpCircle, 
  MessageSquare, 
  Key, 
  Building2
} from "lucide-react";

interface GHLOnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCredentials: (locationId: string, apiKey: string) => void;
  currentLocationId?: string;
  currentApiKey?: string;
}

export default function GHLOnboardingWizardModal({
  isOpen,
  onClose,
  onSaveCredentials,
  currentLocationId = "",
  currentApiKey = ""
}: GHLOnboardingWizardModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [locationId, setLocationId] = useState(currentLocationId);
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isReconfiguring, setIsReconfiguring] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocationId(currentLocationId);
      setApiKey(currentApiKey);
      setStep(1);
      setErrorMsg("");
      setIsReconfiguring(false);
    }
  }, [isOpen, currentLocationId, currentApiKey]);

  if (!isOpen) return null;

  const isAlreadyConnected = Boolean(currentLocationId) && !isReconfiguring && step === 1;

  const handleNextStep1 = () => {
    if (!locationId.trim()) {
      setErrorMsg("Por favor ingresa tu Location ID para continuar.");
      return;
    }
    setErrorMsg("");
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!apiKey.trim()) {
      setErrorMsg("Por favor ingresa tu Private Integration Key (pit-xxxx) de tu subcuenta.");
      return;
    }
    setErrorMsg("");
    onSaveCredentials(locationId.trim(), apiKey.trim());
    setStep(3);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-[#0A182D] border border-cyan-500/40 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,224,240,0.15)] relative overflow-hidden"
        >
          {/* Brillo de fondo */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />

          {/* Header del Modal */}
          <div className="flex items-center justify-between border-b border-gray-800/80 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center text-cyan-400 font-bold">
                <Globe size={20} />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-extrabold text-white">
                  Vinculación de Subcuenta StartPoint CRM
                </h2>
                <p className="text-xs text-gray-400">
                  Configura tu Location ID y tu Token de Subcuenta (PIT) en 2 sencillos pasos.
                </p>
              </div>
            </div>

            {/* Indicador de Pasos */}
            {step < 3 && (
              <div className="flex items-center gap-1.5 bg-[#05101F] px-3 py-1.5 rounded-xl border border-gray-800 text-xs font-mono">
                <span className={step >= 1 ? "text-cyan-400 font-bold" : "text-gray-600"}>1</span>
                <span className="text-gray-600">/</span>
                <span className={step >= 2 ? "text-cyan-400 font-bold" : "text-gray-600"}>2</span>
              </div>
            )}
          </div>

          {/* VISTA SI YA ESTÁ CONECTADO */}
          {isAlreadyConnected ? (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <CheckCircle2 size={32} />
              </div>

              <div>
                <span className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold rounded-full uppercase tracking-wider mb-2">
                  🟢 CRM Conectado y Activo
                </span>
                <h3 className="text-xl font-extrabold text-white">Tu Subcuenta StartPoint está vinculada</h3>
                <p className="text-xs text-gray-400 mt-2 max-w-md mx-auto leading-relaxed">
                  Tu Location ID <strong className="text-cyan-400 font-mono">{currentLocationId || locationId}</strong> y tu token personal están configurados en tu perfil de Firestore.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-extrabold text-xs uppercase rounded-xl shadow-[0_0_20px_rgba(0,224,240,0.2)] hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Entendido / Continuar
                </button>

                <button
                  type="button"
                  onClick={() => setIsReconfiguring(true)}
                  className="w-full sm:w-auto px-5 py-3 bg-[#05101F] hover:bg-gray-800 border border-gray-800 text-gray-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Reconfigurar Credenciales
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* PASO 1: LOCATION ID */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="bg-[#05101F] border border-gray-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">
                        Paso 1 de 2: Tu Location ID
                      </span>
                      <a
                        href="https://app.startpoint.biz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-cyan-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Abrir StartPoint CRM</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>

                    <h3 className="text-sm font-bold text-white">
                      ¿Dónde encuentro mi Location ID en StartPoint?
                    </h3>

                    <ol className="text-xs text-gray-300 space-y-2 list-decimal list-inside leading-relaxed pl-1">
                      <li>Inicia sesión en tu subcuenta en StartPoint CRM: <strong className="text-cyan-400 font-mono">app.startpoint.biz</strong>.</li>
                      <li>Ve a <strong>Settings (Configuración) ⚙️</strong> ➔ <strong>Business Profile (Perfil del Negocio)</strong>.</li>
                      <li>Copia el código que aparece en el campo <strong>Location ID</strong>.</li>
                    </ol>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                      Ingresa tu Location ID:
                    </label>
                    <div className="relative">
                      <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500" />
                      <input
                        type="text"
                        value={locationId}
                        onChange={(e) => setLocationId(e.target.value)}
                        placeholder="Ej. 158iGlYp4rB766cFmHYG"
                        className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-500 rounded-xl py-3.5 pl-12 pr-4 text-sm font-mono text-cyan-400 placeholder-gray-600 focus:outline-none transition-colors"
                      />
                    </div>
                    {errorMsg && <p className="text-xs text-red-400 font-semibold mt-2">⚠️ {errorMsg}</p>}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                    <a
                      href="https://wa.me/12013652055?text=Hola,%20necesito%20ayuda%20para%20vincular%20mi%20Location%20ID%20de%20StartPoint"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-400 hover:underline font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare size={14} />
                      <span>Soporte VIP WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleNextStep1}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-extrabold text-xs uppercase rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer shadow-[0_0_20px_rgba(0,224,240,0.2)]"
                    >
                      <span>Siguiente Paso</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 2: PRIVATE INTEGRATION TOKEN (PIT) */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="bg-[#05101F] border border-gray-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">
                        Paso 2 de 2: Tu Token PIT de Subcuenta (pit-xxxx)
                      </span>
                      <a
                        href="https://app.startpoint.biz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-cyan-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Abrir StartPoint CRM</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>

                    <h3 className="text-sm font-bold text-white">
                      ¿Cómo obtengo mi Token PIT en mi subcuenta?
                    </h3>

                    <ol className="text-xs text-gray-300 space-y-2 list-decimal list-inside leading-relaxed pl-1">
                      <li>En tu subcuenta en StartPoint, ve a <strong>Settings ⚙️</strong> ➔ <strong>Private Integrations</strong>.</li>
                      <li>Haz clic en <strong>+ Create Private Integration</strong>.</li>
                      <li>Selecciona los permisos <strong>Contacts</strong> y <strong>Opportunities</strong> (Read/Write).</li>
                      <li>Copia la llave generada que inicia con <strong className="text-cyan-400 font-mono">pit-xxxx</strong>.</li>
                    </ol>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                      Ingresa tu Token PIT (pit-xxxx):
                    </label>
                    <div className="relative">
                      <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500" />
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Ej. pit-de82df59-f369-4f98-bc7b-115575fd1d3a"
                        className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-500 rounded-xl py-3.5 pl-12 pr-4 text-sm font-mono text-white placeholder-gray-600 focus:outline-none transition-colors"
                      />
                    </div>
                    {errorMsg && <p className="text-xs text-red-400 font-semibold mt-2">⚠️ {errorMsg}</p>}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                      <span>Atrás</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleNextStep2}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-400 to-cyan-500 text-black font-extrabold text-xs uppercase rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    >
                      <CheckCircle2 size={16} />
                      <span>Guardar y Conectar CRM</span>
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 3: ÉXITO */}
              {step === 3 && (
                <div className="text-center py-8 space-y-6">
                  <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 size={40} />
                  </div>

                  <div>
                    <h3 className="text-2xl font-extrabold text-white">¡Subcuenta y Token Vinculados!</h3>
                    <p className="text-xs text-gray-400 mt-2 max-w-md mx-auto leading-relaxed">
                      Tu Location ID <strong className="text-cyan-400 font-mono">{locationId}</strong> y tu Token PIT se guardaron de forma segura en tu perfil de Firestore. Tus clientes se sincronizarán directamente con tu propia subcuenta.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-8 py-3.5 bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-[0_0_25px_rgba(0,224,240,0.2)] hover:opacity-90 transition-all"
                  >
                    Comenzar a Trabajar
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
