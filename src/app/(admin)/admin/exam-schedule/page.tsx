"use client";

import { useEffect, useState } from "react";

interface Group { id: string; name: string; }
interface Schedule {
  id: string;
  examDate: string;
  startTime: string;
  endTime: string;
  note: string | null;
  group: { id: string; name: string };
}

export default function ExamSchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [formGroupId, setFormGroupId] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("12:00");
  const [formNote, setFormNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    const [schRes, grpRes] = await Promise.all([
      fetch("/api/exam-schedules"),
      fetch("/api/groups"),
    ]);
    if (schRes.ok) setSchedules(await schRes.json());
    if (grpRes.ok) setGroups(await grpRes.json());
  };

  useEffect(() => { fetchAll().finally(() => setLoading(false)); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formGroupId || !formDate || !formStartTime || !formEndTime) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/exam-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: formGroupId,
          examDate: formDate,
          startTime: formStartTime,
          endTime: formEndTime,
          note: formNote || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); alert(d.error); return; }
      setShowModal(false);
      setFormGroupId(""); setFormDate(""); setFormStartTime("09:00"); setFormEndTime("12:00"); setFormNote("");
      await fetchAll();
    } catch (err: any) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Silmek isteyirsiniz?")) return;
    await fetch(`/api/exam-schedules/${id}`, { method: "DELETE" });
    await fetchAll();
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const day = date.getDate().toString().padStart(2, "0");
    const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const scheduledGroupIds = schedules.map((s) => s.group.id);
  const unscheduledGroups = groups.filter((g) => !scheduledGroupIds.includes(g.id));

  if (loading) return <div className="flex h-64 items-center justify-center"><p className="text-muted-foreground">Yuklenir...</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Imtahan Tarixleri</h1>
          <p className="text-sm text-muted-foreground">Qruplar ucun imtahan tarixi ve saat araligi teyin edin</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Imtahan Tarixi
        </button>
      </div>

      {schedules.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <p className="mb-2 text-lg text-muted-foreground">Hele imtahan tarixi teyin olunmayib</p>
          <p className="text-sm text-muted-foreground">"+ Imtahan Tarixi" basib qrup ucun tarix teyin edin</p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-6 py-4">
              <div>
                <h3 className="font-semibold text-foreground">{s.group.name}</h3>
                {s.note && <p className="text-xs text-muted-foreground">{s.note}</p>}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary">{formatDate(s.examDate)}</p>
                  <p className="text-xs text-muted-foreground">{s.startTime} - {s.endTime}</p>
                </div>
                <button onClick={() => handleDelete(s.id)} className="text-xs text-destructive hover:underline">Sil</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {unscheduledGroups.length > 0 && schedules.length > 0 && (
        <div className="rounded-md border border-dashed border-border bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">
            Tarixi teyin olunmamish: {unscheduledGroups.map((g) => g.name).join(", ")}
          </p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">Imtahan Tarixi Teyin Et</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Qrup</label>
                <select required value={formGroupId} onChange={(e) => setFormGroupId(e.target.value)}
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Qrup secin</option>
                  {groups.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Imtahan Tarixi</label>
                <input type="date" required value={formDate} onChange={(e) => setFormDate(e.target.value)}
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Baslama saati</label>
                  <input type="time" required value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Bitme saati</label>
                  <input type="time" required value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Qeyd</label>
                <input type="text" value={formNote} onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Mes: Aud. 305"
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
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
