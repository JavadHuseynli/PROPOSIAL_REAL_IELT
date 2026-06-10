"use client";

import { useEffect, useState } from "react";

interface Answer {
  id: string;
  userAnswer: string;
  isCorrect: boolean;
  points: number;
  question: {
    id: string;
    questionText: string;
    questionType: string;
    correctAnswer: string;
    order: number;
    points: number;
  };
}

interface Attempt {
  id: string;
  status: string;
  score: number | null;
  startedAt: string;
  completedAt: string | null;
  test: { id: string; title: string; type: string };
  answers: Answer[];
}

interface Student {
  id: string;
  name: string;
  email: string;
  group: { id: string; name: string } | null;
  attempts: Attempt[];
}

export default function AdminResultsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);
  const [attemptDetails, setAttemptDetails] = useState<Record<string, Attempt>>({});
  const [loadingAttempt, setLoadingAttempt] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersRes, attemptsRes] = await Promise.all([
          fetch("/api/users?role=STUDENT"),
          fetch("/api/attempts"),
        ]);
        const users: Student[] = usersRes.ok ? await usersRes.json() : [];
        const attempts: Attempt[] = attemptsRes.ok ? await attemptsRes.json() : [];

        const attemptsMap: Record<string, Attempt[]> = {};
        for (const a of attempts) {
          if (!attemptsMap[a.test?.id]) attemptsMap[a.test?.id] = [];
        }

        const studentMap: Record<string, Student> = {};
        for (const u of users) {
          studentMap[u.id] = { ...u, attempts: [] };
        }

        for (const a of attempts) {
          const userId = (a as any).userId;
          if (userId && studentMap[userId]) {
            if (
              (a.test.type === "LISTENING" || a.test.type === "READING") &&
              (a.status === "COMPLETED" || a.status === "GRADED")
            ) {
              studentMap[userId].attempts.push(a);
            }
          }
        }

        setStudents(
          Object.values(studentMap)
            .filter((s) => s.attempts.length > 0)
            .sort((a, b) => (a.group?.name ?? "").localeCompare(b.group?.name ?? "") || a.name.localeCompare(b.name))
        );
      } catch {}
      setLoading(false);
    }
    fetchData();
  }, []);

  async function toggleAttempt(attemptId: string) {
    if (expandedAttempt === attemptId) {
      setExpandedAttempt(null);
      return;
    }
    setExpandedAttempt(attemptId);
    if (attemptDetails[attemptId]) return;

    setLoadingAttempt(attemptId);
    try {
      const res = await fetch(`/api/attempts/${attemptId}`);
      if (res.ok) {
        const data = await res.json();
        setAttemptDetails((prev) => ({ ...prev, [attemptId]: data }));
      }
    } catch {}
    setLoadingAttempt(null);
  }

  const groups = Array.from(new Set(students.map((s) => s.group?.name ?? "Qrub yoxdur"))).sort();
  const types = ["LISTENING", "READING"];

  const filtered = students.filter((s) => {
    const groupMatch = selectedGroup === "all" || (s.group?.name ?? "Qrub yoxdur") === selectedGroup;
    return groupMatch;
  });

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><p className="text-muted-foreground">Yüklənir...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tələbə Cavabları</h1>
          <p className="text-sm text-muted-foreground">Reading / Listening cavabları</p>
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

      <div className="space-y-3">
        {filtered.map((student) => {
          const shownAttempts = student.attempts.filter(
            (a) => selectedType === "all" || a.test.type === selectedType
          );
          if (shownAttempts.length === 0) return null;

          return (
            <div key={student.id} className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-4 px-4 py-3 bg-muted/40">
                <div className="flex-1">
                  <span className="font-medium text-foreground">{student.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{student.group?.name ?? "—"}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {shownAttempts.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => toggleAttempt(a.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        expandedAttempt === a.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-background border border-border text-foreground hover:bg-accent"
                      }`}
                    >
                      {a.test.title} — {a.score !== null ? `${a.score}/10` : "—"}
                    </button>
                  ))}
                </div>
              </div>

              {shownAttempts.map((a) => {
                if (expandedAttempt !== a.id) return null;
                const detail = attemptDetails[a.id];

                return (
                  <div key={a.id} className="border-t border-border">
                    {loadingAttempt === a.id ? (
                      <p className="p-4 text-sm text-muted-foreground">Yüklənir...</p>
                    ) : detail ? (
                      <div className="divide-y divide-border">
                        {detail.answers
                          .sort((x, y) => x.question.order - y.question.order)
                          .map((ans, idx) => (
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
                                <p className="text-foreground line-clamp-2">{ans.question.questionText}</p>
                                <div className="mt-1 flex flex-wrap gap-4 text-xs">
                                  <span>
                                    <span className="text-muted-foreground">Cavab: </span>
                                    <span className={ans.isCorrect ? "text-green-700 font-medium" : "text-red-700 font-medium"}>
                                      {ans.userAnswer || "(boş)"}
                                    </span>
                                  </span>
                                  {!ans.isCorrect && (
                                    <span>
                                      <span className="text-muted-foreground">Düzgün: </span>
                                      <span className="text-green-700 font-medium">{ans.question.correctAnswer}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className={`shrink-0 text-xs font-medium ${ans.isCorrect ? "text-green-700" : "text-red-700"}`}>
                                {ans.points}/{ans.question.points}
                              </span>
                            </div>
                          ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        })}

        {filtered.every((s) =>
          s.attempts.filter((a) => selectedType === "all" || a.test.type === selectedType).length === 0
        ) && (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">Nəticə tapılmadı.</p>
          </div>
        )}
      </div>
    </div>
  );
}
