"use client";

import { useEffect, useState } from "react";
import Sidebar from "../_components/Sidebar";
import CoordTopBar from "../_components/CoordTopBar";
import AuthGuard from "@/components/ui/AuthGuard";
import { adminApi } from "@/lib/api/services/admin";
import type { ApiError } from "@/lib/types";

export default function AuditLogsPage() {
  return (
    <AuthGuard
      roles={["admin", "super_admin"]}
      redirectTo="/coordinateur/login"
    >
      <AuditLogsPageInner />
    </AuthGuard>
  );
}

function AuditLogsPageInner() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  async function load(pageNum: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.auditLogs({ page: pageNum });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      setLogs(res.data ?? []);
    } catch (e) {
      setError((e as ApiError).message ?? "Échec du chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(page);
  }, [page]);

  return (
    <div className="min-h-screen antialiased text-[#212529] bg-white font-manrope font-light text-sm overflow-hidden flex">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#fcfcfc]">
        <CoordTopBar />

        <div className="px-6 py-5 border-b border-black/[0.04] bg-white flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-medium tracking-tight text-[#212529]">Logs d'audit</h1>
            <p className="text-xs text-[#6c757d] mt-0.5">Historique des actions système</p>
          </div>
        </div>

        <div className="flex-1 overflow-auto coord-scroll">
          <table className="w-full">
            <thead className="sticky top-0 bg-white border-b border-black/[0.04] z-10">
              <tr>
                <th className="text-left px-6 py-3 text-[10px] font-medium text-[#6c757d] uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-[#6c757d] uppercase tracking-wider">Action</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-[#6c757d] uppercase tracking-wider">Utilisateur</th>
                <th className="text-left px-6 py-3 text-[10px] font-medium text-[#6c757d] uppercase tracking-wider">Détails</th>
              </tr>
            </thead>
            <tbody>
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-[#6c757d] text-sm">
                    Chargement...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-rose-500 text-sm">
                    {error}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-[#6c757d] text-sm">
                    Aucun log d'audit trouvé.
                  </td>
                </tr>
              ) : (
                logs.map((log, i) => (
                  <tr key={log.id || i} className="border-b border-black/[0.03] hover:bg-black/[0.01] transition-colors">
                    <td className="px-6 py-4 text-xs text-[#6c757d] whitespace-nowrap">
                      {new Date(log.created_at || log.occurred_at || Date.now()).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-[#212529]">
                      <span className="px-2 py-0.5 rounded border border-black/10 bg-black/[0.02] text-xs">
                        {log.event || log.action || "Inconnu"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-[#6c757d]">
                      {log.user_id || "Système"}
                    </td>
                    <td className="px-6 py-4 text-xs text-[#6c757d]">
                      <pre className="max-w-[200px] overflow-hidden text-ellipsis">
                        {JSON.stringify(log.old_values || log.new_values || log.payload || {}, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-black/[0.04] bg-white flex items-center justify-between shrink-0">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-50 hover:bg-black/[0.02] transition"
          >
            Précédent
          </button>
          <span className="text-xs text-[#6c757d]">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={logs.length === 0 || loading}
            className="px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-50 hover:bg-black/[0.02] transition"
          >
            Suivant
          </button>
        </div>
      </main>
    </div>
  );
}
