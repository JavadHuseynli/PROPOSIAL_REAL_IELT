"use client";

import { useEffect, useState } from "react";

interface Group {
  id: string;
  name: string;
  teacher: { id: string; name: string; email: string } | null;
  _count: { students: number };
}

interface Attempt {
  id: string;
  status: string;
  score: number | null;
  startedAt: string;
  completedAt: string | null;
  test: { id: string; title: string; type: string };
}

interface GroupScore {
  groupName: string;
  avgScore: number;
  studentCount: number;
}

export default function DeanDashboardPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [groupsRes, attemptsRes] = await Promise.all([
          fetch("/api/groups"),
          fetch("/api/attempts"),
        ]);

        if (!groupsRes.ok || !attemptsRes.ok) {
          throw new Error("Məlumatları yükləmək mümkün olmadı");
        }

        const groupsData = await groupsRes.json();
        const attemptsData = await attemptsRes.json();

        setGroups(groupsData);
        setAttempts(attemptsData);
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
  const gradedAttempts = attempts.filter(
    (a) => a.status === "GRADED" && a.score !== null
  );
  const averageScore =
    gradedAttempts.length > 0
      ? gradedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) /
        gradedAttempts.length
      : 0;

  const recentAttempts = attempts.slice(0, 10);

  // Build group scores for chart (using attempts data)
  // We don't have group-level attempt data here directly, so show groups by count
  const groupScores: GroupScore[] = groups.map((g) => ({
    groupName: g.name,
    avgScore: 0, // Will show student count as bar height if no scores
    studentCount: g._count.students,
  }));

  // Find max for bar scaling
  const maxStudents = Math.max(...groupScores.map((g) => g.studentCount), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dekan Paneli</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Ümumi Tələbələr</p>
          <p className="mt-2 text-3xl font-bold">{totalStudents}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Qruplar</p>
          <p className="mt-2 text-3xl font-bold">{groups.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Orta Bal</p>
          <p className="mt-2 text-3xl font-bold">
            {averageScore > 0 ? averageScore.toFixed(1) : "—"}
          </p>
        </div>
      </div>

      {/* Bar Chart: Students by Group */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Qruplara Görə Tələbələr</h2>
        {groupScores.length === 0 ? (
          <p className="text-sm text-muted-foreground">Qrup tapılmadı</p>
        ) : (
          <div className="flex items-end gap-4" style={{ height: "200px" }}>
            {groupScores.map((gs) => {
              const heightPercent = (gs.studentCount / maxStudents) * 100;
              return (
                <div
                  key={gs.groupName}
                  className="flex flex-1 flex-col items-center justify-end"
                  style={{ height: "100%" }}
                >
                  <span className="mb-1 text-xs font-medium">
                    {gs.studentCount}
                  </span>
                  <div
                    className="w-full max-w-16 rounded-t bg-primary transition-all"
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                  />
                  <span className="mt-2 text-xs text-muted-foreground text-center truncate w-full">
                    {gs.groupName}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Test Activity */}
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="text-lg font-semibold">Son Test Fəaliyyəti</h2>
        </div>
        {recentAttempts.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            Hələ test fəaliyyəti yoxdur
          </div>
        ) : (
          <div className="overflow-hidden">
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
                {recentAttempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm">
                      {attempt.test.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {attempt.test.type}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          attempt.status === "GRADED"
                            ? "bg-green-100 text-green-800"
                            : attempt.status === "COMPLETED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {attempt.status === "GRADED"
                          ? "Qiymətləndirilib"
                          : attempt.status === "COMPLETED"
                            ? "Tamamlanıb"
                            : "Davam edir"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {attempt.score !== null
                        ? attempt.score.toFixed(1)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(attempt.startedAt).toLocaleDateString("az-AZ")}
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
