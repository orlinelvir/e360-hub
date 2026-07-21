"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { 
  Search, 
  ChevronRight, 
  Phone, 
  Copy, 
  Check, 
  Lock, 
  User, 
  FileText, 
  X,
  CheckCircle2,
  Clock,
  Coins,
  ShieldCheck,
  Building,
  CreditCard,
  Home,
  Briefcase,
  Users,
  Smile,
  Activity,
  Calculator,
  Laptop,
  Car,
  HeartPulse,
  Heart,
  Sparkles
} from "lucide-react";

import { servicesData, ServiceDetail } from "./data/services";

import MisClientesSection from "./components/MisClientesSection";
import SoporteSection from "./components/SoporteSection";
import MiPerfilSection from "./components/MiPerfilSection";
import GHLOnboardingWizardModal from "./components/GHLOnboardingWizardModal";
import { ActiveTab } from "./types";
import { useAuth } from "@/components/AuthProvider";
import { updateBrokerProfile } from "@/lib/services/broker-service";

export default function BrokerOnboardingClient() {
  const [mounted, setMounted] = useState<boolean>(false);
  const { user, profile, loading: authLoading, loginWithEmail, registerWithEmail, loginWithGoogle, logout } = useAuth();
  
  const [registerName, setRegisterName] = useState<string>("");
  const [emailInput, setEmailInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("inicio");
  
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedService, setSelectedService] = useState<ServiceDetail | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [checkedServices, setCheckedServices] = useState<Record<string, { reqs: boolean; process: boolean; terms: boolean }>>({});

  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [userLocationId, setUserLocationId] = useState<string>("");
  const [userApiKey, setUserApiKey] = useState<string>("");

  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);

  const isAuthenticated = Boolean(user);
  const brokerName = profile?.displayName || user?.displayName || user?.email?.split("@")[0] || "Broker E360";

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSaveGHLWizard = async (locId: string) => {
    setUserLocationId(locId);
    if (user) {
      try {
        await updateBrokerProfile(user.uid, {
          ghlLocationId: locId,
          ghlConnected: true
        });
      } catch (err) {
        console.error("Error al guardar subcuenta GHL en Firestore:", err);
      }
    }
  };

  const handleFirebaseEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoadingAuth(true);

    try {
      if (isSignUp) {
        if (!registerName.trim() || !emailInput.trim() || !passwordInput.trim()) {
          setLoginError("Completa todos los campos para registrarte.");
          setIsLoadingAuth(false);
          return;
        }
        if (!termsAccepted) {
          setLoginError("Debes aceptar los términos y políticas de comisiones de E360 Hub.");
          setIsLoadingAuth(false);
          return;
        }
        await registerWithEmail(emailInput.trim(), passwordInput.trim(), registerName.trim());
      } else {
        if (!emailInput.trim() || !passwordInput.trim()) {
          setLoginError("Ingresa tu correo y contraseña.");
          setIsLoadingAuth(false);
          return;
        }
        await loginWithEmail(emailInput.trim(), passwordInput.trim());
      }
    } catch (err: any) {
      console.error("Error de autenticación Firebase:", err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setLoginError("Credenciales incorrectas. Verifique correo y contraseña.");
      } else if (err.code === "auth/email-already-in-use") {
        setLoginError("Este correo ya está registrado en E360 App.");
      } else if (err.code === "auth/weak-password") {
        setLoginError("La contraseña debe tener al menos 6 caracteres.");
      } else {
        setLoginError(err.message || "Error al autenticar con Firebase.");
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoadingAuth(true);
    setLoginError("");
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      if (err.code === "auth/operation-not-allowed") {
        setLoginError("Google Sign-In no está activado en tu consola de Firebase.");
      } else if (err.code === "auth/unauthorized-domain") {
        setLoginError("Este dominio de la web no está autorizado en tu consola de Firebase.");
      } else if (err.code === "auth/popup-closed-by-user") {
        setLoginError("La ventana de inicio de sesión con Google fue cerrada.");
      } else {
        setLoginError(err.message || "No se pudo iniciar sesión con Google.");
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn("SignOut notice:", e);
    }
  };

  // Filtrado de servicios según el buscador en tiempo real
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return servicesData;
    const query = searchQuery.toLowerCase();
    return servicesData.filter(service => 
      service.title.toLowerCase().includes(query) || 
      service.description.toLowerCase().includes(query) ||
      service.requirements.some(req => req.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  // Clasificación por columnas
  const financialServices = useMemo(() => 
    filteredServices.filter(s => s.category === "financial"), 
    [filteredServices]
  );

  const professionalServices = useMemo(() => 
    filteredServices.filter(s => s.category === "professional"), 
    [filteredServices]
  );

  // Copiar link de formulario al portapapeles
  const handleCopyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const toggleCheck = (serviceId: string, field: "reqs" | "process" | "terms") => {
    setCheckedServices(prev => {
      const current = prev[serviceId] || { reqs: false, process: false, terms: false };
      return {
        ...prev,
        [serviceId]: {
          ...current,
          [field]: !current[field]
        }
      };
    });
  };

  // Determinar color de estatus
  const getStatusColor = (status: "active" | "delay" | "paused" | "upcoming") => {
    switch (status) {
      case "active": return "bg-green-500 shadow-green-500/50";
      case "delay": return "bg-yellow-500 shadow-yellow-500/50";
      case "paused": return "bg-red-500 shadow-red-500/50";
      case "upcoming": return "bg-purple-500 shadow-purple-500/50";
    }
  };

  const getStatusBadge = (status: "active" | "delay" | "paused" | "upcoming") => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "delay": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "paused": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "upcoming": return "bg-purple-500/10 text-purple-300 border-purple-500/20";
    }
  };

  if (!mounted) {
    return <div className="fixed inset-0 bg-[#030812]" />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#030812] text-white overflow-y-auto flex flex-col font-sans">
      
      {/* Luces de Fondo Decorativas */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none z-0" />

      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          /* --- PANTALLA DE ACCESO (LOGIN GLASSMORPHISM) --- */
          <motion.div 
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow flex items-center justify-center p-6 relative z-10"
          >
            <div className="w-full max-w-md bg-[#0A182D]/70 backdrop-blur-xl border border-gray-800/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500" />
              
              <div className="flex flex-col items-center mb-8">
                <div className="relative h-12 w-44 mb-6">
                  <Image 
                    src="/logo.png" 
                    alt="E360 Logo" 
                    fill
                    priority
                    className="object-contain" 
                  />
                </div>
                <h2 className="text-xl font-bold text-center tracking-tight">Acceso Exclusivo para Brokers</h2>
                <p className="text-xs text-gray-400 text-center mt-2 leading-relaxed">
                  Ingresa tus credenciales oficiales de E360 Hub para desbloquear la guía rápida de servicios.
                </p>
              </div>

              <div className="flex flex-col items-center mb-6">
                <div className="relative h-12 w-44 mb-4">
                  <Image 
                    src="/logo.png" 
                    alt="E360 Logo" 
                    fill
                    priority
                    className="object-contain" 
                  />
                </div>
                <h2 className="text-xl font-bold text-center tracking-tight">Acceso Oficial de Brokers E360</h2>
                <p className="text-xs text-gray-400 text-center mt-2 leading-relaxed">
                  Autenticación unificada con **E360 Firebase Auth** & **GoHighLevel CRM Sub-accounts**.
                </p>
              </div>

              {/* Botón Google Sign-In */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoadingAuth}
                className="w-full mb-5 bg-[#05101F] hover:bg-[#0A1A30] border border-gray-700/80 text-white py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-3 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.6 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"/>
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
                </svg>
                <span>Continuar con Google</span>
              </button>

              <div className="relative flex items-center justify-center mb-6">
                <div className="border-t border-gray-800 w-full" />
                <span className="bg-[#0A182D] px-3 text-[10px] text-gray-500 uppercase tracking-widest absolute">o con correo</span>
              </div>

              <form onSubmit={handleFirebaseEmailAuth} className="space-y-4">
                {isSignUp && (
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                      Nombre Completo
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input 
                        type="text"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        placeholder="Ej. Juan Pérez"
                        className="w-full bg-[#05101F] border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="broker@emprende360.com"
                      className="w-full bg-[#05101F] border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#05101F] border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                </div>

                {isSignUp && (
                  <div className="flex items-start gap-2.5 pt-1">
                    <input 
                      type="checkbox"
                      id="acceptTerms"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 accent-cyan-500 rounded cursor-pointer"
                    />
                    <label htmlFor="acceptTerms" className="text-[11px] text-gray-400 leading-snug cursor-pointer select-none">
                      Acepto el <strong className="text-cyan-400">Acuerdo de Broker E360</strong>, los términos de servicios de originación y la política de privacidad de datos.
                    </label>
                  </div>
                )}

                {loginError && (
                  <p className="text-[11px] font-semibold text-red-400 flex items-center gap-1.5 animate-pulse bg-red-950/40 p-2.5 rounded-xl border border-red-500/20">
                    ⚠️ {loginError}
                  </p>
                )}

                <button 
                  type="submit"
                  disabled={isLoadingAuth}
                  className="w-full bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 text-black py-3.5 rounded-xl font-bold text-xs tracking-wide uppercase hover:opacity-90 transition-opacity active:scale-[0.98] transform flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,224,240,0.15)] cursor-pointer"
                >
                  <Lock size={14} /> {isLoadingAuth ? "Autenticando..." : isSignUp ? "Crear Cuenta Broker" : "Ingresar con Firebase"}
                </button>
              </form>

              <div className="mt-4 flex items-center justify-center text-xs text-gray-400">
                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setLoginError(""); }}
                  className="text-cyan-400 hover:underline font-medium text-[11px] cursor-pointer"
                >
                  {isSignUp ? "¿Ya tienes cuenta? Inicia Sesión" : "¿Nuevo Broker? Regístrate aquí"}
                </button>
              </div>

              <div className="mt-8 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                  Documento de Diseño Web · Confidencial · 2026
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          /* --- PANTALLA PRINCIPAL (DASHBOARD HUB ONBOARDING) --- */
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow flex flex-col relative z-10 w-full"
          >
            {/* --- HEADER SUPERIOR --- */}
            <header className="sticky top-0 w-full z-40 bg-[#05101F]/90 backdrop-blur-md border-b border-gray-800/80 py-4 px-6">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                
                {/* Logo E360 */}
                <div className="relative h-9 w-32 cursor-pointer" onClick={() => setActiveTab("inicio")}>
                  <Image 
                    src="/logo.png" 
                    alt="E360 Logo" 
                    fill
                    className="object-contain" 
                  />
                </div>

                {/* Enlaces de Navegación del Hub */}
                <div className="hidden md:flex items-center gap-8">
                  {[
                    { id: "inicio", label: "Inicio / Servicios" },
                    { id: "clientes", label: "Mis Clientes (GHL)" },
                    { id: "soporte", label: "Soporte VIP" },
                    { id: "perfil", label: "Mi Perfil" }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as ActiveTab)}
                      className={`text-xs uppercase tracking-widest py-1 transition-all ${
                        activeTab === tab.id
                          ? "font-extrabold text-cyan-400 border-b-2 border-cyan-400"
                          : "font-semibold text-gray-400 hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Info Broker / Salida */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsWizardOpen(true)}
                    className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      userLocationId 
                        ? "bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400" 
                        : "bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400"
                    }`}
                  >
                    {userLocationId ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>CRM Conectado</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Guía CRM</span>
                      </>
                    )}
                  </button>

                  <div className="text-right">
                    <p className="text-xs font-bold text-white leading-none">{brokerName}</p>
                    <button 
                      onClick={handleLogout}
                      className="text-[10px] font-semibold text-gray-500 hover:text-red-400 transition-colors mt-1 cursor-pointer"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                  <div 
                    onClick={() => setActiveTab("perfil")}
                    className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm shadow-[0_0_15px_rgba(0,224,240,0.1)] cursor-pointer hover:border-cyan-400 transition-colors"
                  >
                    {brokerName.charAt(0).toUpperCase()}
                  </div>
                </div>

              </div>

              {/* Navegación Móvil */}
              <div className="flex md:hidden items-center justify-around pt-3 border-t border-gray-800/80 mt-3">
                {[
                  { id: "inicio", label: "Inicio" },
                  { id: "clientes", label: "Clientes" },
                  { id: "soporte", label: "Soporte" },
                  { id: "perfil", label: "Perfil" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                    className={`text-[10px] uppercase tracking-wider py-1 font-bold ${
                      activeTab === tab.id ? "text-cyan-400 border-b border-cyan-400" : "text-gray-400"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </header>

            {activeTab === "inicio" && (
              <>
                {/* --- HERO SECTION --- */}
                <section className="py-12 px-6 border-b border-gray-900 bg-gradient-to-b from-[#05101F]/40 to-transparent">
                  <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
                      Bienvenido, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-400 to-blue-600">{brokerName}</span>
                    </h1>
                    <p className="text-sm md:text-base text-gray-400 font-light mb-8 max-w-2xl mx-auto leading-relaxed">
                      Selecciona el servicio que necesitas para ver los requisitos, la hoja de ruta paso a paso, los tiempos y el contacto directo con soporte.
                    </p>

                    {/* Buscador Rápido */}
                    <div className="max-w-lg mx-auto relative">
                      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar servicio, requisito o palabra clave..."
                        className="w-full bg-[#0A182D]/80 border border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all shadow-inner"
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery("")}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-white"
                        >
                          Limpiar
                        </button>
                      )}
                    </div>
                  </div>
                </section>

                {/* --- COLUMNAS DE SERVICIOS --- */}
                <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-12">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    
                    {/* COLUMNA IZQUIERDA: SERVICIOS FINANCIEROS */}
                    <div>
                      <div className="flex items-center gap-3 mb-6 pb-2 border-b border-blue-900/30">
                        <div className="w-2.5 h-6 bg-blue-500 rounded-full" />
                        <h2 className="text-lg font-bold tracking-widest text-blue-400 uppercase">
                          Servicios Financieros
                        </h2>
                      </div>

                      {financialServices.length === 0 ? (
                        <p className="text-xs text-gray-600 py-4 italic">No se encontraron servicios financieros.</p>
                      ) : (
                        <div className="space-y-4">
                          {financialServices.map((service) => {
                            const IconComponent = service.icon;
                            return (
                              <motion.button
                                key={service.id}
                                whileHover={{ scale: 1.01, x: 4 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => setSelectedService(service)}
                                className="w-full bg-[#0A182D]/40 hover:bg-[#0A182D]/80 border border-gray-800/80 hover:border-blue-500/40 p-5 rounded-2xl flex items-center justify-between text-left transition-all group shadow-sm"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 group-hover:text-blue-300 transition-colors">
                                    <IconComponent size={22} />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-white group-hover:text-blue-300 transition-colors text-sm md:text-base">
                                      {service.title}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-[250px] md:max-w-[400px]">
                                      {service.description}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  {/* Estatus */}
                                  <div className="flex items-center gap-1.5 bg-gray-900/60 py-1.5 px-3 rounded-full border border-gray-800">
                                    <span className={`w-2 h-2 rounded-full ${getStatusColor(service.status)} relative`}>
                                      <span className={`absolute inset-0 rounded-full ${getStatusColor(service.status)} animate-ping opacity-75`} />
                                    </span>
                                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:inline">
                                      {service.statusLabel}
                                    </span>
                                  </div>
                                  <ChevronRight size={18} className="text-gray-600 group-hover:text-white transition-colors" />
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* COLUMNA DERECHA: SEGUROS Y SERVICIOS PROFESIONALES */}
                    <div>
                      <div className="flex items-center gap-3 mb-6 pb-2 border-b border-cyan-900/30">
                        <div className="w-2.5 h-6 bg-cyan-400 rounded-full" />
                        <h2 className="text-lg font-bold tracking-widest text-cyan-400 uppercase">
                          Seguros y Servicios Profesionales
                        </h2>
                      </div>

                      {professionalServices.length === 0 ? (
                        <p className="text-xs text-gray-600 py-4 italic">No se encontraron seguros o servicios profesionales.</p>
                      ) : (
                        <div className="space-y-4">
                          {professionalServices.map((service) => {
                            const IconComponent = service.icon;
                            return (
                              <motion.button
                                key={service.id}
                                whileHover={{ scale: 1.01, x: 4 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => setSelectedService(service)}
                                className="w-full bg-[#0A182D]/40 hover:bg-[#0A182D]/80 border border-gray-800/80 hover:border-cyan-500/40 p-5 rounded-2xl flex items-center justify-between text-left transition-all group shadow-sm"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 transition-colors">
                                    <IconComponent size={22} />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-white group-hover:text-cyan-300 transition-colors text-sm md:text-base">
                                      {service.title}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-[250px] md:max-w-[400px]">
                                      {service.description}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  {/* Estatus */}
                                  <div className="flex items-center gap-1.5 bg-gray-900/60 py-1.5 px-3 rounded-full border border-gray-800">
                                    <span className={`w-2 h-2 rounded-full ${getStatusColor(service.status)} relative`}>
                                      <span className={`absolute inset-0 rounded-full ${getStatusColor(service.status)} animate-ping opacity-75`} />
                                    </span>
                                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:inline">
                                      {service.statusLabel}
                                    </span>
                                  </div>
                                  <ChevronRight size={18} className="text-gray-600 group-hover:text-white transition-colors" />
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                </main>
              </>
            )}

            {activeTab === "clientes" && (
              <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-8">
                <MisClientesSection brokerName={brokerName} />
              </main>
            )}

            {activeTab === "soporte" && (
              <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-8">
                <SoporteSection brokerName={brokerName} />
              </main>
            )}

            {activeTab === "perfil" && (
              <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-8">
                <MiPerfilSection brokerName={brokerName} />
              </main>
            )}

            {/* --- PIE DE PÁGINA CONFIDENCIAL --- */}
            <footer className="w-full py-8 px-6 mt-auto border-t border-gray-900/80 bg-gray-950/40 text-center">
              <p className="text-xs text-gray-600 font-mono tracking-widest uppercase">
                Emprende 360 · E360 Hub — Documento de Diseño Web · Confidencial · 2026
              </p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- PANEL DE DETALLE (SLIDER SIDEBAR DE LA DERECHA) --- */}
      <AnimatePresence>
        {selectedService && (
          <>
            {/* Backdrop con Blur */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedService(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 cursor-pointer"
            />

            {/* Contenedor del Panel */}
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-[#0A182D] border-l border-gray-800/80 shadow-2xl z-[60] flex flex-col overflow-hidden"
            >
              
              {/* Encabezado del Panel */}
              <div className="p-6 border-b border-gray-800/80 bg-[#05101F]/80 flex justify-between items-center relative">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-400 to-blue-500" />
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400">
                    {(() => {
                      const Icon = selectedService.icon;
                      return <Icon size={24} />;
                    })()}
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-white">{selectedService.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold tracking-widest uppercase ${getStatusBadge(selectedService.status)}`}>
                        {selectedService.statusLabel}
                      </span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                        {selectedService.category === "financial" ? "Financiero" : "Seguros/Profesional"}
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedService(null)}
                  className="p-2 hover:bg-gray-800/80 rounded-full transition-colors text-gray-400 hover:text-white"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Cuerpo Scrollable */}
              <div className="p-6 md:p-8 overflow-y-auto flex-grow space-y-8">
                
                {/* Descripción General */}
                <div>
                  <h3 className="text-cyan-400 font-bold uppercase tracking-wider text-[10px] mb-3">
                    Descripción del Servicio
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed bg-[#05101F]/30 p-4 rounded-xl border border-gray-900">
                    {selectedService.description}
                  </p>
                </div>

                {/* Comisiones del Broker */}
                <div className="bg-gradient-to-r from-cyan-500/5 to-transparent border-l-2 border-cyan-500 p-4 rounded-r-xl">
                  <div className="flex items-center gap-2 mb-2 text-cyan-400">
                    <Coins size={16} />
                    <h4 className="text-xs font-bold uppercase tracking-widest">
                      Comisión / Beneficio del Broker
                    </h4>
                  </div>
                  <p className="text-gray-200 text-sm font-semibold leading-relaxed">
                    {selectedService.comission}
                  </p>
                </div>

                {/* Requisitos del Cliente */}
                <div>
                  <h3 className="text-cyan-400 font-bold uppercase tracking-wider text-[10px] mb-4">
                    Requisitos que el Cliente debe entregar
                  </h3>
                  <ul className="grid grid-cols-1 gap-3.5">
                    {selectedService.requirements.map((req, idx) => (
                      <li key={idx} className="flex gap-3 text-gray-300 text-xs leading-relaxed">
                        <CheckCircle2 size={16} className="text-cyan-500 shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Hoja de Ruta / Proceso Paso a Paso */}
                <div>
                  <h3 className="text-cyan-400 font-bold uppercase tracking-wider text-[10px] mb-6">
                    Procedimiento del Servicio (Hoja de Ruta)
                  </h3>
                  <div className="space-y-6 relative ml-3">
                    {/* Línea vertical conectora */}
                    <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-800" />
                    
                    {selectedService.process.map((step, idx) => (
                      <div key={idx} className="flex gap-4 relative z-10">
                        <div className="w-6 h-6 rounded-full bg-[#0A182D] border border-cyan-500/50 flex items-center justify-center text-[10px] font-bold text-cyan-400 shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-gray-300 text-xs leading-relaxed">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tiempos de Entrega */}
                <div className="flex items-center gap-3 bg-[#05101F]/60 border border-gray-800 p-4 rounded-2xl">
                  <div className="p-2.5 bg-cyan-950/40 rounded-xl text-cyan-400 border border-cyan-500/20">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Tiempo Estimado</h4>
                    <p className="text-gray-200 text-xs font-semibold mt-1">{selectedService.timeframe}</p>
                  </div>
                </div>

                {/* Confirmación Obligatoria de Términos y Requisitos */}
                {selectedService.status === "upcoming" ? (
                  <div className="bg-purple-950/30 border border-purple-500/30 p-5 rounded-2xl flex items-center gap-3">
                    <Clock size={22} className="text-purple-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">Servicio Disponible Próximamente</h4>
                      <p className="text-xs text-purple-200/80 mt-1 leading-relaxed">
                        Este servicio se encuentra en etapa final de preparación y estará 100% operativo para todos los brokers el próximo mes.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#05101F] border border-cyan-500/30 p-5 rounded-2xl space-y-3 shadow-inner">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                        <ShieldCheck size={16} />
                        <span>Confirmación de Lectura Obligatoria</span>
                      </h4>
                      <span className="text-[10px] font-mono font-semibold text-gray-500">3 de 3 requeridos</span>
                    </div>

                    <div className="space-y-2.5 text-xs text-gray-300">
                      {(() => {
                        const checks = checkedServices[selectedService.id] || { reqs: false, process: false, terms: false };
                        return (
                          <>
                            <label className="flex items-start gap-3 cursor-pointer select-none group">
                              <input 
                                type="checkbox"
                                checked={checks.reqs}
                                onChange={() => toggleCheck(selectedService.id, "reqs")}
                                className="mt-0.5 w-4 h-4 rounded border-gray-700 bg-black text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                              />
                              <span className="group-hover:text-white transition-colors">
                                Confirmo que el cliente cumple con los <strong>requisitos documentales mínimos</strong> solicitados.
                              </span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer select-none group">
                              <input 
                                type="checkbox"
                                checked={checks.process}
                                onChange={() => toggleCheck(selectedService.id, "process")}
                                className="mt-0.5 w-4 h-4 rounded border-gray-700 bg-black text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                              />
                              <span className="group-hover:text-white transition-colors">
                                He leído el <strong>procedimiento y hoja de ruta</strong> para orientar correctamente al cliente.
                              </span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer select-none group">
                              <input 
                                type="checkbox"
                                checked={checks.terms}
                                onChange={() => toggleCheck(selectedService.id, "terms")}
                                className="mt-0.5 w-4 h-4 rounded border-gray-700 bg-black text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                              />
                              <span className="group-hover:text-white transition-colors">
                                Acepto los <strong>términos de originación y políticas de comisión</strong> de E360 Hub.
                              </span>
                            </label>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

              </div>

              {/* Sección Inferior de Acciones / CTAs */}
              <div className="p-6 border-t border-gray-800/80 bg-[#05101F]/70 space-y-4">
                
                {(() => {
                  const isUpcoming = selectedService.status === "upcoming";
                  const hasValidUrl = selectedService.formLink.startsWith("http");
                  const checks = checkedServices[selectedService.id] || { reqs: false, process: false, terms: false };
                  const isUnlocked = !isUpcoming && hasValidUrl && checks.reqs && checks.process && checks.terms;

                  return (
                    <>
                      {/* Caja del Formulario con botón para copiar enlace */}
                      <div className={`border rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 transition-all ${
                        isUnlocked 
                          ? "bg-black/60 border-cyan-500/50 shadow-[0_0_20px_rgba(0,224,240,0.1)]" 
                          : "bg-black/20 border-gray-900 opacity-75"
                      }`}>
                        <div className="min-w-0 flex-grow">
                          <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Enlace del Formulario</p>
                          <p className="text-xs font-mono mt-1 truncate">
                            {isUpcoming ? (
                              <span className="text-purple-400 font-semibold">🔒 Próximamente disponible</span>
                            ) : !hasValidUrl ? (
                              <span className="text-amber-400 font-semibold">🚧 Formulario en desarrollo (Próximamente)</span>
                            ) : isUnlocked ? (
                              <span className="text-cyan-400 font-bold">{selectedService.formLink}</span>
                            ) : (
                              <span className="text-amber-400/90 font-semibold">🔒 Marca las 3 casillas para desbloquear</span>
                            )}
                          </p>
                        </div>
                        
                        <div className="flex gap-2 shrink-0">
                          <button 
                            disabled={!isUnlocked}
                            onClick={() => isUnlocked && handleCopyLink(selectedService.formLink, selectedService.id)}
                            className={`px-3 py-2.5 rounded-xl transition-all text-xs font-bold flex items-center justify-center gap-1.5 ${
                              isUnlocked 
                                ? "bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white cursor-pointer" 
                                : "bg-gray-950 border border-gray-900 text-gray-600 cursor-not-allowed opacity-50"
                            }`}
                          >
                            {copiedId === selectedService.id ? (
                              <>
                                <Check size={14} className="text-green-400" />
                                <span className="text-green-400">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy size={14} />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                          
                          {isUnlocked ? (
                            <a 
                              href={selectedService.formLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors shadow-[0_0_15px_rgba(0,224,240,0.2)]"
                            >
                              <span>Abrir Formulario</span>
                              <ChevronRight size={14} />
                            </a>
                          ) : (
                            <button 
                              disabled 
                              className="px-4 py-2.5 bg-gray-800 text-gray-500 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-not-allowed opacity-50"
                            >
                              <span>{!hasValidUrl ? "En Desarrollo" : "Bloqueado"}</span>
                              <Lock size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Botón de Llamar al Soporte Específico */}
                <a 
                  href={selectedService.supportPhone} 
                  className="w-full bg-[#05101F] hover:bg-red-500/10 border border-gray-800 hover:border-red-500/30 text-white hover:text-red-400 py-3.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <Phone size={14} className="group-hover:animate-bounce" /> 
                  Llamar a Soporte ({selectedService.supportPhoneFormatted})
                </a>

              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      <GHLOnboardingWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSaveCredentials={handleSaveGHLWizard}
        currentLocationId={userLocationId}
      />

    </div>
  );
}
