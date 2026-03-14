"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface WritingSubmission {
  id: string;
  content: string;
  wordCount: number;
  submittedAt: string;
  writingTask: {
    taskType: string;
    prompt: string;
  };
  attempt: {
    user: { id: string; name: string; email: string };
    test: { id: string; title: string; type: string };
  };
  review: { id: string; overallBand: number; reviewedAt: string } | null;
}

interface Group {
  id: string;
  name: string;
  _count: { students: number };
}

export default function TeacherDashboardPage() {
  const [submissions, setSubmissions] = useState<WritingSubmission[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [subsRes, groupsRes] = await Promise.all([
          fetch("/api/writing-submissions?status=unreviewed"),
          fetch("/api/groups"),
        ]);

        if (!subsRes.ok || !groupsRes.ok) {
          throw new Error("Məlumatları yükləmək mümkün olmadı");
        }

        const subsData = await subsRes.json();
        const groupsData = await groupsRes.json();

        setSubmissions(subsData);
        setGroups(groupsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Xəta baş verdi");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Yüklənir...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-destructive">
        {error}
      </div>
    );
  }

  const totalStudents = groups.reduce((sum, g) => sum + g._count.students, 0);
  const pendingCount = submissions.length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Müəllim Paneli</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Gözləyən Writing Yoxlamaları
          </p>
          <p className="mt-2 text-3xl font-bold text-primary">{pendingCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Ümumi Tələbələr</p>
          <p className="mt-2 text-3xl font-bold">{totalStudents}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Qruplar</p>
          <p className="mt-2 text-3xl font-bold">{groups.length}</p>
        </div>
      </div>

      {/* Quick Link */}
      <div>
        <Link
          href="/teacher/writing-review"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Writing Yoxlamalarına keç
        </Link>
      </div>

      {/* Recent Submissions Awaiting Review */}
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="text-lg font-semibold">
            Son Gözləyən Yazı Təqdimləri
          </h2>
        </div>
        {submissions.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            Gözləyən yazı yoxdur
          </div>
        ) : (
          <div className="divide-y divide-border">
            {submissions.slice(0, 10).map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <p className="font-medium">{sub.attempt.user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {sub.attempt.test.title} &mdash;{" "}
                    {sub.writingTask.taskType === "TASK1" ? "Task 1" : "Task 2"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(sub.submittedAt)}
                  </p>
                </div>
                <Link
                  href={`/teacher/writing-review/${sub.id}`}
                  className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
                >
                  Yoxla
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
