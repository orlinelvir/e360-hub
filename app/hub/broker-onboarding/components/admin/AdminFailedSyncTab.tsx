"use client";

import { AlertTriangle, CheckCircle2, Loader2, RotateCcw } from "lucide-react";

export interface FailedLeadItem {
  id: string;
  brokerId: string;
  brokerName: string;
  name: string;
  email: string;
  phone: string;
  serviceName: string;
  serviceId?: string;
  amount: number;
  status: string;
  createdAt: string;
  notes: string;
}

interface AdminFailedSyncTabProps {
  failedLeads: FailedLeadItem[];
  loading: boolean;
  retryingId: string | null;
  onRetrySync: (lead: FailedLeadItem) => void;
}

export default function AdminFailedSyncTab({
  failedLeads,
  loading,
  retryingId,
  onRetrySync,
}: AdminFailedSyncTabProps) {
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">Recuperación de Leads no Sincronizados</h4>
          <p className="text-xs text-amber-200/80 mt-1">
            Aquí figuran los clientes que se guardaron en la base de datos de E360 pero que no pudieron crearse en el CRM de GoHighLevel (ej: si la subcuenta del broker no tenía API Key configurada al momento del ingreso). Puedes reintentar la sincronización en 1 clic.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm flex items-center justify-center gap-3">
          <Loader2 size={18} className="animate-spin text-cyan-400" />
          <span>Verificando cola de sincronización...</span>
        </div>
      ) : failedLeads.length === 0 ? (
        <div className="py-16 text-center text-gray-400 bg-[#0A182D]/40 border border-gray-800 rounded-2xl">
          <CheckCircle2 size={36} className="mx-auto text-emerald-400 mb-3" />
          <h4 className="text-base font-bold text-white">¡Todos los leads están al día!</h4>
          <p className="text-xs text-gray-500 mt-1">No hay leads pendientes ni fallidos en la cola de GoHighLevel.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {failedLeads.map((lead) => (
            <div
              key={lead.id}
              className="bg-[#05101F] border border-red-500/30 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-md text-[9px] font-bold uppercase font-mono">
                    {lead.status}
                  </span>
                  <span className="text-xs font-bold text-white">{lead.name}</span>
                  <span className="text-[11px] text-gray-400 font-mono">({lead.serviceName})</span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                  <span>Email: <strong className="text-gray-300">{lead.email}</strong></span>
                  {lead.phone && <span>Tel: <strong className="text-gray-300">{lead.phone}</strong></span>}
                  <span>Monto: <strong className="text-emerald-400 font-mono">{formatMoney(lead.amount)}</strong></span>
                  <span>Broker: <strong className="text-cyan-400">{lead.brokerName}</strong></span>
                </div>
              </div>

              <button
                onClick={() => onRetrySync(lead)}
                disabled={retryingId === lead.id}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shrink-0 shadow-sm disabled:opacity-50"
              >
                {retryingId === lead.id ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Sincronizando...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw size={14} />
                    <span>Reintentar a GHL</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
