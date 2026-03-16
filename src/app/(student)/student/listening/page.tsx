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

export default function ListeningPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignedTest, setAssignedTest] = useState<Test | null>(null);

  useEffect(() => {
    async function assignTest() {
      try {
        const res = await fetch("/api/tests?type=LISTENING");
        if (!res.ok) throw new Error("Testler yuklenilmedi");
        const tests: Test[] = (await res.json()).filter((t: Test) => t.isActive);
        if (tests.length === 0) { setError("Aktiv listening testi yoxdur"); return; }
        const test = tests[Math.floor(Math.random() * tests.length)];
        setAssignedTest(test);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Xeta");
      } finally { setLoading(false); }
    }
    assignTest();
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><p className="text-muted-foreground">Yuklenir...</p></div>;
  if (error) return <div className="flex h-64 items-center justify-center"><p className="text-destructive">{error}</p></div>;
  if (!assignedTest) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Listening Test</h1>
      </div>
      <div className="rounded-lg border border-border bg-card p-8">
        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">Listening</span>
        <h2 className="mt-3 text-xl font-semibold text-foreground">{assignedTest.title}</h2>
        {assignedTest.description && <p className="mt-2 text-sm text-muted-foreground">{assignedTest.description}</p>}
        <div className="mt-4 text-sm text-muted-foreground">
          {assignedTest.duration && <span>{assignedTest.duration} deqiqe</span>}
        </div>
        <button
          onClick={() => router.push(`/student/tests/${assignedTest.id}`)}
          className="mt-6 w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Teste Bashla
        </button>
      </div>
    </div>
  );
}
