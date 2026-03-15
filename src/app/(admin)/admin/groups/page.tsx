"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  fin: string | null;
  email: string;
  role: string;
  groupId: string | null;
}

interface Group {
  id: string;
  name: string;
  teacherId: string | null;
  teacher: { id: string; name: string; email: string } | null;
  students?: User[];
  _count: { students: number };
}

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [ungroupedStudents, setUngroupedStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create group
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupTeacher, setNewGroupTeacher] = useState("");
  const [creating, setCreating] = useState(false);

  // Import
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    total: number; success: number; failed: number;
    results: { name: string; fin: string; status: string }[];
  } | null>(null);

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/groups");
      if (res.ok) setGroups(await res.json());
    } catch {}
  };

  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/users?role=TEACHER");
      if (res.ok) setTeachers(await res.json());
    } catch {}
  };

  const fetchUngrouped = async () => {
    try {
      const res = await fetch("/api/users?role=STUDENT");
      if (res.ok) {
        const all: User[] = await res.json();
        setUngroupedStudents(all.filter((u) => !u.groupId));
      }
    } catch {}
  };

  useEffect(() => {
    Promise.all([fetchGroups(), fetchTeachers(), fetchUngrouped()]).finally(() => setLoading(false));
  }, []);

  const fetchGroupDetail = async (groupId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (res.ok) setSelectedGroup(await res.json());
    } catch {}
    setDetailLoading(false);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName.trim(), teacherId: newGroupTeacher || null }),
      });
      if (!res.ok) { const d = await res.json(); alert(d.error); return; }
      setShowCreateModal(false);
      setNewGroupName("");
      setNewGroupTeacher("");
      await fetchGroups();
    } catch (err: any) { alert(err.message); }
    finally { setCreating(false); }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Bu qrupu silmek isteyirsiniz?")) return;
    await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
    if (selectedGroup?.id === groupId) setSelectedGroup(null);
    await fetchGroups();
    await fetchUngrouped();
  };

  const handleAddStudentToGroup = async (studentId: string) => {
    if (!selectedGroup) return;
    await fetch(`/api/users/${studentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: selectedGroup.id }),
    });
    await fetchGroupDetail(selectedGroup.id);
    await fetchGroups();
    await fetchUngrouped();
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm("Telebeni qrupdan cixarmaq isteyirsiniz?")) return;
    await fetch(`/api/users/${studentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: null }),
    });
    if (selectedGroup) await fetchGroupDetail(selectedGroup.id);
    await fetchGroups();
    await fetchUngrouped();
  };

  const handleChangeTeacher = async (groupId: string, teacherId: string) => {
    await fetch(`/api/groups/${groupId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId: teacherId || null }),
    });
    await fetchGroups();
    if (selectedGroup?.id === groupId) await fetchGroupDetail(groupId);
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><p className="text-muted-foreground">Yuklenir...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Qruplar</h1>
          <p className="text-sm text-muted-foreground">Qruplari idare edin, telebeler teyin edin</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Yeni Qrup
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Groups list */}
        <div className="space-y-2">
          {groups.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Hele qrup yoxdur
            </div>
          ) : (
            groups.map((g) => (
              <div
                key={g.id}
                onClick={() => fetchGroupDetail(g.id)}
                className={`cursor-pointer rounded-lg border bg-card p-4 transition-colors hover:border-primary ${
                  selectedGroup?.id === g.id ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{g.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {g.teacher?.name || "Muellim yoxdur"} | {g._count.students} telebe
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteGroup(g.id); }}
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
              <p className="text-sm text-muted-foreground">Qrup secin</p>
            </div>
          ) : detailLoading ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground">Yuklenir...</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">{selectedGroup.name}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowImportModal(true); setImportResult(null); setImportFile(null); }}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    Excel Import
                  </button>
                </div>
              </div>

              {/* Teacher assignment */}
              <div className="mb-4 flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Muellim:</span>
                <select
                  value={selectedGroup.teacherId || ""}
                  onChange={(e) => handleChangeTeacher(selectedGroup.id, e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Secin</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Students */}
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                Telebeler ({(selectedGroup.students || []).length})
              </h3>
              <table className="mb-4 w-full text-left text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="pb-2 font-medium text-muted-foreground">#</th>
                    <th className="pb-2 font-medium text-muted-foreground">Ad Soyad</th>
                    <th className="pb-2 font-medium text-muted-foreground">FIN</th>
                    <th className="pb-2 font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedGroup.students || []).map((s, i) => (
                    <tr key={s.id} className="border-b border-border last:border-0">
                      <td className="py-2 text-muted-foreground">{i + 1}</td>
                      <td className="py-2 font-medium text-foreground">{s.name}</td>
                      <td className="py-2 font-mono text-foreground">{s.fin || "-"}</td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => handleRemoveStudent(s.id)}
                          className="text-xs text-destructive hover:underline"
                        >
                          Cixar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(selectedGroup.students || []).length === 0 && (
                    <tr><td colSpan={4} className="py-4 text-center text-sm text-muted-foreground">Telebe yoxdur</td></tr>
                  )}
                </tbody>
              </table>

              {/* Add ungrouped students */}
              {ungroupedStudents.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Qrupsuz telebeler</h3>
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {ungroupedStudents.map((s) => (
                      <div key={s.id} className="flex items-center justify-between rounded border border-dashed border-border px-3 py-2">
                        <span className="text-sm text-foreground">{s.name} <span className="font-mono text-xs text-muted-foreground">{s.fin}</span></span>
                        <button
                          onClick={() => handleAddStudentToGroup(s.id)}
                          className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20"
                        >
                          Elave et
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
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
                <label className="mb-1 block text-sm font-medium">Qrup Adi</label>
                <input
                  type="text" required value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Mes: 101-ci qrup"
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Muellim</label>
                <select
                  value={newGroupTeacher}
                  onChange={(e) => setNewGroupTeacher(e.target.value)}
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Secin (istege bagli)</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">Legv et</button>
                <button type="submit" disabled={creating}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  {creating ? "Yaradilir..." : "Yarat"}
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
            <h2 className="mb-4 text-lg font-semibold">Excel Import - {selectedGroup.name}</h2>
            {!importResult ? (
              <div className="space-y-4">
                <div className="rounded-md border border-dashed border-border bg-muted/30 p-6 text-center">
                  <p className="mb-3 text-sm text-muted-foreground">Excel: <b>Ad Soyad</b> ve <b>FIN</b> sutunlari</p>
                  <a href="/api/users/template" className="inline-block rounded-md border border-primary bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10">
                    Shablon Yukle
                  </a>
                </div>
                <div>
                  <input type="file" accept=".xlsx,.xls" onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="w-full rounded-md border border-input px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-sm file:text-primary" />
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowImportModal(false)} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">Legv et</button>
                  <button
                    onClick={async () => {
                      if (!importFile) return;
                      setImporting(true);
                      try {
                        const fd = new FormData();
                        fd.append("file", importFile);
                        fd.append("groupId", selectedGroup.id);
                        const res = await fetch("/api/users/import", { method: "POST", body: fd });
                        setImportResult(await res.json());
                        await fetchGroupDetail(selectedGroup.id);
                        await fetchGroups();
                        await fetchUngrouped();
                      } catch {} finally { setImporting(false); }
                    }}
                    disabled={!importFile || importing}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                    {importing ? "Import edilir..." : "Import Et"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-md bg-muted p-3 text-center"><p className="text-2xl font-bold">{importResult.total}</p><p className="text-xs text-muted-foreground">Umumi</p></div>
                  <div className="rounded-md bg-green-50 p-3 text-center"><p className="text-2xl font-bold text-green-700">{importResult.success}</p><p className="text-xs text-green-600">Ugurlu</p></div>
                  <div className="rounded-md bg-red-50 p-3 text-center"><p className="text-2xl font-bold text-red-700">{importResult.failed}</p><p className="text-xs text-red-600">Ugursuz</p></div>
                </div>
                <div className="max-h-48 overflow-y-auto rounded-md border border-border text-sm">
                  {importResult.results.map((r, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-border px-3 py-2 last:border-0">
                      <span>{r.name} <span className="font-mono text-xs text-muted-foreground">{r.fin}</span></span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${r.status === "Ugurla yaradildi" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{r.status}</span>
                    </div>
                  ))}
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
