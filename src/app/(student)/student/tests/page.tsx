"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Test {
  id: string;
  title: string;
  type: string;
  description: string | null;
  duration: number | null;
  isActive: boolean;
  _count: {
    questions: number;
  };
}

interface Attempt {
  id: string;
  testId: string;
  status: string;
  score: number | null;
}

const TYPE_LABELS: Record<string, string> = {
  LISTENING: "Listening",
  READING: "Reading",
  WRITING: "Writing",
};

const TYPE_COLORS: Record<string, string> = {
  LISTENING: "bg-purple-100 text-purple-700",
  READING: "bg-emerald-100 text-emerald-700",
  WRITING: "bg-orange-100 text-orange-700",
};

export default function StudentTestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    async function fetchData() {
      try {
        const [testsRes, attemptsRes] = await Promise.all([
          fetch("/api/tests"),
          fetch("/api/attempts"),
        ]);
        if (!testsRes.ok) throw new Error("Testlər yüklənmədi");
        const testsData = await testsRes.json();
        setTests(testsData.filter((t: Test) => t.isActive));

        if (attemptsRes.ok) {
          setAttempts(await attemptsRes.json());
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Xəta baş verdi");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getTestStatus = (testId: string) => {
    const testAttempts = attempts.filter((a) => a.testId === testId);
    const completed = testAttempts.find(
      (a) => a.status === "COMPLETED" || a.status === "GRADED"
    );
    if (completed) return completed;
    return null;
  };

  const filteredTests =
    filter === "ALL" ? tests : tests.filter((t) => t.type === filter);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Yüklənir...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Testlər</h1>
        <p className="mt-1 text-muted-foreground">
          Mövcud testlərdən birini seçin
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["ALL", "LISTENING", "READING", "WRITING"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              filter === type
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground border border-border hover:bg-accent"
            }`}
          >
            {type === "ALL" ? "Hamısı" : TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Test Cards */}
      {filteredTests.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">Aktiv test tapılmadı.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTests.map((test) => {
            const completedAttempt = getTestStatus(test.id);
            const isCompleted = !!completedAttempt;

            return (
              <div
                key={test.id}
                className={`flex flex-col rounded-lg border bg-card p-6 ${
                  isCompleted ? "border-green-300 bg-green-50/30" : "border-border"
                }`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-foreground">
                    {test.title}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[test.type] || ""}`}
                  >
                    {TYPE_LABELS[test.type] || test.type}
                  </span>
                </div>
                {test.description && (
                  <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                    {test.description}
                  </p>
                )}
                <div className="mt-auto space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    {test.duration && <span>{test.duration} dəqiqə</span>}
                    <span>{test._count.questions} sual</span>
                  </div>

                  {isCompleted ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-md bg-green-100 px-4 py-2">
                        <span className="text-sm font-medium text-green-800">
                          Tamamlanıb
                        </span>
                        {completedAttempt.score !== null && (
                          <span className="text-sm font-bold text-green-800">
                            Band: {completedAttempt.score}
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/student/tests/${test.id}/result`}
                        className="block w-full rounded-md border border-border px-4 py-2 text-center text-sm font-medium text-foreground transition-colors hover:bg-accent"
                      >
                        Nəticəyə Bax
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href={`/student/tests/${test.id}`}
                      className="mt-2 block w-full rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Testə Başla
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
