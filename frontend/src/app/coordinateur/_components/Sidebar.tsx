"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authApi } from "@/lib/api/services/auth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  match?: (pathname: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Carte Tactique",
    href: "/coordinateur",
    match: (p) => p === "/coordinateur",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    ),
  },
  {
    label: "Effectifs & Agents",
    href: "/coordinateur/agents",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    label: "Sites & agents tiers",
    href: "/coordinateur/sites",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    label: "QR Codes",
    href: "/coordinateur/qr-codes",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <line x1="14" y1="14" x2="14" y2="21" />
        <line x1="14" y1="14" x2="21" y2="14" />
        <line x1="21" y1="14" x2="21" y2="21" />
      </svg>
    ),
  },
  {
    label: "Coordinateurs",
    href: "/coordinateur/coordinateurs",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    label: "Zones",
    href: "/coordinateur/zones",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <path d="M3 3h18v18H3z" />
        <path d="M9 3v18" />
        <path d="M15 3v18" />
        <path d="M3 9h18" />
        <path d="M3 15h18" />
      </svg>
    ),
  },
  {
    label: "Logs d'audit",
    href: "/coordinateur/audit-logs",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname() ?? "";
  const router = useRouter();

  async function handleLogout() {
    await authApi.logout();
    router.push("/coordinateur/login");
  }

  return (
    <aside className="w-16 hover:w-56 transition-all duration-300 h-screen border-r border-black/[0.06] bg-white flex flex-col z-30 shrink-0 group overflow-hidden">
      <div className="h-14 px-4 flex items-center border-b border-black/[0.04] shrink-0">
        <div className="w-8 h-8 bg-black rounded-lg text-white flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        <span className="text-base font-medium tracking-tight ml-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[#212529]">
          Bët Platform
        </span>
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto px-2">
        {NAV_ITEMS.map((item) => {
          const active = item.match
            ? item.match(pathname)
            : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                active
                  ? "bg-black/[0.03] text-[#212529] border border-black/[0.04] shadow-sm"
                  : "text-[#6c757d] hover:bg-black/[0.02] hover:text-[#212529]"
              }`}
            >
              {item.icon}
              <span className="font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-sm">
                {item.label}
              </span>
            </Link>
          );
        })}

        <div className="mt-auto pt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#6c757d] hover:bg-black/[0.02] hover:text-[#212529] transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-sm">
              Déconnexion
            </span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
