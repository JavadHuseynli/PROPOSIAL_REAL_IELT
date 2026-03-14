"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";

interface Attempt {
  id: string;
  startedAt: string;
  completedAt: string | null;
  score: number | null;
  status: string;
  test: {
    id: string;
    title: string;
    type: string;
  };
}

interface AverageScores {
  LISTENING: { total: number; count: number };
  READING: { total: number; count: number };
  WRITING: { total: number; count: number };
}

export default function StudentDashboard() {
  const { data: session } = useSession();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAttempts() {
      try {
        const res = await fetch("/api/attempts");
        if (!res.ok) throw new Error("Məlumatlar yüklənmədi");
        const data = await res.json();
        setAttempts(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Xəta baş verdi");
      } finally {
        setLoading(false);
      }
    }
    fetchAttempts();
  }, []);

  const recentAttempts = attempts.slice(0, 5);

  const averageScores: AverageScores = attempts.reduce(
    (acc, attempt) => {
      if (attempt.score !== null && attempt.test.type in acc) {
        const key = attempt.test.type as keyof AverageScores;
        acc[key].total += attempt.score;
        acc[key].count += 1;
      }
      return acc;
    },
    {
      LISTENING: { total: 0, count: 0 },
      READING: { total: 0, count: 0 },
      WRITING: { total: 0, count: 0 },
    } as AverageScores
  );

  const getAverage = (key: keyof AverageScores) => {
    const { total, count } = averageScores[key];
    return count > 0 ? (total / count).toFixed(1) : "-";
  };

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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Xoş gəldiniz, {session?.user?.name || "Tələbə"}!
        </h1>
        <p className="mt-1 text-muted-foreground">
          IELTS hazırlıq platformasına xoş gəldiniz
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/student/listening"
          className="rounded-lg border border-border bg-card p-6 transition-shadow hover:shadow-md"
        >
          <div className="text-2xl font-bold text-primary">Listening</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Dinləmə testləri
          </p>
        </Link>
        <Link
          href="/student/reading"
          className="rounded-lg border border-border bg-card p-6 transition-shadow hover:shadow-md"
        >
          <div className="text-2xl font-bold text-primary">Reading</div>
          <p className="mt-1 text-sm text-muted-foreground">Oxu testləri</p>
        </Link>
        <Link
          href="/student/writing"
          className="rounded-lg border border-border bg-card p-6 transition-shadow hover:shadow-md"
        >
          <div className="text-2xl font-bold text-primary">Writing</div>
          <p className="mt-1 text-sm text-muted-foreground">Yazı testləri</p>
        </Link>
      </div>

      {/* Overall Progress */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Ümumi Proqres
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(["LISTENING", "READING", "WRITING"] as const).map((type) => (
            <div
              key={type}
              className="rounded-lg border border-border bg-card p-6 text-center"
            >
              <p className="text-sm font-medium text-muted-foreground">
                {type === "LISTENING"
                  ? "Listening"
                  : type === "READING"
                    ? "Reading"
                    : "Writing"}
              </p>
              <p className="mt-2 text-3xl font-bold text-primary">
                {getAverage(type)}
              </p>
              <p className="text-xs text-muted-foreground">Ortalama Band</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Test Results */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Son Nəticələr
        </h2>
        {recentAttempts.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">
              Hələ heç bir test nəticəniz yoxdur.
            </p>
            <Link
              href="/student/tests"
              className="mt-3 inline-block text-primary hover:underline"
            >
              Testlərə baxın
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Test
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Tip
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Tarix
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Band
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentAttempts.map((attempt) => (
                  <tr
                    key={attempt.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 text-sm">
                      <Link
                        href={`/student/tests/${attempt.test.id}/result`}
                        className="text-primary hover:underline"
                      >
                        {attempt.test.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {attempt.test.type}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(attempt.startedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          attempt.status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : attempt.status === "GRADED"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {attempt.status === "COMPLETED"
                          ? "Tamamlandı"
                          : attempt.status === "GRADED"
                            ? "Qiymətləndirildi"
                            : "Davam edir"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">
                      {attempt.score !== null ? attempt.score : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
