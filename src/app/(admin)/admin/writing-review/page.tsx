"use client";

import { useEffect, useState } from "react";

interface WritingSubmission {
  id: string;
  content: string;
  wordCount: number;
  submittedAt: string;
  writingTask: { taskType: string; prompt: string };
  attempt: {
    user: { id: string; name: string; email: string };
    test: { title: string; type: string };
  };
  review: { id: string; overallBand: number; comments: string | null } | null;
}

export default function AdminWritingReviewPage() {
  const [submissions, setSubmissions] = useState<WritingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WritingSubmission | null>(null);
  const [score, setScore] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "unreviewed" | "reviewed">("unreviewed");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSubmissions();
  }, []);

  async function fetchSubmissions() {
    setLoading(true);
    try {
      const res = await fetch("/api/writing-submissions");
      if (res.ok) setSubmissions(await res.json());
    } catch {}
    setLoading(false);
  }

  async function handleSave() {
    if (!selected) return;
    const s = parseFloat(score);
    if (isNaN(s) || s < 0 || s > 10) {
      setError("0 ilə 10 arasında bal daxil edin");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/writing-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: selected.id, score: s, comments: comment || null }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Xəta baş verdi");
      } else {
        await fetchSubmissions();
        setSelected(null);
        setScore("");
        setComment("");
      }
    } catch {
      setError("Xəta baş verdi");
    }
    setSaving(false);
  }

  const filtered = submissions.filter((s) => {
    if (filter === "unreviewed") return !s.review;
    if (filter === "reviewed") return !!s.review;
    return true;
  });

  const unreviewedCount = submissions.filter((s) => !s.review).length;

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><p className="text-muted-foreground">Yüklənir...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Writing Yoxlama</h1>
          <p className="text-sm text-muted-foreground">
            {unreviewedCount} yoxlanmamış submission
          </p>
        </div>
        <div className="flex gap-2">
          {(["unreviewed", "reviewed", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              {f === "unreviewed" ? "Gözləyən" : f === "reviewed" ? "Yoxlanmış" : "Hamısı"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Submissions list */}
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <p className="text-muted-foreground">Submission yoxdur</p>
            </div>
          )}
          {filtered.map((sub) => (
            <div
              key={sub.id}
              onClick={() => { setSelected(sub); setScore(sub.review ? String(sub.review.overallBand) : ""); setComment(sub.review?.comments || ""); setError(""); }}
              className={`cursor-pointer rounded-lg border p-4 transition-colors hover:border-primary ${
                selected?.id === sub.id ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-foreground">{sub.attempt.user.name}</p>
                {sub.review ? (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                    {sub.review.overallBand}/10
                  </span>
                ) : (
                  <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                    Gözləyir
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {sub.attempt.test.title} · {sub.writingTask.taskType} · {sub.wordCount} söz
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{sub.content}</p>
            </div>
          ))}
        </div>

        {/* Review panel */}
        <div className="sticky top-6">
          {!selected ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
              <p className="text-sm text-muted-foreground">Sol tərəfdən submission seçin</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card space-y-4 p-5">
              <div>
                <p className="font-semibold text-foreground">{selected.attempt.user.name}</p>
                <p className="text-xs text-muted-foreground">{selected.attempt.test.title} · {selected.writingTask.taskType}</p>
              </div>

              {/* Prompt */}
              <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                <p className="mb-1 font-medium text-foreground">Tapşırıq:</p>
                {selected.writingTask.prompt}
              </div>

              {/* Student text */}
              <div>
                <p className="mb-1 text-xs font-medium text-foreground">Tələbənin cavabı ({selected.wordCount} söz):</p>
                <div className="max-h-64 overflow-y-auto rounded-md border border-border bg-background p-3 text-sm text-foreground whitespace-pre-wrap">
                  {selected.content}
                </div>
              </div>

              {/* Score input */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Bal (0–10)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  disabled={!!selected.review}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                  placeholder="məs. 7.5"
                />
              </div>

              {/* Comment */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Şərh (ixtiyari)
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={!!selected.review}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                  placeholder="Tələbəyə şərh..."
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              {selected.review ? (
                <p className="text-sm text-green-600 font-medium">✓ Qiymətləndirilib: {selected.review.overallBand}/10</p>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving || !score}
                  className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? "Saxlanır..." : "Qiymətləndir"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
