"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { ATTEMPT_STATUS_LABELS, TEST_TYPE_LABELS } from "@/lib/constants";

interface Attempt {
  id: string;
  status: string;
  score: number | null;
  startedAt: string;
  completedAt: string | null;
  test: { id: string; title: string; type: string; description: string | null };
}

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
  review: {
    id: string;
    overallBand: number;
    taskAchievement: number;
    coherenceCohesion: number;
    lexicalResource: number;
    grammaticalRange: number;
    reviewedAt: string;
  } | null;
}

interface StudentUser {
  id: string;
  name: string;
  email: string;
  group: { id: string; name: string } | null;
  createdAt: string;
}

export default function DeanStudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [student, setStudent] = useState<StudentUser | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [submissions, setSubmissions] = useState<WritingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [userRes, attemptsRes, subsRes] = await Promise.all([
          fetch(`/api/users/${studentId}`),
          fetch(`/api/attempts?userId=${studentId}`),
          fetch("/api/writing-submissions"),
        ]);

        if (!userRes.ok) throw new Error("Tələbə tapılmadı");

        const userData = await userRes.json();
        setStudent(userData);

        if (attemptsRes.ok) {
          const attemptsData = await attemptsRes.json();
          setAttempts(attemptsData);
        }

        if (subsRes.ok) {
          const allSubs: WritingSubmission[] = await subsRes.json();
          // Filter to only this student's submissions
          const studentSubs = allSubs.filter(
            (s) => s.attempt.user.id === studentId
          );
          setSubmissions(studentSubs);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Xəta baş verdi");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [studentId]);

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

  if (!student) return null;

  // Build progress table: group attempts by test type and show score over time
  const gradedByType: Record<string, { date: string; score: number }[]> = {};
  for (const att of attempts) {
    if (att.status === "GRADED" && att.score !== null) {
      const type = att.test.type;
      if (!gradedByType[type]) gradedByType[type] = [];
      gradedByType[type].push({
        date: att.completedAt || att.startedAt,
        score: att.score,
      });
    }
  }

  // Sort each by date
  for (const type of Object.keys(gradedByType)) {
    gradedByType[type].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{student.name}</h1>
          <p className="text-sm text-muted-foreground">
            {student.email} &mdash; Qrup:{" "}
            {student.group?.name || "Təyin edilməyib"}
          </p>
          <p className="text-xs text-muted-foreground">
            Qeydiyyat: {formatDate(student.createdAt)}
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="text-sm text-muted-foreground hover:underline"
        >
          Geri qayıt
        </button>
      </div>

      {/* All Test Attempts */}
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="text-lg font-semibold">Test Cəhdləri</h2>
        </div>
        {attempts.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            Hələ test cəhdi yoxdur
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Test
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Növ
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Bal
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Tarix
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {attempts.map((att) => (
                <tr key={att.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm">{att.test.title}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {TEST_TYPE_LABELS[att.test.type] || att.test.type}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        att.status === "GRADED"
                          ? "bg-green-100 text-green-800"
                          : att.status === "COMPLETED"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {ATTEMPT_STATUS_LABELS[att.status] || att.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {att.score !== null ? att.score.toFixed(1) : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(att.startedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Writing Submissions */}
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="text-lg font-semibold">Writing Təqdimləri</h2>
        </div>
        {submissions.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            Hələ writing təqdimi yoxdur
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Test
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Task
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Söz Sayı
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Band
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  TA
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  CC
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  LR
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  GR
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Tarix
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm">
                    {sub.attempt.test.title}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {sub.writingTask.taskType === "TASK1" ? "Task 1" : "Task 2"}
                  </td>
                  <td className="px-4 py-3 text-sm">{sub.wordCount}</td>
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
                  <td className="px-4 py-3 text-sm font-bold">
                    {sub.review ? sub.review.overallBand.toFixed(1) : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {sub.review ? sub.review.taskAchievement.toFixed(1) : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {sub.review
                      ? sub.review.coherenceCohesion.toFixed(1)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {sub.review ? sub.review.lexicalResource.toFixed(1) : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {sub.review
                      ? sub.review.grammaticalRange.toFixed(1)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(sub.submittedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Progress Over Time */}
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="text-lg font-semibold">Proqres (Zamana Görə)</h2>
        </div>
        {Object.keys(gradedByType).length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            Hələ qiymətləndirilmiş nəticə yoxdur
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {Object.entries(gradedByType).map(([type, entries]) => (
              <div key={type}>
                <h3 className="mb-2 text-sm font-semibold">
                  {TEST_TYPE_LABELS[type] || type}
                </h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-3 py-1.5 text-left text-xs font-medium">
                        #
                      </th>
                      <th className="px-3 py-1.5 text-left text-xs font-medium">
                        Tarix
                      </th>
                      <th className="px-3 py-1.5 text-left text-xs font-medium">
                        Bal
                      </th>
                      <th className="px-3 py-1.5 text-left text-xs font-medium">
                        Dəyişiklik
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {entries.map((entry, i) => {
                      const prev = i > 0 ? entries[i - 1].score : null;
                      const diff =
                        prev !== null ? entry.score - prev : null;
                      return (
                        <tr key={i} className="hover:bg-muted/20">
                          <td className="px-3 py-1.5 text-xs">{i + 1}</td>
                          <td className="px-3 py-1.5 text-xs">
                            {formatDate(entry.date)}
                          </td>
                          <td className="px-3 py-1.5 text-xs font-medium">
                            {entry.score.toFixed(1)}
                          </td>
                          <td className="px-3 py-1.5 text-xs">
                            {diff !== null ? (
                              <span
                                className={
                                  diff > 0
                                    ? "text-green-600"
                                    : diff < 0
                                      ? "text-red-600"
                                      : "text-muted-foreground"
                                }
                              >
                                {diff > 0 ? "+" : ""}
                                {diff.toFixed(1)}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
