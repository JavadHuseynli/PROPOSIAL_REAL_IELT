"use client";

import { useEffect, useState } from "react";

interface Attempt {
  id: string;
  testId: string;
  status: string;
  score: number | null;
  startedAt: string;
  completedAt: string | null;
  test: {
    id: string;
    title: string;
    type: string;
  };
}

const TYPE_COLORS: Record<string, string> = {
  LISTENING: "bg-purple-100 text-purple-700",
  READING: "bg-emerald-100 text-emerald-700",
  WRITING: "bg-orange-100 text-orange-700",
};

export default function ResultsPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch("/api/attempts");
        if (res.ok) {
          const data = await res.json();
          setAttempts(data.filter((a: Attempt) => a.status === "COMPLETED" || a.status === "GRADED"));
        }
      } catch {}
      setLoading(false);
    }
    fetchResults();
  }, []);

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    const date = new Date(d);
    const day = date.getDate().toString().padStart(2, "0");
    const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
    return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Group by date
  const grouped = new Map<string, Attempt[]>();
  for (const a of attempts) {
    const dateKey = a.completedAt ? formatDate(a.completedAt) : "Tarix yoxdur";
    if (!grouped.has(dateKey)) grouped.set(dateKey, []);
    grouped.get(dateKey)!.push(a);
  }

  // Calculate overall averages
  const listeningScores = attempts.filter(a => a.test.type === "LISTENING" && a.score !== null).map(a => a.score!);
  const readingScores = attempts.filter(a => a.test.type === "READING" && a.score !== null).map(a => a.score!);
  const writingScores = attempts.filter(a => a.test.type === "WRITING" && a.score !== null).map(a => a.score!);

  const avg = (arr: number[]) => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 2) / 2 : null;

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><p className="text-muted-foreground">Yuklenir...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Neticelerim</h1>
        <p className="text-sm text-muted-foreground">Butun imtahan neticeleriniz</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-center">
          <p className="text-xs text-purple-600">Listening</p>
          <p className="text-2xl font-bold text-purple-700">{avg(listeningScores) ?? "-"}</p>
          <p className="text-[10px] text-purple-500">{listeningScores.length} imtahan</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
          <p className="text-xs text-emerald-600">Reading</p>
          <p className="text-2xl font-bold text-emerald-700">{avg(readingScores) ?? "-"}</p>
          <p className="text-[10px] text-emerald-500">{readingScores.length} imtahan</p>
        </div>
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-center">
          <p className="text-xs text-orange-600">Writing</p>
          <p className="text-2xl font-bold text-orange-700">{avg(writingScores) ?? "-"}</p>
          <p className="text-[10px] text-orange-500">{writingScores.length} imtahan</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
          <p className="text-xs text-blue-600">Umumi Orta</p>
          <p className="text-2xl font-bold text-blue-700">
            {avg([...listeningScores, ...readingScores, ...writingScores]) ?? "-"}
          </p>
          <p className="text-[10px] text-blue-500">{attempts.length} imtahan</p>
        </div>
      </div>

      {/* Results by date */}
      {attempts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">Hele imtahan neticeniz yoxdur</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([date, dateAttempts]) => (
            <div key={date} className="rounded-lg border border-border bg-card">
              <div className="border-b border-border bg-muted/30 px-5 py-2">
                <h3 className="text-sm font-semibold text-foreground">{date}</h3>
              </div>
              <div className="divide-y divide-border">
                {dateAttempts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[a.test.type] || ""}`}>
                        {a.test.type}
                      </span>
                      <span className="text-sm text-foreground">{a.test.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {a.score !== null ? (
                        <span className={`rounded-full px-3 py-1 text-sm font-bold ${a.score >= 5 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          Band {a.score}
                        </span>
                      ) : a.status === "COMPLETED" ? (
                        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                          Qiymetlendirme gozlenilir
                        </span>
                      ) : (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                          {a.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
