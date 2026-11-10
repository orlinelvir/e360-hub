"use client";

import { useEffect, useState } from "react";
import { X, Copy, Check, Loader2, Building2, ChevronRight, ChevronLeft } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { BusinessCreditIntake } from "../types";

interface BusinessCreditIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BusinessCreditIntakeModal({ isOpen, onClose }: BusinessCreditIntakeModalProps) {
  const { user } = useAuth();
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [intakes, setIntakes] = useState<BusinessCreditIntake[]>([]);
  const [selected, setSelected] = useState<BusinessCreditIntake | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !user) return;
    (async () => {
      setIsLoading(true);
      setError("");
      try {
        const token = await user.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };
        const [linkRes, intakesRes] = await Promise.all([
          fetch("/api/business-credit-intake/link", { headers }),
          fetch("/api/business-credit-intake", { headers })
        ]);
        const linkData = await linkRes.json();
        const intakesData = await intakesRes.json();
        if (linkRes.ok) setLink(`${window.location.origin}/business-credit-intake/${linkData.token}`);
        if (intakesRes.ok) setIntakes(intakesData.intakes || []);
        if (!linkRes.ok || !intakesRes.ok) setError("No se pudo cargar la información. Intenta de nuevo.");
      } catch {
        setError("No se pudo cargar la información. Intenta de nuevo.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!link) return;
    navigator.clipboard?.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0A182D] border border-cyan-500/30 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[#05101F]">
          <div className="flex items-center gap-2.5">
            <Building2 size={18} className="text-cyan-400" />
            <div>
              <h3 className="font-bold text-sm text-white">Business Credit Program</h3>
              <p className="text-[11px] text-gray-400">Formulario de captura para DUNS y vendor accounts</p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelected(null);
              onClose();
            }}
            className="text-gray-400 hover:text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {selected ? (
            <IntakeDetail intake={selected} onBack={() => setSelected(null)} />
          ) : (
            <>
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                <p className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2">Tu link para clientes</p>
                <p className="text-[11px] text-gray-300 mb-3">
                  Un solo link permanente — mándaselo a cualquier cliente que necesite tramitar su DUNS, sin límite de usos.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={isLoading ? "Generando link..." : link}
                    className="flex-1 bg-[#05101F] border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none font-mono"
                  />
                  <button
                    onClick={handleCopy}
                    disabled={!link}
                    className="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copied ? "Copiado" : "Copiar"}</span>
                  </button>
                </div>
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-white mb-3">
                  Capturas recibidas ({intakes.length})
                </h4>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    <Loader2 size={20} className="animate-spin" />
                  </div>
                ) : intakes.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center">
                    Todavía no has recibido ninguna captura. Comparte el link de arriba con tu cliente.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {intakes.map((intake) => (
                      <button
                        key={intake.id}
                        onClick={() => setSelected(intake)}
                        className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#05101F] border border-gray-800 hover:border-cyan-500/40 transition-colors text-left cursor-pointer group"
                      >
                        <div>
                          <p className="text-sm font-bold text-white">{intake.ownerFullName}</p>
                          <p className="text-[11px] text-gray-500">
                            {intake.businessLegalName} · {new Date(intake.submittedAt).toLocaleDateString("es-US")}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-gray-600 group-hover:text-white transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function IntakeDetail({ intake, onBack }: { intake: BusinessCreditIntake; onBack: () => void }) {
  const rows: [string, string][] = [
    ["Propietario", intake.ownerFullName],
    ["Dirección personal", `${intake.ownerAddress}, ${intake.ownerCity}, ${intake.ownerState} ${intake.ownerZip}`],
    ["Empresa", intake.businessLegalName],
    ["Dirección comercial", `${intake.businessAddress}, ${intake.businessCity}, ${intake.businessState} ${intake.businessZip}`],
    ["EIN", intake.ein],
    ["Correo de contacto", intake.contactEmail || "—"],
    ["Teléfono de contacto", intake.contactPhone || "—"],
    ["Recibido", new Date(intake.submittedAt).toLocaleString("es-US")]
  ];
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer">
        <ChevronLeft size={14} />
        <span>Volver a la lista</span>
      </button>
      <div className="space-y-2.5">
        {rows.map(([label, value]) => (
          <div key={label} className="p-3 rounded-xl bg-[#05101F] border border-gray-800">
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">{label}</p>
            <p className="text-sm text-white mt-0.5">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
