"use client";

import { useEffect, useState } from "react";
import Sidebar from "../_components/Sidebar";
import CoordTopBar from "../_components/CoordTopBar";
import AuthGuard from "@/components/ui/AuthGuard";
import { usersApi } from "@/lib/api/services/users";
import type { ApiError, User, UserRole } from "@/lib/types";

export default function CoordinateursPage() {
  return (
    <AuthGuard
      roles={["admin", "super_admin"]}
      redirectTo="/coordinateur/login"
    >
      <CoordinateursPageInner />
    </AuthGuard>
  );
}

function CoordinateursPageInner() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // Pour ce cas, on peut appeler 2 fois ou bien le backend supporte plusieurs rôles.
      // Dans le doute on appelle pour "coordinator". S'il y a plus de rôles on pourrait faire Promise.all
      const res = await usersApi.list({ role: "coordinator" as UserRole, page: 1 });
      setUsers(res.data ?? []);
    } catch (e) {
      setError((e as ApiError).message ?? "Échec du chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleSave(data: { fullname: string; phone: string }) {
    try {
      if (editUser) {
        await usersApi.update(editUser.id, {
          fullname: data.fullname,
        });
      } else {
        await usersApi.create({
          fullname: data.fullname,
          phone: data.phone,
          role: "coordinator",
        });
      }
      setModalOpen(false);
      setEditUser(null);
      await load();
    } catch (e) {
      alert((e as ApiError).message ?? "Échec de l'enregistrement");
    }
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    if (!confirm(currentActive ? "Désactiver cet utilisateur ?" : "Activer cet utilisateur ?")) return;
    try {
      if (currentActive) {
        await usersApi.deactivate(id);
      } else {
        await usersApi.activate(id);
      }
      await load();
    } catch (e) {
      alert((e as ApiError).message ?? "Échec");
    }
  }

  return (
    <div className="min-h-screen antialiased text-[#212529] bg-white font-manrope font-light text-sm overflow-hidden flex">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#fcfcfc]">
        <CoordTopBar />

        <div className="px-6 py-5 border-b border-black/[0.04] bg-white flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-medium tracking-tight text-[#212529]">Coordinateurs</h1>
            <p className="text-xs text-[#6c757d] mt-0.5">{users.length} coordinateur{users.length > 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={() => {
              setEditUser(null);
              setModalOpen(true);
            }}
            className="px-4 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/90 transition shadow-sm"
          >
            + Nouveau coordinateur
          </button>
        </div>

        <div className="flex-1 overflow-auto coord-scroll p-6">
          {loading ? (
            <p className="text-[#6c757d] text-sm text-center py-10">Chargement…</p>
          ) : error ? (
            <p className="text-rose-500 text-sm text-center py-10">{error}</p>
          ) : users.length === 0 ? (
            <p className="text-[#6c757d] text-sm text-center py-10">Aucun coordinateur trouvé.</p>
          ) : (
            <div className="grid gap-3 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-[#6c757d] mb-1">
                        Coordinateur
                      </div>
                      <div className="text-sm font-medium text-[#212529]">{u.fullname}</div>
                      <div className="text-xs text-[#6c757d] mt-0.5">{u.phone}</div>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider ${
                        u.is_active ? "bg-green-50 text-green-600 border-green-100" : "bg-gray-50 text-gray-500 border-gray-100"
                      }`}
                    >
                      {u.is_active ? "Actif" : "Désactivé"}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => {
                        setEditUser(u);
                        setModalOpen(true);
                      }}
                      className="flex-1 h-8 rounded-lg bg-black/[0.04] text-xs hover:bg-black/[0.08] transition"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleToggleActive(u.id, u.is_active)}
                      className={`flex-1 h-8 rounded-lg text-xs transition ${u.is_active ? 'text-rose-600 hover:bg-rose-50' : 'text-green-600 hover:bg-green-50'}`}
                    >
                      {u.is_active ? "Désactiver" : "Activer"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {modalOpen && (
        <UserModal
          user={editUser}
          onClose={() => {
            setModalOpen(false);
            setEditUser(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function UserModal({
  user,
  onClose,
  onSave,
}: {
  user: User | null;
  onClose: () => void;
  onSave: (data: { fullname: string; phone: string }) => void;
}) {
  const [fullname, setFullname] = useState(user?.fullname ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      fullname: fullname.trim(),
      phone: phone.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4"
      >
        <h2 className="text-lg font-medium">{user ? "Modifier le coordinateur" : "Nouveau coordinateur"}</h2>
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-[#6c757d]">Nom complet</span>
          <input
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
            required
            className="w-full h-10 px-3 rounded-lg border border-black/10 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-[#6c757d]">Téléphone</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            disabled={!!user} // Le numéro de téléphone ne peut généralement pas être modifié simplement une fois créé, selon l'API
            className="w-full h-10 px-3 rounded-lg border border-black/10 text-sm disabled:opacity-50"
            placeholder="+221..."
          />
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg text-sm hover:bg-black/[0.04]"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="h-10 px-4 rounded-lg bg-black text-white text-sm hover:bg-black/90"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}
