"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });
import TopBar from "@/components/TopBar";
import AlertTracker from "@/components/AlertTracker";
import SOSButton from "@/components/SOSButton";
import FilterButton from "@/components/FilterButton";
import AlertSheet, { type AlertSubmission } from "@/components/AlertSheet";
import SettingsSheet from "@/components/SettingsSheet";
import NotificationsSheet from "@/components/NotificationsSheet";
import { useGeolocation } from "@/lib/hooks/useGeolocation";

export default function Home() {
  const [alertSheetOpen, setAlertSheetOpen] = useState(false);
  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [trackerVisible, setTrackerVisible] = useState(false);
  const [trackerStage, setTrackerStage] = useState(1);
  const [trackerRef, setTrackerRef] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(true);

  const geo = useGeolocation();

  function handleAlertSubmitted(result: AlertSubmission) {
    setTrackerRef(result.reference);
    setTrackerStage(1);
    setTrackerVisible(true);
    setHasUnread(true);
    // Petites animations de progression — un vrai backend pousserait via WebSocket.
    setTimeout(() => setTrackerStage(2), 6000);
    setTimeout(() => setTrackerStage(3), 14000);
    setTimeout(() => setTrackerStage(4), 22000);
    // Fermeture automatique du sheet quand l'alerte est soumise.
    setTimeout(() => setAlertSheetOpen(false), 1500);
  }

  function handleOpenNotifications() {
    setNotificationsOpen(true);
    setHasUnread(false);
  }

  return (
    <main className="relative h-screen w-full overflow-hidden">
      <MapView />

      <FilterButton open={filtersOpen} />

      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between">
        <div className="pt-12 px-5 w-full relative">
          <TopBar
            onOpenFilters={() => setFiltersOpen((o) => !o)}
            onOpenNotifications={handleOpenNotifications}
            hasUnread={hasUnread}
          />
          {trackerVisible && (
            <AlertTracker stage={trackerStage} reference={trackerRef ?? undefined} />
          )}
        </div>

        <div className="pb-12 px-5 grid grid-cols-3 items-end pointer-events-auto w-full">
          <button
            onClick={() => setSettingsSheetOpen(true)}
            aria-label="Paramètres"
            className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/10 flex items-center justify-center text-white hover:bg-white/15 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-[19px] h-[19px]">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
          <div className="flex justify-center">
            <SOSButton onPress={() => setAlertSheetOpen(true)} />
          </div>
          <div />
        </div>
      </div>

      <AlertSheet
        open={alertSheetOpen}
        onClose={() => setAlertSheetOpen(false)}
        onSubmitted={handleAlertSubmitted}
        position={{ latitude: geo.latitude, longitude: geo.longitude }}
      />

      <SettingsSheet
        open={settingsSheetOpen}
        onClose={() => setSettingsSheetOpen(false)}
      />

      <NotificationsSheet
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </main>
  );
}
