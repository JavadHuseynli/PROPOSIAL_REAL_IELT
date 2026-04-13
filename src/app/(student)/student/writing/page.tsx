"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useExamTime } from "@/lib/useExamTime";

interface Test { id: string; title: string; description: string | null; duration: number | null; isActive: boolean; _count: { questions: number }; }

export default function WritingPage() {
  const router = useRouter();
  const { schedule } = useExamTime();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignedTest, setAssignedTest] = useState<Test | null>(null);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [testsRes, attemptsRes] = await Promise.all([
          fetch("/api/tests?type=WRITING"),
          fetch("/api/attempts"),
        ]);
        const tests: Test[] = (await testsRes.json()).filter((t: Test) => t.isActive);
        const attempts = attemptsRes.ok ? await attemptsRes.json() : [];

        if (tests.length === 0) { setError("Aktiv writing testi yoxdur"); return; }

        const test = tests[Math.floor(Math.random() * tests.length)];
        setAssignedTest(test);

        if (schedule?.examDate && schedule?.startTime && schedule?.endTime) {
          const dateStr = new Date(schedule.examDate).toISOString().split("T")[0];
          const start = new Date(`${dateStr}T${schedule.startTime}:00`);
          const end = new Date(`${dateStr}T${schedule.endTime}:00`); if (end.getTime() <= start.getTime()) end.setDate(end.getDate() + 1);
          const done = attempts.find((a: any) =>
            a.test.type === "WRITING" &&
            (a.status === "COMPLETED" || a.status === "GRADED") &&
            new Date(a.startedAt) >= start && new Date(a.startedAt) <= end
          );
          if (done) { setCompleted(true); setScore(done.score); }
        }
      } catch (err: unknown) { setError(err instanceof Error ? err.message : "Xeta"); }
      finally { setLoading(false); }
    }
    load();
  }, [schedule]);

  if (loading) return <div className="flex h-64 items-center justify-center"><p className="text-muted-foreground">Yuklenir...</p></div>;
  if (error) return <div className="flex h-64 items-center justify-center"><p className="text-destructive">{error}</p></div>;
  if (!assignedTest) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Writing Test</h1>
      <div className="rounded-lg border border-border bg-card p-8">
        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">Writing</span>
        <h2 className="mt-3 text-xl font-semibold text-foreground">{assignedTest.title}</h2>
        {assignedTest.duration && <p className="mt-2 text-sm text-muted-foreground">{assignedTest.duration} deqiqe</p>}
        {completed ? (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between rounded-md bg-green-100 px-4 py-3">
              <span className="text-sm font-medium text-green-800">Tamamlanib</span>
              {score !== null ? (
                <span className="text-lg font-bold text-green-800">Band: {score}</span>
              ) : (
                <span className="text-sm text-amber-700">Qiymetlendirme gozlenilir</span>
              )}
            </div>
            <button onClick={() => router.push(`/student/tests/${assignedTest.id}/result`)}
              className="w-full rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent">
              Neticeye Bax
            </button>
          </div>
        ) : (
          <button onClick={() => router.push(`/student/tests/${assignedTest.id}`)}
            className="mt-6 w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Teste Bashla
          </button>
        )}
      </div>
    </div>
  );
}
