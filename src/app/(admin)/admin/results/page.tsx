"use client";

import { useEffect, useState } from "react";

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  correctAnswer: string;
  order: number;
  points: number;
}

interface Answer {
  id: string;
  userAnswer: string;
  isCorrect: boolean;
  points: number;
  question: Question;
}

interface Attempt {
  id: string;
  status: string;
  score: number | null;
  startedAt: string;
  completedAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    group: { id: string; name: string } | null;
  };
  test: { id: string; title: string; type: string };
  answers: Answer[];
}

export default function AdminResultsPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  useEffect(() => {
    fetch("/api/admin/results")
      .then((r) => r.json())
      .then((data) => {
        setAttempts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const groups = Array.from(
    new Set(attempts.map((a) => a.user.group?.name ?? "Qrub yoxdur"))
  ).sort();

  const filtered = attempts.filter((a) => {
    const groupMatch =
      selectedGroup === "all" ||
      (a.user.group?.name ?? "Qrub yoxdur") === selectedGroup;
    const typeMatch = selectedType === "all" || a.test.type === selectedType;
    return groupMatch && typeMatch;
  });

  // Group by student
  const byStudent: Record<string, { user: Attempt["user"]; attempts: Attempt[] }> = {};
  for (const a of filtered) {
    if (!byStudent[a.user.id]) {
      byStudent[a.user.id] = { user: a.user, attempts: [] };
    }
    byStudent[a.user.id].attempts.push(a);
  }
  const students = Object.values(byStudent).sort(
    (a, b) =>
      (a.user.group?.name ?? "").localeCompare(b.user.group?.name ?? "") ||
      a.user.name.localeCompare(b.user.name)
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Yüklənir...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tələbə Cavabları</h1>
          <p className="text-sm text-muted-foreground">
            Reading / Listening cavabları · {filtered.length} cəhd
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Bütün qruplar</option>
            {groups.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Hamısı</option>
            <option value="LISTENING">Listening</option>
            <option value="READING">Reading</option>
          </select>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">Nəticə tapılmadı.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map(({ user, attempts: studentAttempts }) => (
            <div
              key={user.id}
              className="rounded-lg border border-border bg-card overflow-hidden"
            >
              <div className="flex items-center gap-4 px-4 py-3 bg-muted/40">
                <div className="flex-1">
                  <span className="font-medium text-foreground">{user.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {user.group?.name ?? "—"}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {studentAttempts.map((a) => (
                    <button
                      key={a.id}
                      onClick={() =>
                        setExpandedAttempt(expandedAttempt === a.id ? null : a.id)
                      }
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        expandedAttempt === a.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-background border border-border text-foreground hover:bg-accent"
                      }`}
                    >
                      {a.test.type === "LISTENING" ? "L" : "R"} · {a.test.title.trim()} ·{" "}
                      {a.score !== null ? `${a.score}/10` : "—"}
                    </button>
                  ))}
                </div>
              </div>

              {studentAttempts.map((a) => {
                if (expandedAttempt !== a.id) return null;
                const sorted = [...a.answers].sort(
                  (x, y) => x.question.order - y.question.order
                );
                return (
                  <div key={a.id} className="border-t border-border divide-y divide-border">
                    {sorted.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground">Cavab yoxdur.</p>
                    ) : (
                      sorted.map((ans, idx) => (
                        <div
                          key={ans.id}
                          className={`flex items-start gap-3 px-4 py-2.5 text-sm ${
                            ans.isCorrect ? "bg-green-50" : "bg-red-50"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              ans.isCorrect
                                ? "bg-green-200 text-green-800"
                                : "bg-red-200 text-red-800"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground line-clamp-2">
                              {ans.question.questionText}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-4 text-xs">
                              <span>
                                <span className="text-muted-foreground">Cavab: </span>
                                <span
                                  className={
                                    ans.isCorrect
                                      ? "text-green-700 font-medium"
                                      : "text-red-700 font-medium"
                                  }
                                >
                                  {ans.userAnswer || "(boş)"}
                                </span>
                              </span>
                              {!ans.isCorrect && (
                                <span>
                                  <span className="text-muted-foreground">Düzgün: </span>
                                  <span className="text-green-700 font-medium">
                                    {ans.question.correctAnswer}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            className={`shrink-0 text-xs font-medium ${
                              ans.isCorrect ? "text-green-700" : "text-red-700"
                            }`}
                          >
                            {ans.points}/{ans.question.points}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
