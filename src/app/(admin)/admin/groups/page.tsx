"use client";

import { useEffect, useState } from "react";

interface Teacher {
  id: string;
  name: string;
  email: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface Group {
  id: string;
  name: string;
  teacherId: string | null;
  teacher: Teacher | null;
  _count?: { students: number };
  students?: Student[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  groupId: string | null;
}

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create / edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formName, setFormName] = useState("");
  const [formTeacherId, setFormTeacherId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Detail / students panel
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const teachers = allUsers.filter((u) => u.role === "TEACHER");
  const students = allUsers.filter((u) => u.role === "STUDENT");

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/groups");
      if (!res.ok) throw new Error("Qrupları yükləmək mümkün olmadı");
      const data = await res.json();
      setGroups(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) return;
      const data = await res.json();
      setAllUsers(data);
    } catch {}
  };

  useEffect(() => {
    Promise.all([fetchGroups(), fetchUsers()]).finally(() => setLoading(false));
  }, []);

  const fetchGroupDetail = async (groupId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (!res.ok) throw new Error("Qrup məlumatlarını yükləmək mümkün olmadı");
      const data = await res.json();
      setSelectedGroup(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingGroup(null);
    setFormName("");
    setFormTeacherId("");
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (group: Group) => {
    setEditingGroup(group);
    setFormName(group.name);
    setFormTeacherId(group.teacher?.id || "");
    setFormError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      if (editingGroup) {
        const res = await fetch(`/api/groups/${editingGroup.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            teacherId: formTeacherId || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Yeniləmə uğursuz oldu");
        }
      } else {
        const res = await fetch("/api/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            teacherId: formTeacherId || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Yaratma uğursuz oldu");
        }
      }

      setShowModal(false);
      await fetchGroups();
      if (selectedGroup && editingGroup && selectedGroup.id === editingGroup.id) {
        await fetchGroupDetail(editingGroup.id);
      }
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm("Bu qrupu silmək istədiyinizdən əminsiniz?")) return;
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silmə uğursuz oldu");
      if (selectedGroup?.id === groupId) setSelectedGroup(null);
      await fetchGroups();
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddStudent = async (studentId: string) => {
    if (!selectedGroup) return;
    try {
      const currentStudentIds = (selectedGroup.students || []).map((s) => s.id);
      const res = await fetch(`/api/groups/${selectedGroup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: [...currentStudentIds, studentId],
        }),
      });
      if (!res.ok) throw new Error("Tələbəni əlavə etmək mümkün olmadı");
      await fetchGroupDetail(selectedGroup.id);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedGroup) return;
    try {
      const currentStudentIds = (selectedGroup.students || [])
        .filter((s) => s.id !== studentId)
        .map((s) => s.id);
      const res = await fetch(`/api/groups/${selectedGroup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: currentStudentIds }),
      });
      if (!res.ok) throw new Error("Tələbəni çıxarmaq mümkün olmadı");
      await fetchGroupDetail(selectedGroup.id);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleChangeTeacher = async (teacherId: string) => {
    if (!selectedGroup) return;
    try {
      const res = await fetch(`/api/groups/${selectedGroup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: teacherId || null }),
      });
      if (!res.ok) throw new Error("Müəllimi dəyişmək mümkün olmadı");
      await fetchGroupDetail(selectedGroup.id);
      await fetchGroups();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Students available to add (not already in this group)
  const availableStudents = students.filter(
    (s) =>
      !s.groupId ||
      (selectedGroup && s.groupId !== selectedGroup.id)
  );

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
        <button
          onClick={() => setError("")}
          className="ml-3 underline"
        >
          Bağla
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Qruplar</h1>
        <button
          onClick={openCreateModal}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Yeni Qrup
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Groups table */}
        <div className={selectedGroup ? "lg:col-span-1" : "lg:col-span-3"}>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Ad</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Müəllim</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Tələbə Sayı</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr
                    key={group.id}
                    className={`cursor-pointer border-b border-border last:border-0 hover:bg-muted/30 ${
                      selectedGroup?.id === group.id ? "bg-muted/50" : ""
                    }`}
                    onClick={() => fetchGroupDetail(group.id)}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{group.name}</td>
                    <td className="px-4 py-3 text-foreground">
                      {group.teacher?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-foreground">{group._count?.students ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openEditModal(group)}
                          className="rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
                        >
                          Redaktə
                        </button>
                        <button
                          onClick={() => handleDelete(group.id)}
                          className="rounded-md border border-destructive px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {groups.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                      Hələ qrup yoxdur
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Group detail panel */}
        {selectedGroup && (
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  {selectedGroup.name}
                </h2>
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Bağla
                </button>
              </div>

              {detailLoading ? (
                <div className="py-8 text-center text-muted-foreground">Yüklənir...</div>
              ) : (
                <>
                  {/* Teacher assignment */}
                  <div className="mb-6">
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      Müəllim
                    </label>
                    <select
                      value={selectedGroup.teacher?.id || ""}
                      onChange={(e) => handleChangeTeacher(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Müəllim yoxdur</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Students list */}
                  <div className="mb-4">
                    <h3 className="mb-2 text-sm font-medium text-foreground">
                      Tələbələr ({selectedGroup.students?.length || 0})
                    </h3>
                    <div className="space-y-2">
                      {(selectedGroup.students || []).map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2"
                        >
                          <div>
                            <span className="text-sm font-medium text-foreground">
                              {student.name}
                            </span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {student.email}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveStudent(student.id)}
                            className="rounded-md border border-destructive px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                          >
                            Sil
                          </button>
                        </div>
                      ))}
                      {(selectedGroup.students || []).length === 0 && (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                          Bu qrupda tələbə yoxdur
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add student */}
                  {availableStudents.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-medium text-foreground">
                        Tələbə Əlavə Et
                      </h3>
                      <div className="max-h-48 space-y-1 overflow-y-auto">
                        {availableStudents.map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/30"
                          >
                            <div>
                              <span className="text-sm text-foreground">{student.name}</span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                {student.email}
                              </span>
                            </div>
                            <button
                              onClick={() => handleAddStudent(student.id)}
                              className="rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
                            >
                              Əlavə et
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              {editingGroup ? "Qrupu Redaktə Et" : "Yeni Qrup"}
            </h2>

            {formError && (
              <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Qrup Adı</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Müəllim</label>
                <select
                  value={formTeacherId}
                  onChange={(e) => setFormTeacherId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Müəllim seçin</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
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
                  {submitting ? "Gözləyin..." : editingGroup ? "Yenilə" : "Yarat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
