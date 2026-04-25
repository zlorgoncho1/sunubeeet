import type { Metadata, Viewport } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Bët — Connexion",
  description: "Plateforme de signalement — JOJ Dakar 2026",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0e1419] flex items-center justify-center p-4 font-manrope font-light antialiased">
      {children}
    </div>
  );
}
