"use client";

import { useEffect, useState } from "react";

interface Group {
  id: string;
  name: string;
}

interface Test {
  id: string;
  title: string;
  type: string;
}

interface Schedule {
  id: string;
  examDate: string;
  note: string | null;
  group: { id: string; name: string };
  test: { id: string; title: string; type: string };
}

const TYPE_COLORS: Record<string, string> = {
  LISTENING: "bg-purple-100 text-purple-700",
  READING: "bg-emerald-100 text-emerald-700",
  WRITING: "bg-orange-100 text-orange-700",
};

export default function ExamSchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [formGroupId, setFormGroupId] = useState("");
  const [formTestId, setFormTestId] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formNote, setFormNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    const [schRes, grpRes, tstRes] = await Promise.all([
      fetch("/api/exam-schedules"),
      fetch("/api/groups"),
      fetch("/api/tests"),
    ]);
    if (schRes.ok) setSchedules(await schRes.json());
    if (grpRes.ok) setGroups(await grpRes.json());
    if (tstRes.ok) setTests((await tstRes.json()).filter((t: Test & { isActive: boolean }) => t.isActive));
  };

  useEffect(() => { fetchAll().finally(() => setLoading(false)); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formGroupId || !formTestId || !formDate) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/exam-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: formGroupId, testId: formTestId, examDate: formDate, note: formNote || null }),
      });
      if (!res.ok) { const d = await res.json(); alert(d.error); return; }
      setShowModal(false);
      setFormGroupId(""); setFormTestId(""); setFormDate(""); setFormNote("");
      await fetchAll();
    } catch (err: any) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu imtahan tarixini silmek isteyirsiniz?")) return;
    await fetch(`/api/exam-schedules/${id}`, { method: "DELETE" });
    await fetchAll();
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("az-AZ", { day: "2-digit", month: "long", year: "numeric" });

  // Group schedules by group
  const grouped = groups.map((g) => ({
    ...g,
    schedules: schedules.filter((s) => s.group.id === g.id),
  })).filter((g) => g.schedules.length > 0);

  const unscheduledGroups = groups.filter((g) => !schedules.some((s) => s.group.id === g.id));

  if (loading) return <div className="flex h-64 items-center justify-center"><p className="text-muted-foreground">Yuklenir...</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Imtahan Tarixleri</h1>
          <p className="text-sm text-muted-foreground">Qruplar ucun imtahan tarixleri teyin edin</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Imtahan Tarixi
        </button>
      </div>

      {/* Scheduled groups */}
      {grouped.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <p className="mb-2 text-lg text-muted-foreground">Hele imtahan tarixi teyin olunmayib</p>
          <p className="text-sm text-muted-foreground">"+ Imtahan Tarixi" basib qrup ucun tarix teyin edin</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((g) => (
            <div key={g.id} className="rounded-lg border border-border bg-card">
              <div className="border-b border-border bg-muted/30 px-5 py-3">
                <h3 className="font-semibold text-foreground">{g.name}</h3>
              </div>
              <div className="divide-y divide-border">
                {g.schedules.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[s.test.type] || ""}`}>
                        {s.test.type}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.test.title}</p>
                        {s.note && <p className="text-xs text-muted-foreground">{s.note}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="rounded-md bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                        {formatDate(s.examDate)}
                      </span>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-xs text-destructive hover:underline"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Unscheduled groups */}
      {unscheduledGroups.length > 0 && grouped.length > 0 && (
        <div className="rounded-md border border-dashed border-border bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">
            Imtahan tarixi teyin olunmamish qruplar: {unscheduledGroups.map((g) => g.name).join(", ")}
          </p>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">Imtahan Tarixi Teyin Et</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Qrup</label>
                <select
                  required value={formGroupId}
                  onChange={(e) => setFormGroupId(e.target.value)}
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Qrup secin</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Test</label>
                <select
                  required value={formTestId}
                  onChange={(e) => setFormTestId(e.target.value)}
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Test secin</option>
                  {tests.map((t) => (
                    <option key={t.id} value={t.id}>{t.title} ({t.type})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Imtahan Tarixi</label>
                <input
                  type="date" required value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Qeyd (istege bagli)</label>
                <input
                  type="text" value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Mes: Aud. 305, saat 10:00"
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">Legv et</button>
                <button type="submit" disabled={submitting}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                  {submitting ? "Saxlanilir..." : "Teyin Et"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
