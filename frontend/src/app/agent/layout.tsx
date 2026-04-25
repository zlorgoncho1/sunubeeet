import type { Metadata, Viewport } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Bët — Agent Terrain",
  description: "Application agent de terrain — JOJ Dakar 2026",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
