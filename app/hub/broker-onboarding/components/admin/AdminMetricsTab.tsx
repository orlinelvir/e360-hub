"use client";

import { BarChart3, DollarSign, TrendingUp, Users, Layers, Loader2 } from "lucide-react";

export interface MetricsData {
  totalBrokers: number;
  connectedBrokers: number;
  totalLeads: number;
  totalVolume: number;
  estimatedCommissions: number;
  syncHealth: {
    synced: number;
    failed: number;
  };
  clusterStats: Record<string, { count: number; volume: number }>;
}

interface AdminMetricsTabProps {
  metrics: MetricsData | null;
  loading: boolean;
}

export default function AdminMetricsTab({ metrics, loading }: AdminMetricsTabProps) {
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-gray-400 text-sm flex items-center justify-center gap-3">
        <Loader2 size={20} className="animate-spin text-cyan-400" />
        <span>Calculando métricas globales de E360...</span>
      </div>
    );
  }

  if (!metrics) {
    return <div className="py-12 text-center text-gray-500">No se pudieron cargar las métricas.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas Principales de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0A182D]/70 border border-gray-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider">Volumen Generado</span>
            <TrendingUp size={16} className="text-emerald-400" />
          </div>
          <p className="text-2xl lg:text-3xl font-extrabold text-white">{formatMoney(metrics.totalVolume)}</p>
          <p className="text-[11px] text-gray-500 mt-1">Suma total de préstamos y casos</p>
        </div>

        <div className="bg-[#0A182D]/70 border border-gray-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider">Comisiones Estimadas</span>
            <DollarSign size={16} className="text-cyan-400" />
          </div>
          <p className="text-2xl lg:text-3xl font-extrabold text-cyan-400">{formatMoney(metrics.estimatedCommissions)}</p>
          <p className="text-[11px] text-gray-500 mt-1">Estimado global para brokers</p>
        </div>

        <div className="bg-[#0A182D]/70 border border-gray-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider">Brokers Registrados</span>
            <Users size={16} className="text-purple-400" />
          </div>
          <p className="text-2xl lg:text-3xl font-extrabold text-white">
            {metrics.totalBrokers}
            <span className="text-xs text-emerald-400 ml-2 font-normal">({metrics.connectedBrokers} con CRM)</span>
          </p>
          <p className="text-[11px] text-gray-500 mt-1">Roster oficial en Firestore</p>
        </div>

        <div className="bg-[#0A182D]/70 border border-gray-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider">Salud de Sincronización</span>
            <Layers size={16} className="text-blue-400" />
          </div>
          <p className="text-2xl lg:text-3xl font-extrabold text-white">
            {metrics.syncHealth.synced}
            {metrics.syncHealth.failed > 0 && (
              <span className="text-xs text-red-400 ml-2 font-bold font-mono">({metrics.syncHealth.failed} fallos)</span>
            )}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">Leads sincronizados a GHL</p>
        </div>
      </div>

      {/* Distribución por Cluster */}
      <div className="bg-[#0A182D]/50 border border-gray-800 rounded-3xl p-6 lg:p-8">
        <h3 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
          <Layers size={18} className="text-cyan-400" />
          <span>Distribución de Casos por Cluster de Negocio</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { id: "fondeo_rapido", label: "Fondeo Rápido", color: "border-blue-500/40 text-blue-400" },
            { id: "real_estate", label: "Real Estate", color: "border-emerald-500/40 text-emerald-400" },
            { id: "credit_repair", label: "Reparación Crédito", color: "border-purple-500/40 text-purple-400" },
            { id: "seguros", label: "Seguros", color: "border-cyan-500/40 text-cyan-400" },
            { id: "corporativo", label: "Corporativo & Legal", color: "border-amber-500/40 text-amber-400" },
          ].map((cluster) => {
            const stat = metrics.clusterStats[cluster.id] || { count: 0, volume: 0 };
            return (
              <div key={cluster.id} className={`bg-[#05101F] border ${cluster.color.split(' ')[0]} rounded-2xl p-4 flex flex-col justify-between`}>
                <span className={`text-[10px] font-mono font-bold uppercase ${cluster.color.split(' ')[1]}`}>
                  {cluster.label}
                </span>
                <div className="mt-3">
                  <p className="text-2xl font-extrabold text-white">{stat.count} <span className="text-xs text-gray-500 font-normal">leads</span></p>
                  <p className="text-xs text-gray-400 mt-1">{formatMoney(stat.volume)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
