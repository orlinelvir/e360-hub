"use client";

import { useState, useEffect } from "react";
import { Building2, Users, AlertTriangle, BarChart3, RefreshCw, AlertCircle, CheckCircle2, FileSpreadsheet, ShieldCheck, Ticket, Tag, UserCheck, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import AdminCasesTab, { CaseItem } from "./admin/AdminCasesTab";
import AdminMetricsTab, { MetricsData } from "./admin/AdminMetricsTab";
import AdminBrokersTab, { BrokerItem } from "./admin/AdminBrokersTab";
import AdminRolesTab, { TeamMember, RoleDefinition } from "./admin/AdminRolesTab";
import AdminFailedSyncTab, { FailedLeadItem } from "./admin/AdminFailedSyncTab";
import AdminLocationsTab, { AdminLocation } from "./admin/AdminLocationsTab";
import AdminTicketsTab, { AdminTicketItem } from "./admin/AdminTicketsTab";
import AdminServicesTab from "./admin/AdminServicesTab";
import AdminStaffActivityTab, { StaffActivityItem, BacklogByCluster } from "./admin/AdminStaffActivityTab";
import AdminOverviewTab from "./admin/AdminOverviewTab";
import { useHubHeaderOffset } from "../hooks/useHubHeaderOffset";

type AdminTab = "overview" | "cases" | "metrics" | "brokers" | "roles" | "failed_sync" | "locations" | "tickets" | "services" | "staff_activity";

export default function AdminPanelSection() {
  const { user } = useAuth();
  const headerOffset = useHubHeaderOffset();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  // Para saltar de "casos atrasados" en Actividad del Staff directo al caso
  // en la pestaña de Casos, en vez de solo mostrar el nombre sin acción posible.
  const [focusCase, setFocusCase] = useState<{ brokerId: string; clientId: string } | null>(null);
  const handleOpenStaleCase = (brokerId: string, clientId: string) => {
    setFocusCase({ brokerId, clientId });
    setActiveTab("cases");
  };

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

  const [tickets, setTickets] = useState<AdminTicketItem[]>([]);
  const [loadingTickets, setLoadingTickets] = useState<boolean>(false);

  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(false);

  const [staffActivity, setStaffActivity] = useState<StaffActivityItem[]>([]);
  const [backlogByCluster, setBacklogByCluster] = useState<BacklogByCluster>({});
  const [staffActivityWindow, setStaffActivityWindow] = useState<number>(7);
  const [loadingStaffActivity, setLoadingStaffActivity] = useState<boolean>(false);

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

  const fetchStaffActivity = async (days: number = staffActivityWindow) => {
    if (!user) return;
    setLoadingStaffActivity(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/staff-activity?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar la actividad del staff.");
      setStaffActivity(data.staff || []);
      setBacklogByCluster(data.backlogByCluster || {});
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setError(msg);
    } finally {
      setLoadingStaffActivity(false);
    }
  };

  const handleChangeStaffActivityWindow = (days: number) => {
    setStaffActivityWindow(days);
    fetchStaffActivity(days);
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

  const fetchTickets = async () => {
    if (!user) return;
    setLoadingTickets(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/tickets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar tickets.");
      setTickets(data.tickets || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setError(msg);
    } finally {
      setLoadingTickets(false);
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
    setTimeout(() => {
      if (!user) return;
      fetchCases();
      user.getIdToken().then((token) => {
        fetch("/api/broker/profile", { headers: { Authorization: `Bearer ${token}` } })
          .then((res) => res.json())
          .then((data) => {
            const role = data.profile?.role || "broker";
            setCurrentUserRole(role);
            // Precarga lo que necesita el Resumen (nuevo tab por defecto) según
            // rol, en vez de esperar a que el usuario visite cada tab manualmente.
            if (role === "admin") {
              fetchBrokers();
              fetchStaffActivity();
            }
            if (role === "admin" || role === "support_agent") {
              fetchTickets();
              fetchFailedLeads();
            }
          })
          .catch(() => {});
      });
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const isFullAdmin = currentUserRole === "admin";
  const isSupport = currentUserRole === "support_agent";
  const isOnboardingMember = currentUserRole === "onboarding_member";

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    setError("");
    if (tab === "overview") {
      fetchCases();
      if (isFullAdmin) fetchStaffActivity();
      if (isFullAdmin || isSupport) {
        fetchTickets();
        fetchFailedLeads();
      }
    }
    else if (tab === "cases") fetchCases();
    else if (tab === "metrics") fetchMetrics();
    else if (tab === "brokers") fetchBrokers();
    else if (tab === "roles") fetchRoles();
    else if (tab === "failed_sync") fetchFailedLeads();
    else if (tab === "locations") fetchLocations();
    else if (tab === "tickets") fetchTickets();
    else if (tab === "staff_activity") fetchStaffActivity();
  };

  const handleGoToTab = (tab: "cases" | "tickets" | "failed_sync") => handleTabChange(tab);

  const isRefreshing = loadingCases || loadingMetrics || loadingBrokers || loadingRoles || loadingFailedLeads || loadingLocations || loadingTickets || loadingStaffActivity;

  const navGroups = [
    {
      id: "operacion",
      label: "Operación diaria",
      items: [
        { id: "overview", label: "Resumen", icon: LayoutDashboard, count: undefined, badgeColor: undefined },
        { id: "cases", label: isFullAdmin ? "Master Feed de Casos" : "Gestión de Solicitudes", icon: FileSpreadsheet, count: cases.length || undefined, badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
        ...(isFullAdmin || isSupport ? [
          { id: "tickets", label: "Tickets de Brokers", icon: Ticket, count: tickets.filter((t) => t.status !== "resolved").length || undefined, badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
        ] : []),
        ...(isFullAdmin ? [
          { id: "staff_activity", label: "Actividad del Staff", icon: UserCheck, count: undefined, badgeColor: undefined },
        ] : []),
        ...(isFullAdmin || isSupport ? [
          { id: "failed_sync", label: "Cola de Sincronización", icon: AlertTriangle, count: failedLeads.length || undefined, badgeColor: "bg-red-500/20 text-red-400 border-red-500/30" },
        ] : []),
      ],
    },
    {
      id: "equipo",
      label: "Equipo",
      items: [
        ...(isFullAdmin || isOnboardingMember ? [
          { id: "brokers", label: "Roster de Brokers", icon: Users, count: brokers.length || undefined, badgeColor: undefined },
        ] : []),
        ...(isFullAdmin ? [
          { id: "roles", label: "Equipo & Roles", icon: ShieldCheck, count: teamMembers.length || undefined, badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
        ] : []),
      ],
    },
    {
      id: "configuracion",
      label: "Configuración",
      items: [
        ...(isFullAdmin ? [
          { id: "services", label: "Catálogo de Servicios", icon: Tag, count: undefined, badgeColor: undefined },
        ] : []),
        ...(isFullAdmin || isOnboardingMember ? [
          { id: "locations", label: "Subcuentas GHL", icon: Building2, count: locations.length || undefined, badgeColor: undefined },
        ] : []),
        ...(isFullAdmin ? [
          { id: "metrics", label: "Métricas Globales", icon: BarChart3, count: undefined, badgeColor: undefined },
        ] : []),
      ],
    },
  ].filter((group) => group.items.length > 0);

  const overviewLoading =
    loadingCases ||
    (isFullAdmin && loadingStaffActivity) ||
    ((isFullAdmin || isSupport) && (loadingTickets || loadingFailedLeads));

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

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar de navegación, agrupada por categoría */}
        <nav
          className="lg:w-64 xl:w-72 shrink-0 space-y-5 lg:sticky lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto"
          style={{ top: headerOffset + 16 }}
        >
          {navGroups.map((group) => (
            <div key={group.id}>
              <p className="px-3 mb-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id as AdminTab)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors border ${
                        isActive
                          ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                          : "border-transparent text-gray-400 hover:text-white hover:bg-[#0A182D]/60"
                      }`}
                    >
                      <Icon size={16} className="shrink-0" />
                      <span className="flex-1 text-left truncate">{tab.label}</span>
                      {typeof tab.count === "number" && tab.count > 0 && (
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${tab.badgeColor || "bg-gray-800 text-gray-300 border-gray-700"}`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="flex-1 min-w-0 space-y-6">
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
          {activeTab === "overview" && (
            <AdminOverviewTab
              cases={cases}
              tickets={tickets}
              failedLeads={failedLeads}
              backlogByCluster={backlogByCluster}
              isFullAdmin={isFullAdmin}
              isSupport={isSupport}
              loading={overviewLoading}
              onOpenCase={handleOpenStaleCase}
              onGoToTab={handleGoToTab}
            />
          )}
          {activeTab === "cases" && (
            <AdminCasesTab
              cases={cases}
              loading={loadingCases}
              onRefresh={fetchCases}
              focusCase={focusCase}
              onFocusCaseHandled={() => setFocusCase(null)}
            />
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
          {activeTab === "brokers" && <AdminBrokersTab brokers={brokers} loading={loadingBrokers} onRefresh={fetchBrokers} />}
          {activeTab === "failed_sync" && (
            <AdminFailedSyncTab
              failedLeads={failedLeads}
              loading={loadingFailedLeads}
              retryingId={retryingId}
              onRetrySync={handleRetrySync}
            />
          )}
          {activeTab === "locations" && <AdminLocationsTab locations={locations} loading={loadingLocations} />}
          {activeTab === "tickets" && (
            <AdminTicketsTab tickets={tickets} loading={loadingTickets} onRefresh={fetchTickets} />
          )}
          {activeTab === "services" && <AdminServicesTab />}
          {activeTab === "staff_activity" && (
            <AdminStaffActivityTab
              staff={staffActivity}
              backlogByCluster={backlogByCluster}
              windowDays={staffActivityWindow}
              loading={loadingStaffActivity}
              onChangeWindow={handleChangeStaffActivityWindow}
              onOpenCase={handleOpenStaleCase}
            />
          )}
        </div>
      </div>
    </div>
  );
}
