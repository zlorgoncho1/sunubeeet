import type { Metadata, Viewport } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Bët — PC Ops Coordinateur",
  description: "Dashboard coordinateur — JOJ Dakar 2026",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function CoordinateurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
