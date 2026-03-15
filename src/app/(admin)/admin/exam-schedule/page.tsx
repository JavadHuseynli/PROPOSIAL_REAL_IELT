"use client";

import { useEffect, useState } from "react";

interface Group { id: string; name: string; _count?: { students: number }; }
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
  const [now, setNow] = useState(new Date());

  const [showModal, setShowModal] = useState(false);
  const [formGroupId, setFormGroupId] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("12:00");
  const [formNote, setFormNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchAll = async () => {
    try {
      const [schRes, grpRes] = await Promise.all([
        fetch("/api/exam-schedules"),
        fetch("/api/groups"),
      ]);
      if (schRes.ok) setSchedules(await schRes.json());
      if (grpRes.ok) setGroups(await grpRes.json());
    } catch {}
  };

  useEffect(() => { fetchAll().finally(() => setLoading(false)); }, []);

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getExamStatus = (s: Schedule) => {
    const dateStr = new Date(s.examDate).toISOString().split("T")[0];
    const start = new Date(`${dateStr}T${s.startTime}:00`);
    const end = new Date(`${dateStr}T${s.endTime}:00`);
    const todayStr = now.toISOString().split("T")[0];

    if (todayStr < dateStr) return "upcoming"; // gelmeyib
    if (todayStr > dateStr) return "finished"; // kecib
    if (now < start) return "waiting"; // bugun amma hele baslamayib
    if (now >= start && now <= end) return "active"; // hazirda gedir
    return "finished"; // bugun amma artiq bitib
  };

  const getTimeRemaining = (s: Schedule) => {
    const dateStr = new Date(s.examDate).toISOString().split("T")[0];
    const start = new Date(`${dateStr}T${s.startTime}:00`);
    const end = new Date(`${dateStr}T${s.endTime}:00`);
    const status = getExamStatus(s);

    // Baslamamissa - baslama vaxtina qeder
    const target = (status === "upcoming" || status === "waiting") ? start : end;
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return "Bitdi";

    const days = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s2 = Math.floor((diff % 60000) / 1000);

    if (days > 0) {
      return `${days} gun ${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s2.toString().padStart(2, "0")}`;
    }
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s2.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
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
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Xeta");
        return;
      }
      setShowModal(false);
      setFormGroupId(""); setFormDate(""); setFormStartTime("09:00"); setFormEndTime("12:00"); setFormNote("");
      await fetchAll();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
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
    return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    upcoming: { label: "Gozleyir", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
    waiting: { label: "Bu gun - hele baslamayib", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
    active: { label: "Hazirda gedir", color: "text-green-700", bg: "bg-green-50 border-green-300" },
    finished: { label: "Tamamlanib", color: "text-gray-500", bg: "bg-gray-50 border-gray-200" },
  };

  const scheduledGroupIds = schedules.map((s) => s.group.id);
  const unscheduledGroups = groups.filter((g) => !scheduledGroupIds.includes(g.id));

  if (loading) return <div className="flex h-64 items-center justify-center"><p className="text-muted-foreground">Yuklenir...</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Imtahan Tarixleri</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(now.toISOString())} | {now.toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
        </div>
        <button onClick={() => { setShowModal(true); setFormError(""); }}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          + Imtahan Tarixi
        </button>
      </div>

      {schedules.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <p className="mb-2 text-lg text-muted-foreground">Hele imtahan tarixi teyin olunmayib</p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((s) => {
            const status = getExamStatus(s);
            const cfg = statusConfig[status];
            return (
              <div key={s.id} className={`rounded-lg border p-5 ${cfg.bg}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{s.group.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(s.examDate)} | {s.startTime} - {s.endTime}
                    </p>
                    {s.note && <p className="text-xs text-muted-foreground">{s.note}</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        {status === "active" && (
                          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500"></span>
                        )}
                        <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      {(status === "active" || status === "upcoming" || status === "waiting") && (
                        <p className={`mt-1 text-lg font-bold ${status === "active" ? "text-green-700" : "text-blue-700"}`}>
                          {getTimeRemaining(s)}
                        </p>
                      )}
                    </div>
                    <button onClick={() => handleDelete(s.id)} className="text-xs text-destructive hover:underline">Sil</button>
                  </div>
                </div>
              </div>
            );
          })}
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
            {formError && (
              <div className="mb-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{formError}</div>
            )}
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
                <label className="mb-1 block text-sm font-medium">Tarix</label>
                <input type="date" required value={formDate} onChange={(e) => setFormDate(e.target.value)}
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Baslama</label>
                  <input type="time" required value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Bitme</label>
                  <input type="time" required value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Qeyd</label>
                <input type="text" value={formNote} onChange={(e) => setFormNote(e.target.value)} placeholder="Mes: Aud. 305"
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
