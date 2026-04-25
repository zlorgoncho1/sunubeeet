import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bët — JOJ Dakar 2026",
  description: "Plateforme de signalement d'incidents — JOJ Dakar 2026",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="antialiased h-screen w-full overflow-hidden" suppressHydrationWarning>
        {children}
        <Script
          src="https://code.iconify.design/iconify-icon/2.0.0/iconify-icon.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
