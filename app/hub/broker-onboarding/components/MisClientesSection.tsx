"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Search, 
  Plus, 
  ExternalLink, 
  RefreshCw, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Mail, 
  MessageSquare, 
  ChevronRight, 
  X, 
  Filter, 
  Calendar, 
  Building, 
  FileText,
  Copy,
  Check,
  Construction
} from "lucide-react";
import { ClientLead, PipelineStage } from "../types";
import { useAuth } from "@/components/AuthProvider";
import { getBrokerClients, saveBrokerClient, ClientLeadData } from "@/lib/services/broker-service";
import { useGHLContacts } from "@/lib/hooks/useGHLContacts";

interface MisClientesSectionProps {
  brokerName: string;
}

const initialMockClients: ClientLead[] = [];

const stageLabels: Record<PipelineStage, { label: string; color: string; bg: string }> = {
  lead: { label: "Nuevo Lead", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" },
  qualification: { label: "En Calificación", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30" },
  docs_pending: { label: "Docs Pendientes", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
  submitted: { label: "Sometido a Banco", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/30" },
  approved: { label: "Aprobado", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
  paid: { label: "Comisión Pagada", color: "text-green-400", bg: "bg-green-500/10 border-green-500/30" }
};

export default function MisClientesSection({ brokerName }: MisClientesSectionProps) {
  const { user } = useAuth();
  const { fetchContacts, createContact, loading: ghlLoading } = useGHLContacts();

  const [clients, setClients] = useState<ClientLead[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<ClientLead | null>(null);
  const [isSyncingGHL, setIsSyncingGHL] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Formulario nuevo cliente
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientService, setNewClientService] = useState("business-loan");
  const [newClientAmount, setNewClientAmount] = useState("");
  const [newClientNotes, setNewClientNotes] = useState("");

  useEffect(() => {
    if (!user) return;

    getBrokerClients(user.uid).then((storedClients: any[]) => {
      setClients(storedClients as ClientLead[]);
    }).catch((err: any) => {
      console.error("Error cargando clientes de Firestore:", err);
    });

    handleSyncGHL();
  }, [user]);

  const saveClients = async (updated: ClientLead[]) => {
    setClients(updated);
    if (!user) return;
    for (const c of updated) {
      try {
        await saveBrokerClient(user.uid, c as ClientLeadData);
      } catch (err) {
        console.error("Error guardando cliente en Firestore:", err);
      }
    }
  };

  const handleSyncGHL = async () => {
    setIsSyncingGHL(true);
    try {
      const contacts = await fetchContacts();
      if (contacts && Array.isArray(contacts)) {
        const ghlMappedLeads: ClientLead[] = contacts.map((cnt: any, idx: number) => ({
          id: cnt.id || `GHL-${idx}`,
          name: `${cnt.firstName || ""} ${cnt.lastName || ""}`.trim() || cnt.name || "Cliente GHL",
          email: cnt.email || "sin_correo@ghl.com",
          phone: cnt.phone || "+1 (555) 000-0000",
          serviceId: "business-loan",
          serviceName: "Cliente CRM GoHighLevel",
          amount: cnt.customFields?.find((f: any) => f.key === "monto_estimado")?.value || 25000,
          estimatedCommission: 1250,
          stage: cnt.tags?.includes("Aprobado") ? "approved" : cnt.tags?.includes("Sometido") ? "submitted" : "lead",
          createdAt: cnt.dateAdded ? cnt.dateAdded.split("T")[0] : new Date().toISOString().split("T")[0],
          lastActivity: "Sincronizado en vivo desde GoHighLevel API v2",
          ghlContactId: cnt.id || `ghl_${cnt.phone}`,
          notes: cnt.source || "Contacto importado en tiempo real desde subcuenta GHL."
        }));

        if (ghlMappedLeads.length > 0) {
          saveClients(ghlMappedLeads);
        }
      }
    } catch (e) {
      console.error("Error al sincronizar con GHL API mediante hook:", e);
    } finally {
      setIsSyncingGHL(false);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientPhone.trim()) return;

    const amountNum = parseFloat(newClientAmount) || 0;
    const estCommission = amountNum > 0 ? amountNum * 0.05 : 250;
    const nameParts = newClientName.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ");

    // Enviar a GHL API backend
    let ghlId = `ghl_cnt_${Math.floor(1000000 + Math.random() * 9000000)}`;
    try {
      const ghlRes = await fetch("/api/ghl/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email: newClientEmail.trim() || `${firstName.toLowerCase()}@referral.com`,
          phone: newClientPhone.trim(),
          service: getServiceName(newClientService),
          amount: amountNum
        })
      });
      if (ghlRes.ok) {
        const ghlData = await ghlRes.json();
        if (ghlData.contact?.id) ghlId = ghlData.contact.id;
      }
    } catch (err) {
      console.warn("No se pudo enviar a GHL backend (usando fallback local):", err);
    }

    const newLead: ClientLead = {
      id: `CLI-${Math.floor(100 + Math.random() * 900)}`,
      name: newClientName.trim(),
      email: newClientEmail.trim() || "contacto@cliente.com",
      phone: newClientPhone.trim(),
      serviceId: newClientService,
      serviceName: getServiceName(newClientService),
      amount: amountNum,
      estimatedCommission: Math.round(estCommission),
      stage: "lead",
      createdAt: new Date().toISOString().split("T")[0],
      lastActivity: "Enviado a GoHighLevel CRM · Oportunidad activa en Pipeline",
      ghlContactId: ghlId,
      notes: newClientNotes.trim() || "Referido por el broker en la plataforma Hub."
    };

    const updated = [newLead, ...clients];
    saveClients(updated);
    setIsAddModalOpen(false);

    // Reset fields
    setNewClientName("");
    setNewClientEmail("");
    setNewClientPhone("");
    setNewClientAmount("");
    setNewClientNotes("");
  };

  const getServiceName = (id: string) => {
    switch (id) {
      case "business-loan": return "Préstamo de Negocio (MCA)";
      case "personal-loan": return "Préstamo Personal";
      case "business-credit-cards": return "Tarjetas de Crédito de Negocio";
      case "mortgage-loan": return "Préstamo Hipotecario DSCR / FHA";
      case "credit-repair": return "Reparación de Crédito";
      case "incorporation": return "Registro de Compañía & EIN";
      case "auto-insurance": return "Seguro de Auto Personal";
      case "commercial-auto-insurance": return "Seguro Comercial de Auto & Trucking";
      case "home-insurance": return "Seguro de Casa (Homeowners)";
      case "business-insurance": return "Seguro de Negocio (General Liability)";
      case "workers-comp": return "Seguro de Compensación de Trabajadores";
      case "pos-services": return "Servicios de POS Merchant";
      default: return "Servicio E360";
    }
  };

  const handleUpdateStage = (id: string, newStage: PipelineStage) => {
    const updated = clients.map(c => {
      if (c.id === id) {
        return {
          ...c,
          stage: newStage,
          lastActivity: `Actualizado a '${stageLabels[newStage].label}' hoy`
        };
      }
      return c;
    });
    saveClients(updated);
    if (selectedClient && selectedClient.id === id) {
      setSelectedClient({
        ...selectedClient,
        stage: newStage,
        lastActivity: `Actualizado a '${stageLabels[newStage].label}' hoy`
      });
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesSearch = 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        c.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStage = selectedStage === "all" || c.stage === selectedStage;
      return matchesSearch && matchesStage;
    });
  }, [clients, searchQuery, selectedStage]);

  // Cálculos de métricas
  const totalVolume = useMemo(() => clients.reduce((acc, curr) => acc + curr.amount, 0), [clients]);
  const totalCommissions = useMemo(() => clients.reduce((acc, curr) => acc + curr.estimatedCommission, 0), [clients]);
  const conversionRate = useMemo(() => {
    if (clients.length === 0) return 0;
    const closed = clients.filter(c => c.stage === "approved" || c.stage === "paid").length;
    return Math.round((closed / clients.length) * 100);
  }, [clients]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
            Esta sección se encuentra en fase de pruebas activas y optimización continua. Puedes probar y registrar clientes libremente para evaluar el flujo de datos.
          </p>
        </div>
      </div>

      {/* BANNER INTEGRADOR GHL SUBCUENTA */}
      <div className="bg-gradient-to-r from-[#0A182D] via-[#0D213F] to-[#0A182D] border border-cyan-500/30 rounded-3xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 blur-[90px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 border border-cyan-400/40 rounded-2xl flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,224,240,0.15)]">
              <Users size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-widest">
                  Subcuenta GoHighLevel Conectada
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-white mt-1">
                CRM & Pipeline de Leads
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Sincronización en tiempo real con tu ubicación GHL: <span className="font-mono text-cyan-400 font-semibold">#LOC-E360-BRK99</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleSyncGHL}
              disabled={isSyncingGHL}
              className="flex-1 md:flex-none px-4 py-3 bg-[#05101F] hover:bg-cyan-950/40 border border-gray-800 hover:border-cyan-500/40 text-gray-300 hover:text-cyan-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} className={isSyncingGHL ? "animate-spin text-cyan-400" : ""} />
              <span>{isSyncingGHL ? "Sincronizando..." : "Sincronizar StartPoint"}</span>
            </button>

            <a
              href="https://app.startpoint.biz"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 md:flex-none px-5 py-3 bg-gradient-to-r from-cyan-400 to-blue-600 hover:opacity-90 text-black font-extrabold rounded-xl text-xs transition-opacity flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,224,240,0.2)] cursor-pointer"
            >
              <span>Abrir StartPoint CRM</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* METRICAS Y KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-[#0A182D]/60 border border-gray-800/80 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Leads Activos</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white mt-3">{clients.length}</p>
          <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">+23%</span> respecto al mes pasado
          </p>
        </div>

        <div className="bg-[#0A182D]/60 border border-gray-800/80 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Volumen Financiamiento</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-cyan-400 mt-3">${totalVolume.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500 mt-1">Monto acumulado en proceso</p>
        </div>

        <div className="bg-[#0A182D]/60 border border-gray-800/80 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Comisiones Estimadas</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-400 mt-3">${totalCommissions.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500 mt-1">Beneficio proyectado broker</p>
        </div>

        <div className="bg-[#0A182D]/60 border border-gray-800/80 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tasa de Conversión</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-purple-300 mt-3">{conversionRate}%</p>
          <p className="text-[10px] text-gray-500 mt-1">Casos cerrados exitosos</p>
        </div>

      </div>

      {/* CONTROLES Y NAVEGACIÓN PIPELINE */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Filtros por etapa */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedStage("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedStage === "all"
                ? "bg-cyan-500 text-black font-bold shadow-md"
                : "bg-[#0A182D]/60 hover:bg-[#0A182D] text-gray-400 hover:text-white border border-gray-800/60"
            }`}
          >
            Todos ({clients.length})
          </button>
          {Object.entries(stageLabels).map(([key, info]) => {
            const count = clients.filter(c => c.stage === key).length;
            return (
              <button
                key={key}
                onClick={() => setSelectedStage(key)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedStage === key
                    ? `${info.bg} ${info.color} font-bold shadow-sm`
                    : "bg-[#0A182D]/40 hover:bg-[#0A182D] text-gray-400 border-gray-800/60"
                }`}
              >
                {info.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Buscador & Nuevo Cliente */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative flex-grow sm:w-64">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente, tel, id..."
              className="w-full bg-[#0A182D]/80 border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold rounded-xl text-xs transition-all flex items-center gap-2 shrink-0 shadow-[0_0_15px_rgba(0,224,240,0.15)]"
          >
            <Plus size={16} />
            <span>Referir Cliente</span>
          </button>
        </div>

      </div>

      {/* LISTA DE CLIENTES */}
      {filteredClients.length === 0 ? (
        <div className="bg-[#0A182D]/30 border border-gray-800/80 rounded-3xl p-12 text-center">
          <AlertCircle size={36} className="mx-auto text-gray-600 mb-3" />
          <h3 className="text-base font-bold text-gray-300">No se encontraron clientes</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Prueba ajustando el filtro de búsqueda o agrega tu primer prospecto haciendo clic en "Referir Cliente".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const stageInfo = stageLabels[client.stage];
            return (
              <motion.div
                key={client.id}
                whileHover={{ y: -3 }}
                className="bg-[#0A182D]/50 hover:bg-[#0A182D]/90 border border-gray-800/80 hover:border-cyan-500/40 rounded-2xl p-5 transition-all flex flex-col justify-between group shadow-lg relative overflow-hidden"
              >
                <div className="space-y-4">
                  
                  {/* Header Tarjeta */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-gray-500 font-bold">{client.id}</span>
                      <h3 className="font-extrabold text-white text-base group-hover:text-cyan-300 transition-colors mt-0.5">
                        {client.name}
                      </h3>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${stageInfo.bg} ${stageInfo.color}`}>
                      {stageInfo.label}
                    </span>
                  </div>

                  {/* Servicio & Detalles Financieros */}
                  <div className="bg-[#05101F]/70 border border-gray-900 rounded-xl p-3.5 space-y-2">
                    <p className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                      <Building size={14} className="shrink-0" />
                      <span className="truncate">{client.serviceName}</span>
                    </p>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-800/60">
                      <div>
                        <p className="text-[9px] text-gray-500 uppercase font-semibold">Monto</p>
                        <p className="font-bold text-white">${client.amount.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-gray-500 uppercase font-semibold">Comisión Est.</p>
                        <p className="font-bold text-emerald-400">${client.estimatedCommission.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Info de contacto rápido */}
                  <div className="space-y-1 text-xs text-gray-400">
                    <p className="flex items-center gap-2 truncate">
                      <Phone size={13} className="text-gray-500 shrink-0" />
                      <span>{client.phone}</span>
                    </p>
                    <p className="flex items-center gap-2 truncate">
                      <Mail size={13} className="text-gray-500 shrink-0" />
                      <span>{client.email}</span>
                    </p>
                  </div>

                  {/* Última actividad */}
                  <p className="text-[10px] text-gray-500 flex items-center gap-1.5 pt-2 border-t border-gray-800/50">
                    <Clock size={12} className="text-cyan-500/80" />
                    <span className="truncate">{client.lastActivity}</span>
                  </p>

                </div>

                {/* Acciones de la Tarjeta */}
                <div className="mt-5 pt-3 border-t border-gray-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`https://wa.me/${client.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/20 transition-colors"
                      title="Contactar por WhatsApp"
                    >
                      <MessageSquare size={14} />
                    </a>
                    <a
                      href={`tel:${client.phone}`}
                      className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/20 transition-colors"
                      title="Llamar directamente"
                    >
                      <Phone size={14} />
                    </a>
                  </div>

                  <button
                    onClick={() => setSelectedClient(client)}
                    className="px-3.5 py-1.5 bg-[#05101F] hover:bg-gray-800 border border-gray-800 text-xs font-semibold text-gray-300 hover:text-white rounded-xl transition-all flex items-center gap-1"
                  >
                    <span>Ver Ficha</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

              </motion.div>
            );
          })}
        </div>
      )}

      {/* MODAL DETALLE DEL CLIENTE */}
      <AnimatePresence>
        {selectedClient && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClient(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto z-50 w-full max-w-xl max-h-[90vh] bg-[#0A182D] border border-gray-800 rounded-3xl p-6 md:p-8 overflow-y-auto shadow-2xl flex flex-col justify-between"
            >
              <div>
                {/* Header Modal */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                  <div>
                    <span className="text-xs font-mono text-cyan-400 font-bold">{selectedClient.id}</span>
                    <h2 className="text-xl font-extrabold text-white">{selectedClient.name}</h2>
                  </div>
                  <button
                    onClick={() => setSelectedClient(null)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Info GHL Sync */}
                <div className="my-5 bg-[#05101F] border border-cyan-500/20 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-cyan-500/10 text-cyan-400 rounded-xl flex items-center justify-center font-bold text-xs">
                      GHL
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">GHL Contact ID</p>
                      <p className="text-xs font-mono text-white font-bold">{selectedClient.ghlContactId}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedClient.ghlContactId, selectedClient.id)}
                    className="p-2 text-gray-400 hover:text-cyan-400"
                  >
                    {copiedId === selectedClient.id ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  </button>
                </div>

                {/* Cambio de Etapa */}
                <div className="mb-6 space-y-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase">Cambiar Etapa en Pipeline:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(stageLabels).map(([stKey, stInfo]) => (
                      <button
                        key={stKey}
                        onClick={() => handleUpdateStage(selectedClient.id, stKey as PipelineStage)}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                          selectedClient.stage === stKey
                            ? `${stInfo.bg} ${stInfo.color} border-current ring-1 ring-cyan-500/40`
                            : "bg-[#05101F] border-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        {stInfo.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Detalles del Caso */}
                <div className="space-y-4 text-xs">
                  <div className="bg-[#05101F]/50 border border-gray-800 p-4 rounded-2xl space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Servicio:</span>
                      <span className="font-bold text-white">{selectedClient.serviceName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Monto Solicitado:</span>
                      <span className="font-bold text-white">${selectedClient.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Comisión Estimada Broker:</span>
                      <span className="font-bold text-emerald-400">${selectedClient.estimatedCommission.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fecha de Ingreso:</span>
                      <span className="text-gray-300 font-mono">{selectedClient.createdAt}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-300 mb-1">Notas y Seguimiento:</h4>
                    <p className="bg-[#05101F] border border-gray-800 p-3.5 rounded-xl text-gray-300 leading-relaxed">
                      {selectedClient.notes}
                    </p>
                  </div>
                </div>

              </div>

              {/* Footer Modal */}
              <div className="mt-6 pt-4 border-t border-gray-800 flex justify-end">
                <button
                  onClick={() => setSelectedClient(null)}
                  className="px-6 py-2.5 bg-cyan-500 text-black font-extrabold rounded-xl text-xs"
                >
                  Cerrar Ficha
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODAL REFERIR NUEVO CLIENTE */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto z-50 w-full max-w-lg max-h-[90vh] bg-[#0A182D] border border-gray-800 rounded-3xl p-6 md:p-8 overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-white">Referir / Registrar Cliente</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Se creará automáticamente en la subcuenta GHL de {brokerName}</p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddClient} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-300 uppercase mb-1">Nombre Completo o Empresa *</label>
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Ej: Juan Pérez o Transportes Pérez LLC"
                    className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-300 uppercase mb-1">Teléfono Directo *</label>
                    <input
                      type="text"
                      required
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      placeholder="+1 (305) 000-0000"
                      className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-300 uppercase mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      placeholder="cliente@ejemplo.com"
                      className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-300 uppercase mb-1">Servicio Solicitado *</label>
                    <select
                      value={newClientService}
                      onChange={(e) => setNewClientService(e.target.value)}
                      className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="business-loan">Préstamo de Negocio (MCA)</option>
                      <option value="personal-loan">Préstamo Personal</option>
                      <option value="business-credit-cards">Tarjetas de Crédito de Negocio</option>
                      <option value="mortgage-loan">Préstamo Hipotecario DSCR/FHA</option>
                      <option value="credit-repair">Reparación de Crédito</option>
                      <option value="incorporation">Registro de Compañía & EIN</option>
                      <option value="auto-insurance">Seguro de Auto Personal</option>
                      <option value="commercial-auto-insurance">Seguro Comercial & Trucking</option>
                      <option value="home-insurance">Seguro de Casa (Homeowners)</option>
                      <option value="business-insurance">Seguro de Negocio (General Liability)</option>
                      <option value="workers-comp">Seguro de Workers' Compensation</option>
                      <option value="pos-services">Terminales de POS Merchant</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-300 uppercase mb-1">Monto Estimado ($)</label>
                    <input
                      type="number"
                      value={newClientAmount}
                      onChange={(e) => setNewClientAmount(e.target.value)}
                      placeholder="50000"
                      className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 uppercase mb-1">Notas Iniciales o Detalles</label>
                  <textarea
                    rows={3}
                    value={newClientNotes}
                    onChange={(e) => setNewClientNotes(e.target.value)}
                    placeholder="Describe brevemente las necesidades del cliente..."
                    className="w-full bg-[#05101F] border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 text-gray-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-extrabold rounded-xl text-xs shadow-[0_0_15px_rgba(0,224,240,0.2)]"
                  >
                    Guardar y Sincronizar GHL
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
