"use client";

import { useState, useMemo } from "react";
import { Plus, CalendarClock, X, Tag, Video, Phone as PhoneIcon, MapPin } from "lucide-react";
import { TaxAppointment, TaxAppointmentIntegration, NewTaxAppointmentInput, TaxClient } from "../../types";

interface TaxOfficeAppointmentsTabProps {
  appointments: TaxAppointment[];
  clients: TaxClient[];
  onAddAppointment: (input: NewTaxAppointmentInput) => Promise<boolean>;
}

type ViewMode = "list" | "day" | "calendar";

const PRESET_LABELS = ["Consulta", "Firma de Contrato", "Seguimiento", "Entrega de Documentos"];

function todayISODate() {
  return new Date().toISOString().split("T")[0];
}

export default function TaxOfficeAppointmentsTab({ appointments, clients, onAddAppointment }: TaxOfficeAppointmentsTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedDate, setSelectedDate] = useState(todayISODate());
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLabelsOpen, setIsLabelsOpen] = useState(false);

  const sorted = useMemo(() => appointments.slice().sort((a, b) => a.dateTime.localeCompare(b.dateTime)), [appointments]);

  const dayAppointments = useMemo(
    () => sorted.filter((a) => a.dateTime.startsWith(selectedDate)),
    [sorted, selectedDate]
  );

  const appointmentCountByDate = useMemo(() => {
    const map: Record<string, number> = {};
    sorted.forEach((a) => {
      const day = a.dateTime.split("T")[0];
      map[day] = (map[day] || 0) + 1;
    });
    return map;
  }, [sorted]);

  const calendarDays = useMemo(() => {
    const { year, month } = calendarMonth;
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
    return cells;
  }, [calendarMonth]);

  const integrationIcon = (integration: TaxAppointmentIntegration) => {
    if (integration === "zoom" || integration === "google_meet") return <Video size={12} />;
    if (integration === "phone") return <PhoneIcon size={12} />;
    return <MapPin size={12} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#05101F] border border-gray-800">
          {(["list", "day", "calendar"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-colors cursor-pointer ${
                viewMode === mode ? "bg-cyan-500/20 text-cyan-300" : "text-gray-400 hover:text-white"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLabelsOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#05101F] text-gray-300 border border-gray-800 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Tag size={14} />
            <span>Labels</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,224,240,0.3)] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>New appointment</span>
          </button>
        </div>
      </div>

      {viewMode === "day" && (
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-[#05101F] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
          />
        </div>
      )}

      {viewMode === "calendar" && (
        <div className="p-4 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setCalendarMonth((prev) => (prev.month === 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: prev.month - 1 }))}
              className="px-2 py-1 text-gray-400 hover:text-white cursor-pointer"
            >
              ←
            </button>
            <span className="text-sm font-bold text-white">
              {new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString("es-US", { month: "long", year: "numeric" })}
            </span>
            <button
              onClick={() => setCalendarMonth((prev) => (prev.month === 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: prev.month + 1 }))}
              className="px-2 py-1 text-gray-400 hover:text-white cursor-pointer"
            >
              →
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-gray-500 font-bold mb-1">
            {["D", "L", "M", "M", "J", "V", "S"].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => (
              <button
                key={i}
                disabled={!day}
                onClick={() => {
                  if (day) {
                    setSelectedDate(day);
                    setViewMode("day");
                  }
                }}
                className={`aspect-square rounded-lg text-[11px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  !day ? "opacity-0 cursor-default" : "bg-[#05101F] hover:bg-gray-900 text-gray-300 cursor-pointer border border-gray-800"
                }`}
              >
                {day && (
                  <>
                    <span>{Number(day.split("-")[2])}</span>
                    {appointmentCountByDate[day] && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-6 rounded-2xl bg-[#0A182D]/80 border border-gray-800">
        {(viewMode === "list" ? sorted : dayAppointments).length === 0 ? (
          <div className="py-12 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
              <CalendarClock size={22} />
            </div>
            <p className="text-white font-bold text-sm">No appointments.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/60">
            {(viewMode === "list" ? sorted : dayAppointments).map((appt) => {
              const client = clients.find((c) => c.id === appt.relatedClientId);
              const dt = new Date(appt.dateTime);
              return (
                <div key={appt.id} className="py-3.5 flex items-start gap-3">
                  <div className="w-14 shrink-0 text-center">
                    <p className="text-[10px] text-gray-500 font-bold uppercase">{dt.toLocaleDateString("es-US", { month: "short" })}</p>
                    <p className="text-lg font-black text-white leading-none">{dt.getDate()}</p>
                    <p className="text-[9px] text-gray-500 mt-0.5">
                      {dt.toLocaleTimeString("es-US", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{appt.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap text-[10px] text-gray-400">
                      <span className="px-2 py-0.5 rounded-full bg-gray-800/60 border border-gray-700">{appt.type}</span>
                      <span>{appt.durationMinutes} min</span>
                      {client && <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">{client.name}</span>}
                      {appt.label && <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">{appt.label}</span>}
                    </div>
                    {(appt.location || appt.meetingIntegration !== "none") && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-gray-500">
                        {integrationIcon(appt.meetingIntegration)}
                        <span>{appt.location || appt.meetingIntegration}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isLabelsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0A182D] border border-cyan-500/30 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[#05101F]">
              <h3 className="font-bold text-sm text-white">Labels</h3>
              <button onClick={() => setIsLabelsOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-2 text-xs">
              {PRESET_LABELS.map((label) => (
                <div key={label} className="px-3 py-2 rounded-xl bg-[#05101F] border border-gray-800 text-gray-300 font-semibold">
                  {label}
                </div>
              ))}
              <p className="text-[10px] text-gray-500 pt-2">Selecciona una de estas etiquetas al crear una cita nueva.</p>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <NewAppointmentModal clients={clients} onClose={() => setIsModalOpen(false)} onSubmit={async (input) => (await onAddAppointment(input)) && setIsModalOpen(false)} />
      )}
    </div>
  );
}

function NewAppointmentModal({
  clients,
  onClose,
  onSubmit
}: {
  clients: TaxClient[];
  onClose: () => void;
  onSubmit: (input: NewTaxAppointmentInput) => Promise<void | boolean>;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Consulta");
  const [dateTime, setDateTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [relatedClientId, setRelatedClientId] = useState("");
  const [location, setLocation] = useState("");
  const [meetingIntegration, setMeetingIntegration] = useState<TaxAppointmentIntegration>("none");
  const [label, setLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dateTime) return;
    setIsSubmitting(true);
    await onSubmit({
      title: title.trim(),
      type,
      dateTime: new Date(dateTime).toISOString(),
      durationMinutes,
      relatedClientId: relatedClientId || undefined,
      location: location.trim() || undefined,
      meetingIntegration,
      label: label || undefined
    });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0A182D] border border-cyan-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[#05101F]">
          <h3 className="font-bold text-sm text-white">New appointment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Appointment title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Type</label>
              <input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="Consultation, call..."
                className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Date &amp; Time</label>
              <input
                type="datetime-local"
                required
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Duration (minutes)</label>
              <input
                type="number"
                min="5"
                step="5"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Related client</label>
              <select
                value={relatedClientId}
                onChange={(e) => setRelatedClientId(e.target.value)}
                className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
              >
                <option value="">No client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Location / Meeting link</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Office, Zoom, phone..."
              className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Meeting Integration</label>
              <select
                value={meetingIntegration}
                onChange={(e) => setMeetingIntegration(e.target.value as TaxAppointmentIntegration)}
                className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
              >
                <option value="none">None</option>
                <option value="zoom">Zoom</option>
                <option value="google_meet">Google Meet</option>
                <option value="phone">Phone</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Label</label>
              <select
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
              >
                <option value="">No label</option>
                {PRESET_LABELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-700 text-gray-300 rounded-xl font-semibold hover:bg-gray-800 cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-cyan-500 text-black font-extrabold rounded-xl hover:bg-cyan-400 disabled:opacity-50 cursor-pointer">
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
