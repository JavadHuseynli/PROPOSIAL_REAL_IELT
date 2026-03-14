"use client";

import { useEffect, useState } from "react";
import { ROLE_LABELS } from "@/lib/constants";

interface Group {
  id: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  fin: string | null;
  role: string;
  groupId: string | null;
  group: Group | null;
  createdAt: string;
}

const ROLES = ["ALL", "ADMIN", "DEAN", "TEACHER", "STUDENT"] as const;
const ROLE_TAB_LABELS: Record<string, string> = {
  ALL: "Hamısı",
  ...ROLE_LABELS,
};

const emptyForm = {
  name: "",
  email: "",
  password: "",
  fin: "",
  role: "STUDENT",
  groupId: "",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("İstifadəçiləri yükləmək mümkün olmadı");
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/groups");
      if (!res.ok) return;
      const data = await res.json();
      setGroups(data);
    } catch {}
  };

  useEffect(() => {
    Promise.all([fetchUsers(), fetchGroups()]).finally(() => setLoading(false));
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      fin: user.fin || "",
      role: user.role,
      groupId: user.groupId || "",
    });
    setFormError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      if (editingUser) {
        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            fin: form.fin || null,
            role: form.role,
            groupId: form.groupId || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Yeniləmə uğursuz oldu");
        }
      } else {
        // For students: password defaults to FIN code
        const password = form.password || form.fin;
        if (!password) {
          setFormError("Şifrə və ya FIN kod tələb olunur");
          setSubmitting(false);
          return;
        }
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email || undefined,
            password,
            fin: form.fin || undefined,
            role: form.role,
            groupId: form.groupId || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Yaratma uğursuz oldu");
        }
      }

      setShowModal(false);
      await fetchUsers();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Bu istifadəçini silmək istədiyinizdən əminsiniz?")) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silmə uğursuz oldu");
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredUsers =
    activeTab === "ALL" ? users : users.filter((u) => u.role === activeTab);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Yüklənir...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">İstifadəçilər</h1>
        <button
          onClick={openCreateModal}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Yeni İstifadəçi
        </button>
      </div>

      {/* Role filter tabs */}
      <div className="mb-4 flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
        {ROLES.map((role) => (
          <button
            key={role}
            onClick={() => setActiveTab(role)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === role
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {ROLE_TAB_LABELS[role]}{" "}
            <span className="ml-1 opacity-70">
              ({role === "ALL" ? users.length : users.filter((u) => u.role === role).length})
            </span>
          </button>
        ))}
      </div>

      {/* Users table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground">Ad</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">FIN</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Rol</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Əməliyyatlar</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{user.name}</td>
                <td className="px-4 py-3 font-mono text-foreground">{user.fin || "—"}</td>
                <td className="px-4 py-3 text-foreground">{user.role === "STUDENT" ? "—" : user.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(user)}
                      className="rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
                    >
                      Redaktə
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="rounded-md border border-destructive px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                    >
                      Sil
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  İstifadəçi tapılmadı
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              {editingUser ? "İstifadəçini Redaktə Et" : "Yeni İstifadəçi"}
            </h2>

            {formError && (
              <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Ad</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {(form.role === "STUDENT" || form.role === "TEACHER") && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    FIN Kod {form.role === "STUDENT" && <span className="text-destructive">*</span>}
                  </label>
                  <input
                    type="text"
                    value={form.fin}
                    onChange={(e) => setForm({ ...form, fin: e.target.value.toUpperCase() })}
                    placeholder="Məs: 5KH2F7N"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}

              {(form.role === "ADMIN" || form.role === "DEAN" || form.role === "TEACHER") && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Email <span className="text-xs text-muted-foreground">(istəyə bağlı)</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}

              {(form.role === "STUDENT" || form.role === "TEACHER") && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Qrup</label>
                  <select
                    value={form.groupId}
                    onChange={(e) => setForm({ ...form, groupId: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Qrup seçin</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {!editingUser && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Şifrə {(form.role === "STUDENT" || form.role === "TEACHER") && <span className="text-xs text-muted-foreground">(boş qalsa FIN kod olacaq)</span>}
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Boş qalsa FIN kod şifrə olacaq"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Rol</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? "Gözləyin..." : editingUser ? "Yenilə" : "Yarat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
