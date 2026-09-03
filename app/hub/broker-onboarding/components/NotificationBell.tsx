"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { ActiveTab } from "../types";

interface Notification {
  id: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  onNavigate: (tab: ActiveTab) => void;
}

const POLL_INTERVAL_MS = 60_000;

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

export default function NotificationBell({ onNavigate }: NotificationBellProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // silencioso: un fallo de polling no debe interrumpir la UI
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(() => {
      if (!user) return;
      fetchNotifications();
      interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    }, 0);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    if (!user || isMarking) return;
    setIsMarking(true);
    try {
      const token = await user.getIdToken();
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ all: true })
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silencioso
    } finally {
      setIsMarking(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read && user) {
      user.getIdToken().then((token) => {
        fetch("/api/notifications/mark-read", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ids: [notification.id] })
        }).catch(() => {});
      });
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setIsOpen(false);
    if (notification.link) {
      onNavigate(notification.link as ActiveTab);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-xl hover:bg-gray-800/80 transition-colors"
      >
        <Bell size={20} className="text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-cyan-500 text-black text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-[420px] overflow-y-auto bg-[#0A182D] border border-gray-800 rounded-2xl shadow-2xl z-50">
          <div className="sticky top-0 bg-[#0A182D] border-b border-gray-800 p-4 flex items-center justify-between">
            <h4 className="text-sm font-bold text-white">Notificaciones</h4>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isMarking}
                className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
              >
                <Check size={12} />
                Marcar todas
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="p-6 text-center text-xs text-gray-500">No tienes notificaciones todavía.</p>
          ) : (
            <div className="divide-y divide-gray-800/80">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left p-4 hover:bg-gray-800/40 transition-colors ${!n.read ? "bg-cyan-500/5" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-cyan-400 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white">{n.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-gray-600 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
