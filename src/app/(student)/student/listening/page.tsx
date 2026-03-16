"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Test {
  id: string;
  title: string;
  type: string;
  description: string | null;
  duration: number | null;
  isActive: boolean;
  _count: { questions: number };
}

interface Attempt {
  id: string;
  testId: string;
  status: string;
  score: number | null;
  startedAt: string;
}

export default function ListeningPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignedTest, setAssignedTest] = useState<Test | null>(null);
  const [completedAttempt, setCompletedAttempt] = useState<Attempt | null>(null);

  useEffect(() => {
    async function assignRandomTest() {
      try {
        const [testsRes, attemptsRes] = await Promise.all([
          fetch("/api/tests?type=LISTENING"),
          fetch("/api/attempts"),
        ]);
        if (!testsRes.ok) throw new Error("Testlər yüklənmədi");

        const tests: Test[] = (await testsRes.json()).filter((t: Test) => t.isActive);
        const attempts: Attempt[] = attemptsRes.ok ? await attemptsRes.json() : [];

        if (tests.length === 0) {
          setError("Aktiv listening testi yoxdur");
          setLoading(false);
          return;
        }

        // Only today's completed attempts block retaking
        const today = new Date().toISOString().split("T")[0];
        const todayCompletedIds = attempts
          .filter((a) => (a.status === "COMPLETED" || a.status === "GRADED") && a.startedAt?.startsWith(today))
          .map((a) => a.testId);

        const availableTests = tests.filter((t) => !todayCompletedIds.includes(t.id));

        if (availableTests.length === 0) {
          const todayAttempt = attempts
            .filter((a) => (a.status === "COMPLETED" || a.status === "GRADED") && a.startedAt?.startsWith(today) && tests.some((t) => t.id === a.testId))[0];
          if (todayAttempt) {
            const test = tests.find((t) => t.id === todayAttempt.testId) || tests[0];
            setAssignedTest(test);
            setCompletedAttempt(todayAttempt);
          } else {
            // No today attempt - pick random
            const test = tests[Math.floor(Math.random() * tests.length)];
            setAssignedTest(test);
          }
        } else {
          const seedKey = "ielts-listening-assigned";
          let savedTestId = localStorage.getItem(seedKey);
          let test = availableTests.find((t) => t.id === savedTestId);
          if (!test) {
            test = availableTests[Math.floor(Math.random() * availableTests.length)];
            localStorage.setItem(seedKey, test.id);
          }
          setAssignedTest(test);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Xəta baş verdi");
      } finally {
        setLoading(false);
      }
    }
    assignRandomTest();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Test təyin olunur...</p>
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

  if (!assignedTest) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Listening Test</h1>
        <p className="mt-1 text-muted-foreground">Sizə təyin olunmuş listening testi</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-8">
        <div className="mb-2">
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">Listening</span>
        </div>
        <h2 className="mt-3 text-xl font-semibold text-foreground">{assignedTest.title}</h2>
        {assignedTest.description && (
          <p className="mt-2 text-sm text-muted-foreground">{assignedTest.description}</p>
        )}
        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          {assignedTest.duration && <span>{assignedTest.duration} dəqiqə</span>}
          <span>{assignedTest._count.questions} sual</span>
        </div>

        <div className="mt-6">
          {completedAttempt ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-md bg-green-100 px-4 py-3">
                <span className="text-sm font-medium text-green-800">Tamamlanıb</span>
                {completedAttempt.score !== null && (
                  <span className="text-lg font-bold text-green-800">Band: {completedAttempt.score}</span>
                )}
              </div>
              <button
                onClick={() => router.push(`/student/tests/${assignedTest.id}/result`)}
                className="w-full rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                Nəticəyə Bax
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push(`/student/tests/${assignedTest.id}`)}
              className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Testə Başla
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
