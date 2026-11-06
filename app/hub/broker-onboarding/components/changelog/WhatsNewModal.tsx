"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  Sparkles,
  FileSignature,
  KanbanSquare,
  ListChecks,
  MessageCircle,
  Landmark,
  ScanSearch,
  BookOpen,
  Award,
  ShieldCheck,
  Trash2,
  UserCheck,
  Building2,
  Activity,
  HandCoins,
  Calculator,
  RefreshCcw,
  Edit3,
  ArrowUpDown,
  Megaphone,
  Rows3,
  LayoutDashboard,
  KeyRound,
  Mail,
  Umbrella,
  ClipboardCheck,
  BarChart3,
  IdCard,
  PartyPopper,
  X
} from "lucide-react";
import { ChangelogEntry } from "@/lib/changelog";

const ICON_MAP: Record<string, typeof Sparkles> = {
  Sparkles,
  FileSignature,
  KanbanSquare,
  ListChecks,
  MessageCircle,
  Landmark,
  ScanSearch,
  BookOpen,
  Award,
  ShieldCheck,
  Trash2,
  UserCheck,
  Building2,
  Activity,
  HandCoins,
  Calculator,
  RefreshCcw,
  Edit3,
  ArrowUpDown,
  Megaphone,
  Rows3,
  LayoutDashboard,
  KeyRound,
  Mail,
  Umbrella,
  ClipboardCheck,
  BarChart3,
  IdCard
};

export default function WhatsNewModal() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ChangelogEntry[] | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/changelog", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!cancelled && res.ok && Array.isArray(data.entries) && data.entries.length > 0) {
          setEntries(data.entries);
        }
      } catch {
        // si falla, simplemente no se muestra el popup — nunca debe bloquear el Hub
      }
    })();
    return () => {
      cancelled = true;
    };
    // Solo una vez por sesión de Hub cargada, no en cada cambio de props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleClose() {
    if (!entries || entries.length === 0) {
      setEntries(null);
      return;
    }
    const latestId = Math.max(...entries.map((e) => e.id));
    setEntries(null);
    try {
      if (!user) return;
      const token = await user.getIdToken();
      await fetch("/api/changelog/mark-seen", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: latestId })
      });
    } catch {
      // si falla el guardado, en el peor caso vuelve a aparecer la próxima vez — no es grave
    }
  }

  if (!entries || entries.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0A182D] border border-cyan-500/30 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-5 border-b border-gray-800 bg-gradient-to-r from-[#0A182D] to-[#102747] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <PartyPopper size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Novedades del Hub</h3>
              <p className="text-xs text-gray-400">Esto cambió desde tu última visita</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3">
          {entries.map((entry) => {
            const Icon = ICON_MAP[entry.icon] || Sparkles;
            return (
              <div key={entry.id} className="flex items-start gap-3.5 p-4 bg-[#05101F] border border-gray-800 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Icon size={17} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">{entry.title}</p>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">{entry.description}</p>
                  {entry.tabHint && (
                    <p className="text-[11px] text-cyan-400 mt-1.5 font-semibold">📍 {entry.tabHint}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-gray-800 bg-[#05101F] shrink-0">
          <button
            onClick={handleClose}
            className="w-full px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black uppercase tracking-wider text-xs rounded-xl shadow-[0_0_20px_rgba(0,224,240,0.3)] transition-all cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
