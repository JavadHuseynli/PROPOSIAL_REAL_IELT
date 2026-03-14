"use client";

import { useEffect, useState } from "react";
import { TEST_TYPE_LABELS } from "@/lib/constants";

interface Attempt {
  id: string;
  userId: string;
  testId: string;
  score: number | null;
  status: string;
  test: {
    id: string;
    title: string;
    type: string;
  };
  user: {
    id: string;
    name: string;
    groupId: string | null;
  };
}

interface Group {
  id: string;
  name: string;
  teacher: { id: string; name: string } | null;
  _count: { students: number };
}

export default function AdminReportsPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [attemptsRes, groupsRes] = await Promise.all([
          fetch("/api/attempts"),
          fetch("/api/groups"),
        ]);

        if (!attemptsRes.ok || !groupsRes.ok) {
          throw new Error("Məlumatları yükləmək mümkün olmadı");
        }

        const [attemptsData, groupsData] = await Promise.all([
          attemptsRes.json(),
          groupsRes.json(),
        ]);

        setAttempts(Array.isArray(attemptsData) ? attemptsData : []);
        setGroups(groupsData);
      } catch (err: any) {
        setError(err.message || "Xəta baş verdi");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Yüklənir...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
        {error}
      </div>
    );
  }

  const gradedAttempts = attempts.filter(
    (a) => a.status === "GRADED" || (a.status === "COMPLETED" && a.score !== null)
  );

  // Average scores by test type
  const avgByType = Object.keys(TEST_TYPE_LABELS).map((type) => {
    const typeAttempts = gradedAttempts.filter((a) => a.test?.type === type);
    const avg =
      typeAttempts.length > 0
        ? typeAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / typeAttempts.length
        : 0;
    return {
      type,
      label: TEST_TYPE_LABELS[type],
      average: avg,
      total: typeAttempts.length,
    };
  });

  // Group performance
  const groupPerformance = groups.map((group) => {
    const groupAttempts = gradedAttempts.filter(
      (a) => a.user?.groupId === group.id
    );
    const avg =
      groupAttempts.length > 0
        ? groupAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / groupAttempts.length
        : 0;

    // Per-type averages for this group
    const byType = Object.keys(TEST_TYPE_LABELS).reduce(
      (acc, type) => {
        const typeAttempts = groupAttempts.filter((a) => a.test?.type === type);
        acc[type] =
          typeAttempts.length > 0
            ? typeAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / typeAttempts.length
            : null;
        return acc;
      },
      {} as Record<string, number | null>
    );

    return {
      group,
      average: avg,
      totalAttempts: groupAttempts.length,
      byType,
    };
  });

  const totalAttempts = attempts.length;
  const completedAttempts = attempts.filter(
    (a) => a.status === "COMPLETED" || a.status === "GRADED"
  ).length;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Hesabatlar</h1>

      {/* Summary cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-sm text-muted-foreground">Ümumi Cəhdlər</div>
          <div className="mt-1 text-3xl font-bold text-foreground">{totalAttempts}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-sm text-muted-foreground">Tamamlanmış</div>
          <div className="mt-1 text-3xl font-bold text-foreground">{completedAttempts}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-sm text-muted-foreground">Qiymətləndirilmiş</div>
          <div className="mt-1 text-3xl font-bold text-foreground">{gradedAttempts.length}</div>
        </div>
      </div>

      {/* Average scores by test type */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Test Tipinə Görə Orta Bal
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {avgByType.map((item) => (
            <div key={item.type} className="rounded-lg border border-border bg-card p-5">
              <div className="text-sm text-muted-foreground">{item.label}</div>
              <div className="mt-1 text-3xl font-bold text-foreground">
                {item.total > 0 ? item.average.toFixed(1) : "—"}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {item.total} qiymətləndirilmiş cəhd
              </div>
              {item.total > 0 && (
                <div className="mt-3">
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${Math.min((item.average / 9) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="mt-1 text-right text-xs text-muted-foreground">
                    / 9.0
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Group performance table */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Qrup Performansı
        </h2>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-medium text-muted-foreground">Qrup</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Müəllim</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Tələbə Sayı</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Cəhdlər</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Orta Bal</th>
                {Object.values(TEST_TYPE_LABELS).map((label) => (
                  <th key={label} className="px-4 py-3 font-medium text-muted-foreground">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupPerformance.map((gp) => (
                <tr key={gp.group.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{gp.group.name}</td>
                  <td className="px-4 py-3 text-foreground">
                    {gp.group.teacher?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-foreground">{gp.group._count.students}</td>
                  <td className="px-4 py-3 text-foreground">{gp.totalAttempts}</td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {gp.totalAttempts > 0 ? gp.average.toFixed(1) : "—"}
                  </td>
                  {Object.keys(TEST_TYPE_LABELS).map((type) => (
                    <td key={type} className="px-4 py-3 text-foreground">
                      {gp.byType[type] !== null ? gp.byType[type]!.toFixed(1) : "—"}
                    </td>
                  ))}
                </tr>
              ))}
              {groupPerformance.length === 0 && (
                <tr>
                  <td
                    colSpan={5 + Object.keys(TEST_TYPE_LABELS).length}
                    className="px-4 py-6 text-center text-muted-foreground"
                  >
                    Hələ qrup yoxdur
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
