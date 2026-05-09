import { KeyRound, Pencil, Plus, Search, Shield, Trash2, UserRound } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
  resetAdminUserPassword,
  toggleAdminUserStatus,
  updateAdminUser,
} from "../../../api/accountApi";
import AdminPageHeader from "../../../components/dashboard/AdminPageHeader";
import SurfaceCard from "../../../components/dashboard/SurfaceCard";
import { useAuth } from "../../../hooks/useAuth";
import type { AdminPortalUser, AdminPortalUserPayload, User } from "../../../types";

const roleOptions: Array<{ value: User["role"]; label: string }> = [
  { value: "admin", label: "Administrateur" },
  { value: "staff", label: "Staff" },
  { value: "direction", label: "Direction" },
  { value: "compta", label: "Comptabilite" },
  { value: "enseignant", label: "Enseignant" },
  { value: "chauffeur", label: "Chauffeur" },
  { value: "etudiant", label: "Etudiant" },
];

const emptyForm: AdminPortalUserPayload = {
  firstName: "",
  lastName: "",
  email: "",
  role: "staff",
  phone: "",
  password: "",
  isActive: true,
};

const AdminUsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminPortalUser[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<AdminPortalUserPayload>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await fetchAdminUsers();
      setUsers(data.results);
    } catch (requestError) {
      console.error(requestError);
      setError("Impossible de charger les utilisateurs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((item) =>
      [item.firstName, item.lastName, item.email, item.username, item.role, item.phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [search, users]);

  const selectedUser = useMemo(
    () => users.find((item) => item.id === selectedId) || null,
    [selectedId, users],
  );

  const resetForm = () => {
    setSelectedId(null);
    setForm(emptyForm);
  };

  const handleSelectUser = (item: AdminPortalUser) => {
    setSelectedId(item.id);
    setForm({
      firstName: item.firstName,
      lastName: item.lastName,
      email: item.email,
      role: item.role,
      phone: item.phone || "",
      password: "",
      isActive: item.isActive,
    });
    setFeedback("");
    setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.email.trim()) {
      setError("L'email est obligatoire.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      setFeedback("");
      if (selectedUser) {
        const updated = await updateAdminUser(selectedUser.id, form);
        setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setFeedback(`Utilisateur mis a jour: ${updated.email}.`);
      } else {
        const created = await createAdminUser(form);
        setUsers((current) => [created, ...current]);
        setSelectedId(created.id);
        setFeedback(`Utilisateur cree: ${created.email}.`);
      }
      resetForm();
      await loadUsers();
    } catch (requestError) {
      console.error(requestError);
      const payload = (requestError as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const firstMessage =
        (typeof payload?.detail === "string" && payload.detail) ||
        Object.values(payload || {}).flatMap((value) => (Array.isArray(value) ? value : [value])).find((value) => typeof value === "string");
      setError(typeof firstMessage === "string" ? firstMessage : "Impossible d'enregistrer l'utilisateur.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (item: AdminPortalUser) => {
    try {
      setError("");
      setFeedback("");
      const updated = await toggleAdminUserStatus(item.id, !item.isActive);
      setUsers((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
      if (selectedId === item.id) {
        setForm((current) => ({ ...current, isActive: updated.isActive }));
      }
      setFeedback(`${updated.email} est maintenant ${updated.isActive ? "actif" : "inactif"}.`);
    } catch (requestError) {
      console.error(requestError);
      setError("Impossible de modifier le statut de cet utilisateur.");
    }
  };

  const handleResetPassword = async (item: AdminPortalUser) => {
    try {
      setError("");
      const response = await resetAdminUserPassword(item.id);
      setFeedback(`Mot de passe reinitialise pour ${item.email}: ${response.temporary_password}`);
    } catch (requestError) {
      console.error(requestError);
      setError("Impossible de reinitialiser le mot de passe.");
    }
  };

  const handleDelete = async (item: AdminPortalUser) => {
    if (!window.confirm(`Supprimer le compte ${item.email} ?`)) {
      return;
    }

    try {
      setError("");
      setFeedback("");
      await deleteAdminUser(item.id);
      setUsers((current) => current.filter((entry) => entry.id !== item.id));
      if (selectedId === item.id) {
        resetForm();
      }
      setFeedback(`Utilisateur supprime: ${item.email}.`);
    } catch (requestError) {
      console.error(requestError);
      setError("Impossible de supprimer cet utilisateur.");
    }
  };

  const totalActive = users.filter((item) => item.isActive).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Administration"
        title="Utilisateurs"
        description="Gerez les comptes du portail, leurs roles, leur activation et la reinitialisation de leurs mots de passe."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SurfaceCard className="emsp-panel p-5">
          <p className="text-sm text-slate-500">Comptes</p>
          <p className="mt-3 font-display text-3xl font-bold text-dark">{users.length}</p>
        </SurfaceCard>
        <SurfaceCard className="emsp-panel p-5">
          <p className="text-sm text-slate-500">Actifs</p>
          <p className="mt-3 font-display text-3xl font-bold text-secondary">{totalActive}</p>
        </SurfaceCard>
        <SurfaceCard className="emsp-panel p-5">
          <p className="text-sm text-slate-500">Roles distincts</p>
          <p className="mt-3 font-display text-3xl font-bold text-dark">{new Set(users.map((item) => item.role)).size}</p>
        </SurfaceCard>
      </div>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div> : null}
      {feedback ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{feedback}</div> : null}

      <div className="grid gap-6 2xl:grid-cols-[1.05fr_0.95fr]">
        <SurfaceCard className="emsp-panel overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-secondary">Annuaire</p>
                <h2 className="mt-2 font-display text-2xl font-bold text-dark">Comptes utilisateurs</h2>
              </div>
              <div className="relative w-full max-w-sm">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher un utilisateur..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none"
                />
              </div>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {isLoading ? (
              <div className="px-6 py-8 text-sm text-slate-500">Chargement des utilisateurs...</div>
            ) : filteredUsers.length ? (
              filteredUsers.map((item) => (
                <div key={item.id} className={`px-6 py-5 ${selectedId === item.id ? "bg-secondary/5" : ""}`}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <button type="button" onClick={() => handleSelectUser(item)} className="min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                          {item.avatarUrl ? <img src={item.avatarUrl} alt={item.email} className="h-full w-full rounded-2xl object-cover" /> : <UserRound size={18} />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-display text-xl font-semibold text-dark">
                            {`${item.firstName} ${item.lastName}`.trim() || item.username || item.email}
                          </p>
                          <p className="truncate text-sm text-slate-500">{item.email}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold capitalize text-slate-600">{item.role}</span>
                        <span className={`rounded-full px-3 py-1 font-semibold ${item.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                          {item.isActive ? "Actif" : "Inactif"}
                        </span>
                        {item.phone ? <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">{item.phone}</span> : null}
                        {currentUser?.id === item.id ? <span className="rounded-full bg-primary/30 px-3 py-1 font-semibold text-dark">Vous</span> : null}
                      </div>
                    </button>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleToggleStatus(item)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        {item.isActive ? "Desactiver" : "Activer"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleResetPassword(item)}
                        className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                      >
                        <KeyRound size={14} />
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectUser(item)}
                        className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800 transition hover:bg-sky-100"
                      >
                        <Pencil size={14} />
                        Modifier
                      </button>
                      {currentUser?.id !== item.id ? (
                        <button
                          type="button"
                          onClick={() => void handleDelete(item)}
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                        >
                          <Trash2 size={14} />
                          Supprimer
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-sm text-slate-500">Aucun utilisateur trouve.</div>
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard className="emsp-panel p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-secondary">{selectedUser ? "Edition" : "Creation"}</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-dark">
                {selectedUser ? "Modifier un compte" : "Ajouter un utilisateur"}
              </h2>
            </div>
            {selectedUser ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Plus size={16} />
                Nouveau
              </button>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-dark">
              Prenom
              <input
                value={form.firstName}
                onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal text-slate-700 outline-none"
              />
            </label>
            <label className="block text-sm font-semibold text-dark">
              Nom
              <input
                value={form.lastName}
                onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal text-slate-700 outline-none"
              />
            </label>
            <label className="block text-sm font-semibold text-dark sm:col-span-2">
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal text-slate-700 outline-none"
                required
              />
            </label>
            <label className="block text-sm font-semibold text-dark">
              Role
              <select
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as User["role"] }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal text-slate-700 outline-none"
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-dark">
              Telephone
              <input
                value={form.phone || ""}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal text-slate-700 outline-none"
              />
            </label>
            <label className="block text-sm font-semibold text-dark sm:col-span-2">
              Mot de passe {selectedUser ? "(laisser vide pour conserver l'actuel)" : "(optionnel)"}
              <input
                type="text"
                value={form.password || ""}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder={selectedUser ? "Conserver le mot de passe actuel" : "emsp12345"}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal text-slate-700 outline-none"
              />
            </label>
            <label className="sm:col-span-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                type="checkbox"
                checked={Boolean(form.isActive)}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-secondary focus:ring-secondary"
              />
              <span className="text-sm font-semibold text-dark">Compte actif</span>
            </label>
            <div className="sm:col-span-2 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-2xl bg-dark px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                <Shield size={16} />
                {isSaving ? "Enregistrement..." : selectedUser ? "Mettre a jour" : "Creer le compte"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Reinitialiser
              </button>
            </div>
          </form>
        </SurfaceCard>
      </div>
    </div>
  );
};

export default AdminUsersPage;
