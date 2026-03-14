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

type FilterStatus = "all" | "reviewed" | "unreviewed";

export default function WritingReviewListPage() {
  const [submissions, setSubmissions] = useState<WritingSubmission[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSubmissions() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (filter === "unreviewed") params.set("status", "unreviewed");
        const res = await fetch(`/api/writing-submissions?${params}`);
        if (!res.ok) throw new Error("Məlumatları yükləmək mümkün olmadı");
        const data = await res.json();
        setSubmissions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Xəta baş verdi");
      } finally {
        setLoading(false);
      }
    }
    fetchSubmissions();
  }, [filter]);

  const filteredSubmissions =
    filter === "reviewed"
      ? submissions.filter((s) => s.review !== null)
      : filter === "unreviewed"
        ? submissions.filter((s) => s.review === null)
        : submissions;

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Writing Yoxlama</h1>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "unreviewed", "reviewed"] as FilterStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === status
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground border border-border hover:bg-accent"
            }`}
          >
            {status === "all"
              ? "Hamısı"
              : status === "unreviewed"
                ? "Yoxlanmamış"
                : "Yoxlanmış"}
          </button>
        ))}
      </div>

      {/* Submissions Table */}
      {filteredSubmissions.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          Yazı tapılmadı
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Tələbə
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Test
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Task
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Tarix
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Band
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSubmissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm">
                    {sub.attempt.user.name}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {sub.attempt.test.title}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {sub.writingTask.taskType === "TASK1" ? "Task 1" : "Task 2"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(sub.submittedAt)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {sub.review ? (
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        Yoxlanmış
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                        Gözləyir
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {sub.review ? sub.review.overallBand.toFixed(1) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/teacher/writing-review/${sub.id}`}
                      className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
                    >
                      {sub.review ? "Bax" : "Yoxla"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
