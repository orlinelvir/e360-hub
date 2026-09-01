"use client";

import { useState, useEffect } from "react";
import { Building2, Users, AlertTriangle, BarChart3, RefreshCw, AlertCircle, CheckCircle2, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import AdminCasesTab, { CaseItem } from "./admin/AdminCasesTab";
import AdminMetricsTab, { MetricsData } from "./admin/AdminMetricsTab";
import AdminBrokersTab, { BrokerItem } from "./admin/AdminBrokersTab";
import AdminRolesTab, { TeamMember, RoleDefinition } from "./admin/AdminRolesTab";
import AdminFailedSyncTab, { FailedLeadItem } from "./admin/AdminFailedSyncTab";
import AdminLocationsTab, { AdminLocation } from "./admin/AdminLocationsTab";

type AdminTab = "cases" | "metrics" | "brokers" | "roles" | "failed_sync" | "locations";

export default function AdminPanelSection() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("cases");

  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loadingCases, setLoadingCases] = useState<boolean>(false);

  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState<boolean>(false);

  const [brokers, setBrokers] = useState<BrokerItem[]>([]);
  const [loadingBrokers, setLoadingBrokers] = useState<boolean>(false);

  // Roles & Team
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [roleDefinitions, setRoleDefinitions] = useState<RoleDefinition[]>([]);
  const [loadingRoles, setLoadingRoles] = useState<boolean>(false);

  const [failedLeads, setFailedLeads] = useState<FailedLeadItem[]>([]);
  const [loadingFailedLeads, setLoadingFailedLeads] = useState<boolean>(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string>("");

  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(false);

  const [currentUserRole, setCurrentUserRole] = useState<string>("broker");
  const [error, setError] = useState<string>("");

  const fetchCases = async () => {
    if (!user) return;
    setLoadingCases(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/cases", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar solicitudes.");
      setCases(data.cases || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setError(msg);
    } finally {
      setLoadingCases(false);
    }
  };

  const fetchMetrics = async () => {
    if (!user) return;
    setLoadingMetrics(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/metrics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar métricas.");
      setMetrics(data.metrics || null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setError(msg);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const fetchBrokers = async () => {
    if (!user) return;
    setLoadingBrokers(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/brokers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar brokers.");
      setBrokers(data.brokers || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setError(msg);
    } finally {
      setLoadingBrokers(false);
    }
  };

  const fetchRoles = async () => {
    if (!user) return;
    setLoadingRoles(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/roles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar roles.");
      setTeamMembers(data.teamMembers || []);
      setRoleDefinitions(data.roleDefinitions || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setError(msg);
    } finally {
      setLoadingRoles(false);
    }
  };

  const fetchFailedLeads = async () => {
    if (!user) return;
    setLoadingFailedLeads(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/failed-sync", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar cola de sincronización.");
      setFailedLeads(data.leads || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setError(msg);
    } finally {
      setLoadingFailedLeads(false);
    }
  };

  const fetchLocations = async () => {
    if (!user) return;
    setLoadingLocations(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/locations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar subcuentas GHL.");
      setLocations(data.locations || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setError(msg);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleRetrySync = async (lead: FailedLeadItem) => {
    if (!user) return;
    setRetryingId(lead.id);
    setSyncSuccessMsg("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/retry-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ brokerId: lead.brokerId, clientId: lead.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo sincronizar el lead a GHL.");
      }
      setSyncSuccessMsg(`¡Lead "${lead.name}" sincronizado exitosamente con GHL!`);
      setFailedLeads((prev) => prev.filter((l) => l.id !== lead.id));
      setTimeout(() => setSyncSuccessMsg(""), 4000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al reintentar sincronización.";
      setError(msg);
    } finally {
      setRetryingId(null);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchCases();
    user.getIdToken().then((token) => {
      fetch("/api/broker/profile", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.json())
        .then((data) => {
          const role = data.profile?.role || "broker";
          setCurrentUserRole(role);
          if (role === "admin") {
            fetchBrokers();
          }
        })
        .catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    setError("");
    if (tab === "cases") fetchCases();
    else if (tab === "metrics") fetchMetrics();
    else if (tab === "brokers") fetchBrokers();
    else if (tab === "roles") fetchRoles();
    else if (tab === "failed_sync") fetchFailedLeads();
    else if (tab === "locations") fetchLocations();
  };

  const isRefreshing = loadingCases || loadingMetrics || loadingBrokers || loadingRoles || loadingFailedLeads || loadingLocations;
  const isFullAdmin = currentUserRole === "admin";
  const isSupport = currentUserRole === "support_agent";

  const visibleTabs = [
    { id: "cases", label: isFullAdmin ? "Master Feed de Casos" : "Gestión de Solicitudes", icon: FileSpreadsheet, count: cases.length || undefined, badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
    ...(isFullAdmin ? [
      { id: "roles", label: "Equipo & Roles", icon: ShieldCheck, count: teamMembers.length || undefined, badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
      { id: "metrics", label: "Métricas Globales", icon: BarChart3 },
      { id: "brokers", label: "Roster de Brokers", icon: Users, count: brokers.length || undefined },
    ] : []),
    ...(isFullAdmin || isSupport ? [
      { id: "failed_sync", label: "Cola de Sincronización", icon: AlertTriangle, count: failedLeads.length || undefined, badgeColor: "bg-red-500/20 text-red-400 border-red-500/30" },
    ] : []),
    ...(isFullAdmin ? [
      { id: "locations", label: "Subcuentas GHL", icon: Building2, count: locations.length || undefined },
    ] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header General */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_rgba(0,224,240,0.2)]">
              <Building2 size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                {isFullAdmin ? "Torre de Control E360" : "Panel de Gestión Operativa"}
                <span className="bg-cyan-500/20 text-cyan-400 text-[10px] px-2.5 py-0.5 rounded-full border border-cyan-500/30 uppercase font-mono font-bold tracking-widest">
                  {isFullAdmin ? "Enterprise OS" : currentUserRole.toUpperCase()}
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                {isFullAdmin 
                  ? "Monitoreo general de ventas, roles de empleados, brokers y subcuentas GoHighLevel."
                  : "Gestión de solicitudes y seguimiento operativo de tu vertical asignada."}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => handleTabChange(activeTab)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#05101F] hover:bg-[#0A182D] border border-cyan-500/40 text-cyan-400 font-extrabold rounded-xl text-xs transition-all shadow-sm disabled:opacity-50 self-start md:self-auto"
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-gray-800">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs md:text-sm font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {typeof tab.count === "number" && tab.count > 0 && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${tab.badgeColor || "bg-gray-800 text-gray-300 border-gray-700"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Alertas */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {syncSuccessMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-300">{syncSuccessMsg}</p>
        </div>
      )}

      {/* Vistas por Tab */}
      {activeTab === "cases" && (
        <AdminCasesTab cases={cases} loading={loadingCases} onRefresh={fetchCases} />
      )}
      {activeTab === "roles" && (
        <AdminRolesTab
          teamMembers={teamMembers}
          roleDefinitions={roleDefinitions}
          allBrokers={brokers}
          loading={loadingRoles}
          onRefresh={fetchRoles}
        />
      )}
      {activeTab === "metrics" && <AdminMetricsTab metrics={metrics} loading={loadingMetrics} />}
      {activeTab === "brokers" && <AdminBrokersTab brokers={brokers} loading={loadingBrokers} />}
      {activeTab === "failed_sync" && (
        <AdminFailedSyncTab
          failedLeads={failedLeads}
          loading={loadingFailedLeads}
          retryingId={retryingId}
          onRetrySync={handleRetrySync}
        />
      )}
      {activeTab === "locations" && <AdminLocationsTab locations={locations} loading={loadingLocations} />}
    </div>
  );
}
