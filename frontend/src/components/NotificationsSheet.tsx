"use client";

import { useEffect, useState } from "react";

interface Notification {
  id: string;
  type: "alerte" | "mission" | "resolue" | "info";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "alerte",
    title: "Alerte reçue",
    description: "Votre signalement AL-2026-0001 a bien été enregistré.",
    time: "il y a 2 min",
    read: false,
  },
  {
    id: "2",
    type: "mission",
    title: "Mission assignée",
    description: "Un agent est en route vers votre position signalée.",
    time: "il y a 8 min",
    read: false,
  },
  {
    id: "3",
    type: "resolue",
    title: "Intervention résolue",
    description: "L'incident AL-2026-0001 a été résolu par l'équipe de terrain.",
    time: "il y a 1h",
    read: true,
  },
  {
    id: "4",
    type: "info",
    title: "Bienvenue sur Bët",
    description: "Plateforme de signalement — JOJ Dakar 2026. Appuyez sur S.O.S pour signaler un incident.",
    time: "il y a 3h",
    read: true,
  },
];

const TYPE_STYLES: Record<Notification["type"], { bg: string; ring: string; text: string; icon: React.ReactNode }> = {
  alerte: {
    bg: "bg-rose-500/20",
    ring: "ring-rose-400/30",
    text: "text-rose-200",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  mission: {
    bg: "bg-sky-500/20",
    ring: "ring-sky-400/30",
    text: "text-sky-200",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  resolue: {
    bg: "bg-emerald-500/20",
    ring: "ring-emerald-400/30",
    text: "text-emerald-200",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  info: {
    bg: "bg-white/10",
    ring: "ring-white/15",
    text: "text-white/60",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="8" />
        <line x1="12" y1="12" x2="12" y2="16" />
      </svg>
    ),
  },
};

interface NotificationsSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function NotificationsSheet({ open, onClose }: NotificationsSheetProps) {
  const [visible, setVisible] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => setContentVisible(true));
      // Marquer tout comme lu quand on ouvre
      setNotifications((n) => n.map((item) => ({ ...item, read: true })));
    } else {
      setContentVisible(false);
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!visible) return null;

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-40">
      <div
        className={`absolute inset-0 bg-black/55 backdrop-blur-md flex flex-col transition-opacity duration-300 ease-out ${
          contentVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Header */}
        <div className="pt-12 px-6 flex items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-white/55 text-[0.6rem] font-light tracking-[0.28em] uppercase">
              Notifications
            </span>
            {unread > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500/80 text-white text-[0.5rem] font-medium">
                {unread}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-white/60 hover:text-white transition"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" className="w-[24px] h-[24px]">
              <path d="M6 6L18 18M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Liste */}
        <div className="px-5 pt-6 pb-8 overflow-y-auto sheet-scroll flex-1 flex flex-col gap-2">
          {notifications.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-white/5 ring-1 ring-white/10 flex items-center justify-center text-white/30">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
                </svg>
              </div>
              <p className="text-white/35 text-[0.82rem] font-light">Aucune notification pour l'instant</p>
            </div>
          ) : (
            notifications.map((notif, i) => {
              const style = TYPE_STYLES[notif.type];
              return (
                <div key={notif.id}>
                  <div className={`rounded-2xl p-3.5 flex items-start gap-3 ${notif.read ? "bg-black/10" : "bg-black/20 ring-1 ring-white/8"}`}>
                    <div className={`w-9 h-9 rounded-full ring-1 flex items-center justify-center shrink-0 mt-0.5 ${style.bg} ${style.ring} ${style.text}`}>
                      {style.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className={`text-[0.8rem] font-medium leading-tight ${notif.read ? "text-white/60" : "text-white"}`}>
                          {notif.title}
                        </span>
                        {!notif.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-white/45 text-[0.75rem] font-light leading-relaxed">
                        {notif.description}
                      </p>
                      <span className="text-white/25 text-[0.65rem] font-light mt-1.5 block">
                        {notif.time}
                      </span>
                    </div>
                  </div>
                  {i < notifications.length - 1 && (
                    <div className="mx-3.5 h-px bg-white/5" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
