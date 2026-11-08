"use client";

import { useState, useMemo } from "react";
import { Plus, CheckCircle2, Clock, X, Link2, FileX, Ban } from "lucide-react";
import { TaxInvoice, TaxInvoiceStatus, NewTaxInvoiceInput, TaxCase, TaxClient } from "../../types";

interface TaxOfficeInvoicesTabProps {
  invoices: TaxInvoice[];
  cases: TaxCase[];
  clients: TaxClient[];
  onAddInvoice: (input: NewTaxInvoiceInput) => Promise<boolean>;
  onUpdateStatus: (invoiceId: string, status: TaxInvoiceStatus) => void;
}

const NEXT_STATUS_OPTIONS: Record<TaxInvoiceStatus, TaxInvoiceStatus[]> = {
  draft: ["sent", "cancelled"],
  sent: ["paid", "failed", "cancelled"],
  paid: ["refunded"],
  failed: ["sent", "cancelled"],
  refunded: [],
  cancelled: []
};

const STATUS_TABS: { id: TaxInvoiceStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "sent", label: "Sent" },
  { id: "paid", label: "Paid" },
  { id: "failed", label: "Failed" },
  { id: "refunded", label: "Refunded" },
  { id: "cancelled", label: "Cancelled" },
];

function statusBadge(status: TaxInvoiceStatus) {
  switch (status) {
    case "paid":
      return { icon: CheckCircle2, cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Pagado" };
    case "sent":
      return { icon: Clock, cls: "bg-amber-500/10 text-amber-400 border-amber-500/20", label: "Enviada" };
    case "draft":
      return { icon: Clock, cls: "bg-gray-500/10 text-gray-400 border-gray-500/20", label: "Borrador" };
    case "failed":
      return { icon: FileX, cls: "bg-red-500/10 text-red-400 border-red-500/20", label: "Fallida" };
    case "refunded":
      return { icon: Link2, cls: "bg-purple-500/10 text-purple-400 border-purple-500/20", label: "Reembolsada" };
    case "cancelled":
      return { icon: Ban, cls: "bg-gray-700/20 text-gray-500 border-gray-700/40", label: "Cancelada" };
    default:
      // Facturas reales creadas antes de este cambio de esquema (versión
      // previa de TaxInvoiceStatus) pueden tener valores legacy como
      // "pending"/"overdue" todavía guardados en Firestore — sin este
      // fallback, abrir la pestaña con una de esas facturas tira la UI entera.
      return { icon: Clock, cls: "bg-gray-500/10 text-gray-400 border-gray-500/20", label: String(status) };
  }
}

export default function TaxOfficeInvoicesTab({ invoices, cases, clients, onAddInvoice, onUpdateStatus }: TaxOfficeInvoicesTabProps) {
  const [statusFilter, setStatusFilter] = useState<TaxInvoiceStatus | "all">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [caseId, setCaseId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(350);
  const [dueDate, setDueDate] = useState(() => new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]);
  const [status, setStatus] = useState<Extract<TaxInvoiceStatus, "draft" | "sent">>("sent");
  const [paymentMethod, setPaymentMethod] = useState<TaxInvoice["paymentMethod"]>("refund_deduction");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  const totalBilled = invoices.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((acc, curr) => acc + curr.amount, 0);
  const totalOutstanding = invoices.filter((i) => i.status === "sent").reduce((acc, curr) => acc + curr.amount, 0);

  const filteredInvoices = useMemo(() => (statusFilter === "all" ? invoices : invoices.filter((i) => i.status === statusFilter)), [invoices, statusFilter]);

  const handleSelectClient = (id: string) => {
    setClientId(id);
    const c = clients.find((cl) => cl.id === id);
    if (c) {
      setClientName(c.name);
      setClientEmail(c.email);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    setIsSubmitting(true);
    const input: NewTaxInvoiceInput = {
      clientId: clientId || undefined,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim() || "cliente@gmail.com",
      caseId: caseId || undefined,
      description: description.trim(),
      amount: Number(amount) || 0,
      paymentMethod,
      taxYear: new Date().getFullYear(),
      status,
      dueDate
    };

    const success = await onAddInvoice(input);
    setIsSubmitting(false);
    if (success) {
      setIsModalOpen(false);
      setClientId("");
      setClientName("");
      setClientEmail("");
      setCaseId("");
      setDescription("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
          <span className="text-[10px] uppercase font-bold text-gray-400">Total Facturado</span>
          <p className="text-2xl font-black text-white mt-1">{formatMoney(totalBilled)}</p>
          <span className="text-[11px] text-gray-500">{invoices.length} facturas generadas</span>
        </div>
        <div className="p-5 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
          <span className="text-[10px] uppercase font-bold text-gray-400">Cobrado (Pagado)</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{formatMoney(totalPaid)}</p>
          <span className="text-[11px] text-emerald-500/80">Liquidado en cuenta o banco fiscal</span>
        </div>
        <div className="p-5 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
          <span className="text-[10px] uppercase font-bold text-gray-400">Pendiente de Cobro</span>
          <p className="text-2xl font-black text-amber-400 mt-1">{formatMoney(totalOutstanding)}</p>
          <span className="text-[11px] text-amber-500/80">Facturas enviadas, sin pagar</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors shrink-0 cursor-pointer ${
                statusFilter === tab.id ? "bg-cyan-500/20 text-cyan-300 border-cyan-400" : "bg-[#05101F] text-gray-400 border-gray-800 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,224,240,0.3)] flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Nueva Factura</span>
        </button>
      </div>

      <div className="p-6 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                <th className="py-3 pl-2">Factura #</th>
                <th className="py-3">Cliente</th>
                <th className="py-3">Caso</th>
                <th className="py-3">Monto</th>
                <th className="py-3">Fecha Vencimiento</th>
                <th className="py-3">Estado</th>
                <th className="py-3 text-right pr-2">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 italic">
                    No hay facturas en este estado.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const badge = statusBadge(inv.status);
                  const Icon = badge.icon;
                  const linkedCase = cases.find((c) => c.id === inv.caseId);
                  // Fallback para facturas reales con un valor de status legacy
                  // (de antes de este cambio de esquema, ej. "pending"/"overdue")
                  // que ya no tiene entrada en NEXT_STATUS_OPTIONS — se le da una
                  // salida razonable en vez de dejarla sin forma de corregirse.
                  const nextOptions = NEXT_STATUS_OPTIONS[inv.status] || (["sent", "paid", "cancelled"] as TaxInvoiceStatus[]);
                  return (
                    <tr key={inv.id} className="hover:bg-gray-900/40 transition-colors">
                      <td className="py-3.5 pl-2 font-mono font-bold text-cyan-400">{inv.invoiceNumber}</td>
                      <td className="py-3.5">
                        <div className="font-bold text-white">{inv.clientName}</div>
                        <div className="text-[10px] text-gray-500">{inv.clientEmail}</div>
                        {inv.description && <div className="text-[10px] text-gray-400 mt-0.5">{inv.description}</div>}
                      </td>
                      <td className="py-3.5 text-gray-400 text-[11px]">{linkedCase ? linkedCase.id : "—"}</td>
                      <td className="py-3.5 font-bold text-emerald-400">{formatMoney(inv.amount)}</td>
                      <td className="py-3.5 font-mono text-gray-400">{inv.dueDate}</td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.cls}`}>
                          <Icon size={11} /> {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 text-right pr-2">
                        {nextOptions.length > 0 && (
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) onUpdateStatus(inv.id, e.target.value as TaxInvoiceStatus);
                            }}
                            className="bg-[#05101F] border border-gray-800 rounded-lg px-2 py-1 text-[10px] text-cyan-400 outline-none cursor-pointer"
                          >
                            <option value="">Cambiar estado...</option>
                            {nextOptions.map((opt) => (
                              <option key={opt} value={opt}>
                                {statusBadge(opt).label}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0A182D] border border-cyan-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[#05101F]">
              <h3 className="font-bold text-sm text-white">Emitir Factura de Honorarios</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Client</label>
                <select
                  value={clientId}
                  onChange={(e) => handleSelectClient(e.target.value)}
                  className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                >
                  <option value="">— Nuevo cliente (escribir manualmente) —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {!clientId && (
                <>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Nombre del Contribuyente</label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ej. Roberto Silva"
                      className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="cliente@gmail.com"
                      className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Case details (optional)</label>
                <select
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                >
                  <option value="">Sin vincular a un caso</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} — {c.clientName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej. Preparación 1040 año fiscal 2025"
                  className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Amount (USD)</label>
                  <input
                    type="number"
                    min="0"
                    step="25"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Due date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Método de Cobro</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as TaxInvoice["paymentMethod"])}
                  className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                >
                  <option value="refund_deduction">Descuento de Reembolso (Banco Fiscal)</option>
                  <option value="card">Tarjeta de Crédito / Débito</option>
                  <option value="zelle">Zelle / Transferencia</option>
                  <option value="cash">Efectivo en Oficina</option>
                </select>
                {paymentMethod === "card" && (
                  <p className="text-[10px] text-amber-400 mt-1.5 flex items-center gap-1">
                    <Link2 size={11} />
                    El link de pago seguro (Stripe) todavía no está conectado — por ahora registra el cobro manualmente cuando se reciba.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Status</label>
                <div className="flex items-center gap-2">
                  {(["draft", "sent"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold capitalize cursor-pointer ${status === s ? "bg-cyan-500/20 text-cyan-300" : "bg-[#05101F] text-gray-500"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-700 text-gray-300 rounded-xl font-semibold hover:bg-gray-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-cyan-500 text-black font-extrabold rounded-xl hover:bg-cyan-400 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Generando..." : "Generar Factura"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
