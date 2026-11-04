"use client";

import { useState } from "react";
import { Plus, CheckCircle2, Clock, X } from "lucide-react";
import { TaxInvoice, NewTaxInvoiceInput } from "../../types";

interface TaxOfficeInvoicesTabProps {
  invoices: TaxInvoice[];
  onAddInvoice: (input: NewTaxInvoiceInput) => Promise<boolean>;
}

export default function TaxOfficeInvoicesTab({ invoices, onAddInvoice }: TaxOfficeInvoicesTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [amount, setAmount] = useState<number>(350);
  const [paymentMethod, setPaymentMethod] = useState<TaxInvoice["paymentMethod"]>("refund_deduction");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  const totalBilled = invoices.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((acc, curr) => acc + curr.amount, 0);
  const totalPending = invoices.filter((i) => i.status === "pending").reduce((acc, curr) => acc + curr.amount, 0);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    setIsSubmitting(true);
    const input: NewTaxInvoiceInput = {
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim() || "cliente@gmail.com",
      amount: Number(amount) || 0,
      paymentMethod,
      taxYear: new Date().getFullYear(),
    };

    const success = await onAddInvoice(input);
    setIsSubmitting(false);
    if (success) {
      setIsModalOpen(false);
      setClientName("");
      setClientEmail("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumen de Facturación */}
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
          <p className="text-2xl font-black text-amber-400 mt-1">{formatMoney(totalPending)}</p>
          <span className="text-[11px] text-amber-500/80">Sujeto a desembolso del IRS / Banco</span>
        </div>
      </div>

      {/* Lista de Facturas */}
      <div className="p-6 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
              Historial de Facturación Fiscal
            </h3>
            <p className="text-xs text-gray-400">Control de honorarios de preparación de impuestos</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,224,240,0.3)] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Nueva Factura</span>
          </button>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                <th className="py-3 pl-2">Factura #</th>
                <th className="py-3">Cliente</th>
                <th className="py-3">Monto</th>
                <th className="py-3">Método de Pago</th>
                <th className="py-3">Fecha Vencimiento</th>
                <th className="py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-900/40 transition-colors">
                  <td className="py-3.5 pl-2 font-mono font-bold text-cyan-400">{inv.invoiceNumber}</td>
                  <td className="py-3.5">
                    <div className="font-bold text-white">{inv.clientName}</div>
                    <div className="text-[10px] text-gray-500">{inv.clientEmail}</div>
                  </td>
                  <td className="py-3.5 font-bold text-emerald-400">{formatMoney(inv.amount)}</td>
                  <td className="py-3.5 capitalize text-gray-300">
                    {inv.paymentMethod === "refund_deduction" ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-semibold">
                        Deducción de Reembolso
                      </span>
                    ) : inv.paymentMethod === "card" ? (
                      "Tarjeta Crédito/Débito"
                    ) : (
                      inv.paymentMethod
                    )}
                  </td>
                  <td className="py-3.5 font-mono text-gray-400">{inv.dueDate}</td>
                  <td className="py-3.5">
                    {inv.status === "paid" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 size={11} /> Pagado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Clock size={11} /> Pendiente
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Factura */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0A182D] border border-cyan-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[#05101F]">
              <h3 className="font-bold text-sm text-white">Emitir Factura de Honorarios</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 text-xs">
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

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Monto de Honorario ($)</label>
                <input
                  type="number"
                  min="50"
                  step="25"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Método de Cobro</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as TaxInvoice["paymentMethod"])}
                  className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                >
                  <option value="refund_deduction">Descuento de Reembolso (Banco Fiscal)</option>
                  <option value="card">Tarjeta de Crédito / Débito (Stripe)</option>
                  <option value="zelle">Zelle / Transferencia</option>
                  <option value="cash">Efectivo en Oficina</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-700 text-gray-300 rounded-xl font-semibold hover:bg-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-cyan-500 text-black font-extrabold rounded-xl hover:bg-cyan-400 disabled:opacity-50"
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
