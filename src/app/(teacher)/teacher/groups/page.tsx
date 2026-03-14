"use client";

import { useEffect, useState } from "react";

interface Student {
  id: string;
  name: string;
  fin: string | null;
  email: string;
  createdAt: string;
}

interface Group {
  id: string;
  name: string;
  _count: { students: number };
  students?: Student[];
}

export default function TeacherGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create group
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [creating, setCreating] = useState(false);

  // Selected group detail
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Excel import
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    total: number; success: number; failed: number;
    results: { name: string; fin: string; status: string }[];
  } | null>(null);

  // Add student
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [addStudentFin, setAddStudentFin] = useState("");
  const [addStudentName, setAddStudentName] = useState("");
  const [addStudentPassword, setAddStudentPassword] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/groups");
      if (!res.ok) throw new Error("Qruplar yüklənmədi");
      setGroups(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Xəta");
    }
  };

  useEffect(() => {
    fetchGroups().finally(() => setLoading(false));
  }, []);

  const fetchGroupDetail = async (groupId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (!res.ok) throw new Error("Qrup məlumatları yüklənmədi");
      const data = await res.json();
      setSelectedGroup(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Xəta");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Qrup yaradıla bilmədi");
      }
      setShowCreateModal(false);
      setNewGroupName("");
      await fetchGroups();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Xəta");
    } finally {
      setCreating(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !addStudentFin.trim() || !addStudentName.trim()) return;
    setAddingStudent(true);
    try {
      // Create student with FIN and add to group
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addStudentName.trim(),
          fin: addStudentFin.trim().toUpperCase(),
          password: addStudentPassword.trim() || addStudentFin.trim().toUpperCase(),
          role: "STUDENT",
          groupId: selectedGroup.id,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Tələbə əlavə edilə bilmədi");
      }
      setAddStudentFin("");
      setAddStudentName("");
      setAddStudentPassword("");
      setShowAddStudent(false);
      await fetchGroupDetail(selectedGroup.id);
      await fetchGroups();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Xəta");
    } finally {
      setAddingStudent(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedGroup) return;
    if (!confirm("Tələbəni qrupdan çıxarmaq istəyirsiniz?")) return;
    try {
      // Update student's groupId to null
      await fetch(`/api/users/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: null }),
      });
      await fetchGroupDetail(selectedGroup.id);
      await fetchGroups();
    } catch {}
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Bu qrupu silmək istəyirsiniz?")) return;
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silmə uğursuz oldu");
      if (selectedGroup?.id === groupId) setSelectedGroup(null);
      await fetchGroups();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Xəta");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Yüklənir...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Qruplarım</h1>
          <p className="text-sm text-muted-foreground">Qruplarınızı idarə edin, tələbə əlavə edin</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Yeni Qrup
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Groups list */}
        <div className="space-y-3">
          {groups.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Hələ qrup yoxdur. "Yeni Qrup" basın.
            </div>
          ) : (
            groups.map((group) => (
              <div
                key={group.id}
                onClick={() => fetchGroupDetail(group.id)}
                className={`cursor-pointer rounded-lg border bg-card p-4 transition-colors hover:border-primary ${
                  selectedGroup?.id === group.id ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{group.name}</h3>
                    <p className="text-xs text-muted-foreground">{group._count.students} tələbə</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGroup(group.id);
                    }}
                    className="rounded px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Group detail */}
        <div className="lg:col-span-2">
          {!selectedGroup ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-card">
              <p className="text-sm text-muted-foreground">Qrup seçin</p>
            </div>
          ) : detailLoading ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground">Yüklənir...</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">{selectedGroup.name}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowImportModal(true); setImportResult(null); setImportFile(null); }}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    Excel Import
                  </button>
                  <button
                    onClick={() => setShowAddStudent(true)}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    + Tələbə
                  </button>
                </div>
              </div>

              {/* Students table */}
              {(selectedGroup.students || []).length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Bu qrupda hələ tələbə yoxdur
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="pb-2 font-medium text-muted-foreground">#</th>
                      <th className="pb-2 font-medium text-muted-foreground">Ad Soyad</th>
                      <th className="pb-2 font-medium text-muted-foreground">FIN</th>
                      <th className="pb-2 font-medium text-muted-foreground"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedGroup.students || []).map((student, idx) => (
                      <tr key={student.id} className="border-b border-border last:border-0">
                        <td className="py-2 text-muted-foreground">{idx + 1}</td>
                        <td className="py-2 font-medium text-foreground">{student.name}</td>
                        <td className="py-2 font-mono text-foreground">{student.fin || "—"}</td>
                        <td className="py-2 text-right">
                          <button
                            onClick={() => handleRemoveStudent(student.id)}
                            className="text-xs text-destructive hover:underline"
                          >
                            Çıxar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">Yeni Qrup</h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Qrup Adı</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Məs: 101-ci qrup"
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {creating ? "Yaradılır..." : "Yarat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudent && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">
              Tələbə Əlavə Et - {selectedGroup.name}
            </h2>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Ad Soyad</label>
                <input
                  type="text"
                  required
                  value={addStudentName}
                  onChange={(e) => setAddStudentName(e.target.value)}
                  placeholder="Tələbənin tam adı"
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">FIN Kod</label>
                <input
                  type="text"
                  required
                  value={addStudentFin}
                  onChange={(e) => setAddStudentFin(e.target.value.toUpperCase())}
                  placeholder="Məs: 5KH2F7N"
                  className="w-full rounded-md border border-input px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Parol avtomatik FIN kod olacaq
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddStudent(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={addingStudent}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {addingStudent ? "Əlavə edilir..." : "Əlavə Et"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {showImportModal && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">
              Excel Import - {selectedGroup.name}
            </h2>

            {!importResult ? (
              <div className="space-y-4">
                <div className="rounded-md border border-dashed border-border bg-muted/30 p-6 text-center">
                  <p className="mb-3 text-sm text-muted-foreground">
                    Excel faylinda 2 sutun olmalidir: <b>Ad Soyad</b> ve <b>FIN</b>
                  </p>
                  <a
                    href="/api/users/template"
                    className="inline-block rounded-md border border-primary bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10"
                  >
                    Shablon Yukle
                  </a>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Excel Fayl</label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="w-full rounded-md border border-input px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-sm file:text-primary"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
                  >
                    Legv et
                  </button>
                  <button
                    onClick={async () => {
                      if (!importFile) return;
                      setImporting(true);
                      try {
                        const fd = new FormData();
                        fd.append("file", importFile);
                        fd.append("groupId", selectedGroup.id);
                        const res = await fetch("/api/users/import", { method: "POST", body: fd });
                        const data = await res.json();
                        setImportResult(data);
                        await fetchGroupDetail(selectedGroup.id);
                        await fetchGroups();
                      } catch (err: any) {
                        alert(err.message);
                      } finally {
                        setImporting(false);
                      }
                    }}
                    disabled={!importFile || importing}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {importing ? "Import edilir..." : "Import Et"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-md bg-muted p-3 text-center">
                    <p className="text-2xl font-bold">{importResult.total}</p>
                    <p className="text-xs text-muted-foreground">Umumi</p>
                  </div>
                  <div className="rounded-md bg-green-50 p-3 text-center">
                    <p className="text-2xl font-bold text-green-700">{importResult.success}</p>
                    <p className="text-xs text-green-600">Ugurlu</p>
                  </div>
                  <div className="rounded-md bg-red-50 p-3 text-center">
                    <p className="text-2xl font-bold text-red-700">{importResult.failed}</p>
                    <p className="text-xs text-red-600">Ugursuz</p>
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto rounded-md border border-border">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-muted"><tr><th className="px-3 py-2">Ad</th><th className="px-3 py-2">FIN</th><th className="px-3 py-2">Netice</th></tr></thead>
                    <tbody>
                      {importResult.results.map((r, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-3 py-2">{r.name}</td>
                          <td className="px-3 py-2 font-mono">{r.fin}</td>
                          <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-xs ${r.status === "Ugurla yaradildi" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{r.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => setShowImportModal(false)} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Bagla</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
